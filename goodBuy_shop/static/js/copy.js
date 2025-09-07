document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-copy-shop');
  if (!btn) return;

  const url = btn.getAttribute('data-copy-url');
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    // 簡單提示：可換成 Bootstrap Toast
    btn.title = '已複製！';
    btn.dispatchEvent(new Event('mouseleave')); // 讓瀏覽器更新 title
    setTimeout(() => { btn.title = '複製商店資訊'; }, 1500);
  } catch (err) {
    console.error(err);
    alert('複製失敗，請再試一次');
  }
});