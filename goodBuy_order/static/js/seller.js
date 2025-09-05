console.log('[seller.js] loaded');

document.addEventListener('DOMContentLoaded', () => {
  // 把所有 tab 名字列進來
  const tabs = ['sellerall', 'order', 'payment', 'shipping', 'shipped', 'completed', 'cancelled'];
  const buttons = document.querySelectorAll('.action-btn');

  function showTab(tabName) {
    tabs.forEach(name => {
      const el = document.getElementById('tab-' + name);
      if (!el) return;

      if (name === tabName) {
        el.classList.remove('d-none');
        el.style.display = '';
      } else {
        el.classList.add('d-none');
        el.style.display = 'none';
      }
    });

    // 切換按鈕樣式 + ARIA
    buttons.forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // 更新網址 hash（保留 query string）
    const base = location.pathname + location.search + '#' + tabName;
    if (location.hash !== '#' + tabName) {
      history.replaceState(null, '', base);
    }
  }

  // 設定按鈕 role & 綁定事件
  buttons.forEach(btn => {
    const tabName = btn.getAttribute('data-tab');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', 'tab-' + tabName);

    btn.addEventListener('click', () => showTab(tabName));
  });

  // 預設顯示（依 hash，否則顯示第一個 tab）
  const initial = (location.hash || '').replace('#', '');
  if (tabs.includes(initial)) {
    showTab(initial);
  } else if (buttons[0]) {
    showTab(buttons[0].getAttribute('data-tab'));
  }

  // 支援手動改 hash / 返回鍵
  window.addEventListener('hashchange', () => {
    const current = (location.hash || '').replace('#', '');
    if (tabs.includes(current)) showTab(current);
  });
});

// 全域確認框
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.js-confirm');
  if (btn && !confirm(btn.dataset.msg || '確定要執行此操作嗎？')) {
    e.preventDefault();
  }
});
