from django.template.loader import render_to_string
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from goodBuy_order.models import * 


@login_required
def seller(request):
    pending_orders = Order.objects.filter(
        shop__owner=request.user,
        order_state_id=2
    ).select_related('shop', 'order_state', 'user')

     # 取得「待確認付款」付款列表
    pending_payments = OrderPayment.objects.filter(
        order__shop__owner=request.user,
        seller_state='wait_confirmed'
    ).select_related('order', 'shop_payment', 'order__user').order_by('-pay_time')
    

    shipping_orders = ProductOrder.objects.filter(
        order__shop__owner=request.user,
        order__order_state_id=4
    ).select_related('order', 'product', 'order__user')


    shipped_orders = ProductOrder.objects.filter(
        order__shop__owner=request.user,
        order__order_state_id=5
    ).select_related('order', 'product', 'order__user')

    # 渲染 Tab 片段（如果你想分開渲染）
    tab_order_html = render_to_string('tabs/order.html', {'pending_orders': pending_orders})
    tab_payment_html = render_to_string('tabs/payment.html', {'pending_payments': pending_payments})
    tab_shipping_html = render_to_string('tabs/shipping.html', {'shipping_orders': shipping_orders, 'shipped_orders': shipped_orders,})  

    

    return render(request, 'seller.html', {
        'tab_order': tab_order_html,
        'tab_payment': tab_payment_html,
        'tab_shipping': tab_shipping_html,
    })
