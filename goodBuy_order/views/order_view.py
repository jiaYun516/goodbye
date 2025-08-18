from django.shortcuts import *
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from collections import defaultdict
from django.db.models import Sum

from goodBuy_shop.models import *
from goodBuy_shop.views import shopInformation_many
from goodBuy_web.models import *
from ..models import *
from ..utils import *
from ..rush_utils import *
from utils import *
# -------------------------
# 訂單顯示 - 全部 - 分類+all
# url參數傳入說明：?state=1&?role=seller
# -------------------------
@login_required(login_url='login')
def order_list(request):
    state = request.GET.get('state')    # 狀態篩選，可能的值有 '1', '2', ..., '6'，或 '7' 代表已取消
    shop_id = request.GET.get('shop')   # 商店篩選，傳入商店ID
    role = request.GET.get('role', 'buyer')  # 角色篩選，可能的值有 'buyer' 或 'seller'

    # 預設空 QuerySet
    orders = Order.objects.none()
    shop = None

    if role == 'buyer':
        # 查自己買的
        orders = Order.objects.filter(user=request.user)
    elif role == 'seller':
        # 查自己賣出的
        orders = Order.objects.filter(shop__owner=request.user)

    # 商店篩選
    if shop_id:
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            messages.error(request, "商店不存在")
            return redirect('home')

        if role == 'seller':
            # 賣家模式檢查店主
            if shop.owner != request.user:
                messages.error(request, "無權查看此商店的訂單")
                return redirect('home')
        else:
            # 買家模式檢查店是否公開
            if shop.permission not in [1, 2]:
                messages.error(request, "商店不存在")
                return redirect('home')

        orders = orders.filter(shop=shop)

    # 狀態篩選
    if state:
        if state == '7':
            orders = orders.filter(order_state_id__in=[7, 8, 9, 10])
        else:
            orders = orders.filter(order_state_id=state)

    # 標題設定
    if state in ['7', '8', '9', '10']:
        title = '已取消'
    elif state:
        title = OrderState.objects.get(id=state).name
    else:
        title = '全部'

    return render(request, 'order_list.html', {
        'title': title,
        'orders': orders,
        'shop': shop,
        'role': role
    })

# -------------------------
# 訂單顯示 - 單一
# -------------------------
@login_required(login_url='login')
@order_exists_required
def order_detail(request, order):
    if order.user != request.user and order.shop.owner != request.user:
        messages.error(request, "無權查看此訂單")
        return redirect('home')

    product_orders = ProductOrder.objects.filter(order=order).select_related('product')

    if order.payment_category == 'remittance':
        payments = OrderPayment.objects.filter(order_id=order.id).order_by('-pay_time')
    else:
        payments = None

    deposit_amount = None
    tail_amount = None
    if order.payment_mode == 'split':
        deposit_ratio = order.shop.deposit_ratio or 50
        deposit_amount = order.total * deposit_ratio // 100
        tail_amount = (order.total - deposit_amount) + (order.second_supplement or 0)

    return render(request, 'order_detail.html', {'order':order,
                                                'product_orders': product_orders, 
                                                'payment':payments,
                                                'deposit_amount':deposit_amount,
                                                'tail_amount':tail_amount})
# -------------------------
# 待付款&付款記錄顯示 - 僅買家
# -------------------------
@login_required(login_url='login')
def my_payment_records(request):
    payments = OrderPayment.objects.filter(order__user=request.user)\
    .exclude(shop_payment__payment_account_id=1)\
    .select_related('order', 'shop_payment', 'order__shop')

    wait_confirmed = payments.filter(seller_state='wait confirmed')
    confirmed = payments.filter(seller_state='confirmed')
    returned = payments.filter(seller_state='returned')
    overdue = payments.filter(seller_state='overdue')

    return render(request, 'payment_records.html', {'wait_confirmed': wait_confirmed,
                                                    'confirmed': confirmed,
                                                    'returned': returned,
                                                    'overdue': overdue})
# -------------------------
# 多帶進行中 - 買家
# -------------------------
login_required(login_url='login')
def my_rush_shops(request):
    now = timezone.now()
    shop_ids = PurchaseIntent.objects.filter(
        user=request.user,
        shop__purchase_priority_id__in=[2, 3],
        shop__end_time__gt=now,
        shop__permission__id=1,
    ).values_list('shop_id', flat=True).distinct()

    shops = shopInformation_many(Shop.objects.filter(id__in=shop_ids))

    return render(request, 'my_rush_shops.html', {'shops': shops})
# -------------------------
# 多帶進行中 - 買家 - 單一
# -------------------------
@login_required(login_url='login')
@rush_exists_and_shop_exist_required
def my_rush_status_in_intent(request, shop, intent):
    now = timezone.now()
    remaining_seconds = (shop.end_time - now).total_seconds()

    intent_summaries = get_rush_summaries(shop, user=request.user)

    target_summary = None
    for summary in intent_summaries:
        if summary['user'] == request.user:
            target_summary = summary
            break

    if not target_summary:
        return redirect('some_error_page')

    product_list = target_summary['products']
    total_quantity = target_summary['total_quantity']
    total_price = target_summary['total_price']

    product_list.sort(key=lambda x: (not x['is_successful'], x['product'].id))

    # 顯示格式需要再測試確認
    return render(request, 'my_rush_status_in_shop.html', {'shop': shop,
                                                            'intent': intent,
                                                            'remaining_seconds': remaining_seconds,
                                                            'product_list': product_list,
                                                            'total_quantity': total_quantity,
                                                            'total_price': total_price,
                                                            'target_summary': target_summary
                                                            })
# -------------------------
# 多帶進行中 - 購買優先表格
# -------------------------
@login_required(login_url='login')
def purchase_priority_table(request, shop_id):
    shop = get_object_or_404(Shop, id=shop_id)

    # 顯示標題與模式（2=金額優先；3=數量優先）
    priority_mode = 'amount' if shop.purchase_priority_id == 2 else 'quantity'
    title = "金額多帶優先表" if priority_mode == 'amount' else "數量多帶優先表"

    # 商品（只取有庫存、未刪除者；若你要顯示缺貨也能帶進來就拿掉 stock>0）
    products = list(
        Product.objects
        .filter(shop=shop, is_delete=False)
        .only('id', 'name', 'stock', 'price')
        .order_by('id')
    )
    if not products:
        return render(request, 'priority_table.html', {
            'shop': shop, 'priority_mode': priority_mode, 'priority_title': title,
            'product_list': [], 'headers': [], 'rows': [], 'buyers_summary': []
        })

    product_ids = [p.id for p in products]
    prod_by_id = {p.id: p for p in products}

    # 1) 取得「已排序」的使用者搶購摘要（核心：使用你剛完成的邏輯）
    #    傳入 request.user 會讓 summaries 在自己那筆附上 self_view（可用於顯示）
    summaries = get_rush_summaries(shop, user=request.user)

    # 2) 準備上方統計（buyers_summary）與每位買家對各商品的最終需求量
    buyers_summary = []
    buyer_rows = []  # 以 username + per_product 快取，便於分配矩陣使用
    for s in summaries:
        user = s['user']
        username = getattr(getattr(user, 'profile', None), 'nickname', None) or user.username

        # s['products'] 為 [(product, quantity), ...]（或 namedtuple）
        per_product = {ip.product.id: int(ip.quantity) for ip in s['products']}

        buyers_summary.append({
            'username': username,
            'total_amount': s['total_price'],
            'total_qty': s['total_quantity'],
            'product_quantities': per_product,  # 若模板不用可移除
        })
        buyer_rows.append((username, per_product))

    # 3) 依排序結果，逐品項建立「分配矩陣」
    #    alloc_col[pid] = ['userA','userA','userB', ...] 長度 <= stock
    alloc_col = {pid: [] for pid in product_ids}
    for username, per_product in buyer_rows:
        for pid, want_qty in per_product.items():
            if pid not in prod_by_id:
                continue
            stock = prod_by_id[pid].stock
            if stock <= 0 or want_qty <= 0:
                continue
            col = alloc_col[pid]
            free_slots = max(stock - len(col), 0)
            if free_slots <= 0:
                continue
            take = min(want_qty, free_slots)
            # 以「需求件數」填入對應數量的 username（可視覺化誰拿到幾件）
            col.extend([username] * take)

    # 4) 組成表格資料（headers / rows）
    max_rows = max((p.stock for p in products), default=0)
    headers = [{'id': p.id, 'name': p.name, 'stock': p.stock} for p in products]

    rows = []
    for r in range(max_rows):
        row_cells = []
        for p in products:
            s = p.stock
            col = alloc_col[p.id]
            if r >= s:
                cell = '-'                      # 超出庫存的列
            else:
                cell = col[r] if r < len(col) else ''  # 有庫存但尚未被分配
            row_cells.append(cell)
        rows.append(row_cells)

    return render(request, 'priority_table.html', {
        'shop': shop,
        'priority_mode': priority_mode,
        'priority_title': title,
        'product_list': products,
        'headers': headers,
        'rows': rows,
        'buyers_summary': buyers_summary,
    })

