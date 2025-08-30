from django.db import models
from .shop import Shop
from goodBuy_web.models import PaymentAccount

# -------------------------
# 商店支援的付款方式
# -------------------------
class ShopPayment(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    payment_account = models.ForeignKey(PaymentAccount, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['shop', 'payment_account'], name='unique_shop_payment_account')
        ]
    
    def __str__(self):
        return self.id