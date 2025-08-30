// static/js/blacklist_popover.js
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('#profile-header, .profile-header');
  const avatar = document.querySelector('.profile-avatar');
  const nameEl = document.querySelector('.profile-name');
  const pop = document.getElementById('bl-popover');
  if (!header || !pop || (!avatar && !nameEl)) return;

  // 固定錨點定位：永遠放在 .profile-header 右上角往內 16px
  function openAtFixedAnchor() {
    pop.hidden = false;
    requestAnimationFrame(() => {
      const rect = header.getBoundingClientRect();
      const pw = pop.offsetWidth || 180;
      const ph = pop.offsetHeight || 48;

      // 右上角往內 16px（可調整）
      let x = rect.right - pw - 850;
      let y = rect.top + 230;

      // 邊界保護
      x = Math.max(8, Math.min(x, window.innerWidth  - pw - 8));
      y = Math.max(8, Math.min(y, window.innerHeight - ph - 8));

      pop.style.left = x + 'px';
      pop.style.top  = y + 'px';
    });
  }

  // 只在點到頭貼或名字時開啟
  function tryOpen(ev) {
    const onTarget = ev.target.closest('.profile-avatar, .profile-name');
    if (!onTarget) return;

    // 右鍵在目標上 → 阻止原生選單；左鍵則不影響
    if (ev.type === 'contextmenu') ev.preventDefault();

    ev.stopPropagation();
    openAtFixedAnchor();
  }

  // 左鍵與右鍵都支援
  if (avatar) {
    avatar.addEventListener('click', tryOpen);
    avatar.addEventListener('contextmenu', tryOpen);
  }
  if (nameEl) {
    nameEl.addEventListener('click', tryOpen);
    nameEl.addEventListener('contextmenu', tryOpen);
  }

  // 關閉：點外面 / 外部右鍵 / ESC / 捲動 / 縮放
  document.addEventListener('click', (ev) => {
    if (!pop.hidden && !ev.target.closest('#bl-popover')) pop.hidden = true;
  });
  document.addEventListener('contextmenu', (ev) => {
    if (!pop.hidden && !ev.target.closest('.profile-avatar, .profile-name, #bl-popover')) {
      // 不阻止預設，讓外部仍顯示原生選單
      pop.hidden = true;
    }
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') pop.hidden = true; });
  window.addEventListener('scroll', () => { if (!pop.hidden) pop.hidden = true; }, { passive: true });
  window.addEventListener('resize', () => { if (!pop.hidden) pop.hidden = true; });
});
