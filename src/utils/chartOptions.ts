// チャートオプションビルダー
// 目的: チャートタイプに応じたデフォルトオプションを提供

// Chart.js のオプション型定義
interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: { display: boolean; position: string };
    title: { display: boolean; text?: string; font: { size: number; weight: string } };
    tooltip: {
      backgroundColor: string;
      titleColor: string;
      bodyColor: string;
      borderColor: string;
      borderWidth: number;
    };
  };
  scales?: {
    x?: { beginAtZero: boolean };
    y?: { beginAtZero: boolean };
  };
}

export function buildChartOptions(type: 'bar' | 'doughnut' | 'line' | 'pie', title?: string, showLegend = true): ChartOptions {
  const base: ChartOptions = {
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


