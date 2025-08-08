from django.db import models
from .purchase_intent import *
from goodBuy_shop.models import Product
from .purchase_intent import PurchaseIntent
from django.db.models import Q

# -------------------------
# 多帶表product
# -------------------------
class IntentProduct(models.Model):
    intent = models.ForeignKey(PurchaseIntent, on_delete=models.CASCADE, related_name='intent_products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['intent', 'product'], name='uniq_intent_product'),
            models.CheckConstraint(check=Q(quantity__gte=0), name='qty_nonnegative'),
        ]