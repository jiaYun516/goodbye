from django.urls import path
from goodBuy_tag.views import *

urlpatterns = [
    path('api/search', tag_search_api, name='tag_search_api'),
    path('<int:tag_id>/', tagById_one, name='tagById_one'),
]