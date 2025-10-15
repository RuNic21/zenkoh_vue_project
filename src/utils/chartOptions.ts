// チャートオプションビルダー
// 目的: チャートタイプに応じたデフォルトオプションを提供

export function buildChartOptions(type: 'bar' | 'doughnut' | 'line' | 'pie', title?: string, showLegend = true) {
  const base: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: showLegend, position: 'top' },
      title: { display: !!title, text: title, font: { size: 16, weight: 'bold' } },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  };
  if (type === 'bar') {
    base.scales = { y: { beginAtZero: true } };
  } else if (type === 'line') {
    base.scales = { y: { beginAtZero: true } };
  } else if (type === 'doughnut') {
    base.cutout = '50%';
  }
  return base;
}


