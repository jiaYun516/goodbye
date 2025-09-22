from django.db import models, transaction
from django.db.models import Sum
from goodBuy_web.models import User
from goodBuy_shop.models import Shop, Product

# -------------------------
# 多帶表
# -------------------------
class PurchaseIntent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    create_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user} 對 {self.shop} 多帶'
    
    @transaction.atomic
    def add_or_update_product(self, product, add_qty: int):
        from .intent_product import IntentProduct
        """
        安全地把某商品加入/累加到這個意向中：
        - 行鎖 Product 與選到的 IntentProduct
        - 不讓同一使用者的意向總量超過庫存剩餘（扣除其他人的意向）
        回傳 (IntentProduct, 實際增加量, 目前自己的總量, 全體可分配上限)
        """
        # 查商品 + 加鎖
        p = Product.objects.select_for_update().select_related('shop').get(pk=product.pk)

        # 取得/建立本人的 IntentProduct（設 quantity=0 避免 NOT NULL）
        ip, _ = IntentProduct.objects.get_or_create(
            intent=self, product=p, defaults={'quantity': 0}
        )
        # 再鎖這筆行
        ip = IntentProduct.objects.select_for_update().get(pk=ip.pk)

        # 其他人的意向總量（不含自己這筆）
        others_total = (IntentProduct.objects
                        .filter(product=p)
                        .exclude(pk=ip.pk)
                        .aggregate(total=Sum('quantity'))['total'] or 0)

        # 全體剩餘可分配
        remaining_for_all = max(p.stock - others_total, 0)

        # 本次可增加量
        add_qty = int(add_qty or 0)
        if add_qty < 0:
            add_qty = 0

        self_old = ip.quantity
        self_new = min(self_old + add_qty, remaining_for_all)
        real_add = max(self_new - self_old, 0)

        if real_add > 0:
            ip.quantity = self_new
            ip.save(update_fields=['quantity'])

        return ip, real_add, self_new, remaining_for_all