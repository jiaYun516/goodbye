// static/js/payment_timeline.js
(function () {
  console.log('[timeline] payment_timeline.js loaded');

  // ---- color helpers (給圓餅圖用) ----
  const EXPENSE_BASE = { h: 12,  s: 82, l: 54 }; // 橘紅：支出
  const INCOME_BASE  = { h: 205, s: 75, l: 50 }; // 藍色：收入
  const hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;
  const makePalette = (base, n) => {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const hue   = (base.h + i * 12) % 360;                 // 色相微調
      const light = Math.max(30, Math.min(72, base.l +      // 明度深淺交錯
                        (i % 2 ? -10 : 8) - Math.floor(i/2)*4));
      arr.push(hsl(hue, base.s, light));
    }
    return arr;
  };

  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  ready(() => {
    const btnLine = document.getElementById('btnLine');
    const btnPie  = document.getElementById('btnPie');
    const chartsSection = document.getElementById('chartsSection');

    if (!btnLine || !btnPie) {
      console.error('[timeline] buttons not found');
      return;
    }
    if (!window.GB) {
      console.error('[timeline] window.GB undefined');
      return;
    }

    let lineChart;
    let pieChartExp, pieChartInc;

    function ensureShown() {
      if (chartsSection && chartsSection.style.display === 'none') {
        chartsSection.style.display = 'block';
      }
    }

    // ========== 折線圖 ==========
    btnLine.addEventListener('click', async () => {
      try {
        console.log('[timeline] line clicked ->', GB.lineUrl, 'year=', GB.defaultYear);
        ensureShown();
        const res = await fetch(`${GB.lineUrl}?year=${GB.defaultYear}`, {
          headers: { 'X-Requested-With': 'fetch' }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();

        const ctx = document.getElementById('lineChart')?.getContext('2d');
        if (!ctx) return;

        if (lineChart) lineChart.destroy();
        lineChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.months.map(m => `${m}月`),
            datasets: [
              { label: '收入',     data: data.income },
              { label: '支出',     data: data.expense },
              { label: '月淨額',   data: data.net },
              { label: '累計淨額', data: data.cum_net }
            ]
          },
          options: { responsive: true, interaction: { mode: 'index', intersect: false } }
        });
      } catch (err) {
        console.error('[timeline] line error', err);
        alert('載入折線圖失敗：' + err.message);
      }
    });

    // ========== 圓餅圖（支出 / 收入） ==========
    btnPie.addEventListener('click', async () => {
      try {
        console.log('[timeline] pie clicked ->', GB.pieUrl, 'year=', GB.defaultYear, 'month=', GB.defaultMonth);
        ensureShown();

        const q = new URLSearchParams({ year: GB.defaultYear, month: GB.defaultMonth }).toString();
        const res = await fetch(`${GB.pieUrl}?${q}`, { headers: { 'X-Requested-With': 'fetch' }});
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        console.log('[timeline] pie data', json);

        const exp = json.expense || { labels: [], values: [], total: 0 };
        const inc = json.income  || { labels: [], values: [], total: 0 };

        const metaExp = document.getElementById('pieMetaExpense');
        const metaInc = document.getElementById('pieMetaIncome');
        if (metaExp) metaExp.textContent = exp.total && exp.values.length
          ? `總支出：${exp.total}（Top ${exp.labels.length} + 其他）`
          : '本期沒有支出資料';
        if (metaInc) metaInc.textContent = inc.total && inc.values.length
          ? `總收入：${inc.total}（Top ${inc.labels.length} + 其他）`
          : '本期沒有收入資料';

        const ctxExp = document.getElementById('pieChartExpense')?.getContext('2d');
        const ctxInc = document.getElementById('pieChartIncome')?.getContext('2d');
        if (!ctxExp || !ctxInc) return;

        if (pieChartExp) { pieChartExp.destroy(); pieChartExp = null; }
        if (pieChartInc) { pieChartInc.destroy(); pieChartInc = null; }

        const clearCanvas = (ctx) => {
          const c = ctx.canvas;
          ctx.clearRect(0, 0, c.width, c.height);
        };

        // 支出餅（橘紅系）
        if (exp.total && exp.values.length) {
          const colorsExp = makePalette(EXPENSE_BASE, exp.labels.length);
          pieChartExp = new Chart(ctxExp, {
            type: 'pie',
            data: {
              labels: exp.labels,
              datasets: [{ data: exp.values, backgroundColor: colorsExp, borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          });
        } else {
          clearCanvas(ctxExp);
        }

        // 收入餅（藍色系）
        if (inc.total && inc.values.length) {
          const colorsInc = makePalette(INCOME_BASE, inc.labels.length);
          pieChartInc = new Chart(ctxInc, {
            type: 'pie',
            data: {
              labels: inc.labels,
              datasets: [{ data: inc.values, backgroundColor: colorsInc, borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          });
        } else {
          clearCanvas(ctxInc);
        }

      } catch (err) {
        console.error('[timeline] pie error', err);
        alert('載入圓餅圖失敗：' + err.message);
      }
    });
  });
})();
