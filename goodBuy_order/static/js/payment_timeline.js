(function() {
  const URL_LINE = "{% url 'payment_year_series' %}";
  const URL_PIE  = "{% url 'expense_by_shop' %}";

  const btnLine = document.getElementById('btnLine');
  const btnPie  = document.getElementById('btnPie');
  const chartsSection = document.getElementById('chartsSection');
  const form = document.getElementById('filterForm');
  const yearSelect  = form.querySelector('select[name="year"]');
  const monthSelect = form.querySelector('select[name="month"]');

  let lineChartInstance = null;
  let pieChartInstance  = null;

  function getSelections() {
    return {
      year: parseInt(yearSelect.value, 10),
      month: parseInt(monthSelect.value, 10)
    };
  }

  function showChartsSection() {
    chartsSection.style.display = 'block';
    chartsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function loadLineChart() {
    const { year } = getSelections();
    const url = new URL(URL_LINE, window.location.origin);
    url.searchParams.set('year', year);
    const res = await fetch(url);
    if (!res.ok) return alert('載入折線圖失敗');
    const data = await res.json();

    const ctx = document.getElementById('lineChart').getContext('2d');
    if (lineChartInstance) lineChartInstance.destroy();

    const labels = data.months.map(m => `${m}月`);
    lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '收入',    data: data.income,  tension: 0.25 },
          { label: '支出',    data: data.expense, tension: 0.25 },
          { label: '淨額',    data: data.net,     tension: 0.25 },
          { label: '累積淨額', data: data.cum_net, tension: 0.25 }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' } }
      }
    });
    showChartsSection();
  }

  async function loadPieChart() {
    const { year, month } = getSelections();
    const url = new URL(URL_PIE, window.location.origin);
    url.searchParams.set('year', year);
    url.searchParams.set('month', month);
    const res = await fetch(url);
    if (!res.ok) return alert('載入圓餅圖失敗');
    const { labels, values, total, scope } = await res.json();

    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();

    pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data: values }] },
      options: { responsive: true, plugins: { legend: { position: 'right' } } }
    });

    document.getElementById('pieMeta').textContent =
      `期間：${scope.year} 年 ${scope.month || '全年'}　|　總支出：${total.toLocaleString()} $`;
    showChartsSection();
  }

  btnLine.addEventListener('click', loadLineChart);
  btnPie.addEventListener('click',  loadPieChart);
})();
