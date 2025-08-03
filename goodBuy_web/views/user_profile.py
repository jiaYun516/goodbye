from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Avg
from goodBuy_web.models import User
from goodBuy_shop.models import Shop, ShopImg
from goodBuy_want.models import Want, WantImg
from goodBuy_order.models import Comment

def view_profile(request, user_id):
    profile_user = get_object_or_404(User, id=user_id)
    user_shops = Shop.objects.filter(owner=profile_user)
    user_wants = Want.objects.filter(user=profile_user)

    # 幫每個 shop 補 cover_img、價格等欄位
    for shop in user_shops:
        shop.cover_img = ShopImg.objects.filter(shop=shop, is_cover=True).first()
        products = shop.product_set.all()
        if products.exists():
            prices = [p.price for p in products]
            shop.price_min = min(prices)
            shop.price_max = max(prices)
        else:
            shop.price_min = shop.price_max = 0
        shop.status = shop.shop_state.name if hasattr(shop, 'shop_state') else ''

    # 幫每個 want 補 cover_img 和狀態
    for want in user_wants:
        want.cover_img = WantImg.objects.filter(want=want, is_cover=True).first()
        want.status = want.permission.name if hasattr(want, 'permission') else ''

    # ---------- 信譽度 & 基本統計 ----------
    # average_rank = Comment.objects.filter(order__shop__owner=profile_user).aggregate(avg_rank=Avg('rank'))['avg_rank'] or 0
    fans_count = getattr(profile_user, "fans_count", 0)
    shop_count = user_shops.count()
    buy_count = getattr(profile_user, "buy_count", 0)

    return render(request, 'common/profile.html', {
        'profile_user': profile_user,
        'user_shops': user_shops,
        'user_wants': user_wants,
        # 'average_rank': average_rank,
        'fans_count': fans_count,
        'shop_count': shop_count,
        'buy_count': buy_count,
    })

def user_more(request, user_id, tab):
    profile_user = get_object_or_404(User, id=user_id)
    if tab == 'shops':
        items = Shop.objects.filter(owner=profile_user)
        for shop in items:
            shop.cover_img = ShopImg.objects.filter(shop=shop, is_cover=True).first()
            products = shop.product_set.all()
            if products.exists():
                prices = [p.price for p in products]
                shop.price_min = min(prices)
                shop.price_max = max(prices)
            else:
                shop.price_min = shop.price_max = 0
            shop.status = shop.shop_state.name if hasattr(shop, 'shop_state') else ''
        is_shop = True
    elif tab == 'wants':
        items = Want.objects.filter(user=profile_user)
        for want in items:
            want.cover_img = WantImg.objects.filter(want=want, is_cover=True).first()
            want.status = want.permission.name if hasattr(want, 'permission') else ''
        is_shop = False
    else:
        # 參數錯誤，回首頁或 404
        return redirect('home')

    return render(request, 'common/user_more.html', {
        'profile_user': profile_user,
        'tab': tab,      # 給 template 用於 if 判斷
        'items': items,  # 賣場或收物列表
        'is_shop': is_shop,
    })
