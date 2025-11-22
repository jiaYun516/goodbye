from django.shortcuts import redirect
from functools import wraps
from django.contrib import messages
from django.db.models import *
from django.shortcuts import *
import re


from .models import *

def get_blocked_user_ids(user):
    if not user or not user.is_authenticated:
        return []

    # 自己封鎖別人的
    blocked_by_me = Blacklist.objects.filter(user=user).values_list('black_user_id', flat=True)
    # 被對方封鎖
    blocked_me = Blacklist.objects.filter(black_user=user).values_list('user_id', flat=True)

    # 合併成一個 set
    return set(blocked_by_me).union(set(blocked_me))

def validate_tw_id(twid: str) -> bool:
    twid = twid.upper()
    if not re.match(r"^[A-Z][12]\d{8}$", twid):
        return False

    letters = "ABCDEFGHJKLMNPQRSTUVXYWZIO"
    code = letters.index(twid[0]) + 10
    A1 = code // 10
    A2 = code % 10

    digits = [int(x) for x in twid[1:]]
    weights = [8, 7, 6, 5, 4, 3, 2, 1]  # d1~d8 的權重
    total = A1*1 + A2*9
    for d, w in zip(digits[:-1], weights):
        total += d * w

    checksum = digits[-1]
    return (total + checksum) % 10 == 0