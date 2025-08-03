from django.urls import path
from goodBuy_web.views import *
from goodBuy_web.views.user_login_register import *
from goodBuy_web.views.user_profile import view_profile
from goodBuy_web.views import user_profile as views

urlpatterns = [
    path('editprofile/', editProfile, name='editprofile'),
    path('payment_accounts/', payment_accounts, name='payment_accounts'),

    path('blacklist/', view_blacklist, name='blacklist'),
    path('blacklist/add', add_to_blacklist, name='blacklist_add'),
    path('blacklist/remove', remove_from_blacklist, name='blacklist_remove'),
    path('profile/<int:user_id>/', view_profile, name='view_profile'),
    path('user/profile/<int:user_id>/more/<str:tab>/', views.user_more, name='user_more'),
]