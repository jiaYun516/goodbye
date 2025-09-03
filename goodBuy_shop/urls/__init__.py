from .shop import urlpatterns as shop_urlpatterns
from .user import urlpatterns as user_urlpatterns

urlpatterns = shop_urlpatterns + \
            user_urlpatterns
