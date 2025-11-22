from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import Avg
# -------------------------
# 使用者
# -------------------------
class User(AbstractUser):
    email = models.EmailField(unique=True)
    introduce = models.TextField(blank=True, null=True)
    img = models.ImageField(upload_to='user_img/', null=True, blank=True)
    id_hash = models.CharField(max_length=64, null=True, blank=True)

    def __str__(self):
        return self.username  

    @property
    # 賣家星級
    def average_rank_as_seller(self):
        from goodBuy_order.models import Comment
        return Comment.objects.filter(target=self, role='buyer').aggregate(avg=Avg('rank'))['avg']

    @property
    # 買家星級
    def average_rank_as_buyer(self):
        from goodBuy_order.models import Comment
        return Comment.objects.filter(target=self, role='seller').aggregate(avg=Avg('rank'))['avg']