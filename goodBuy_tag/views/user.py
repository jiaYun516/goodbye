from django.db.models import *
from django.contrib import messages
from django.shortcuts import *
from django.contrib.auth.decorators import login_required
from django.utils import timezone

from ..models import *
from utils import *
# -------------------------
# 標籤收藏
# -------------------------
@login_required(login_url='login')
@tag_exists_required
def tag_collect_toggle(request, tag):
    obj = TagCollect.objects.filter(user=request.user, tag=tag).first()
    if obj:
        obj.delete()
        messages.info(request, '已取消收藏')
        print('取消收藏')
    else:
        TagCollect.objects.create(user=request.user, tag=tag, date=timezone.now())
        messages.success(request, '收藏成功')
        print('收藏成功')

    return redirect('tagById_one', tag_id=tag.id)
# -------------------------
# 標籤收藏查看
# -------------------------
@login_required(login_url='login')
def my_tags_collected(request):
    tag_ids = TagCollect.objects.filter(user=request.user).values_list('tag_id', flat=True)

    tags = Tag.objects.filter(id__in=tag_ids)
    return render(request, 'tag_collect.html', locals())