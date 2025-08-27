from django.urls import path
from ..views import *

urlpatterns = [
    path('<int:tag_id>/collect/', tag_collect_toggle, name='tag_collect_toggle'),
    path('my_collect/', my_tags_collected, name='my_tags_collected'),
]
