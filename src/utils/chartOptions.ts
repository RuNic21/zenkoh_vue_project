// チャートオプションビルダー
// 目的: チャートタイプに応じたデフォルトオプションを提供

import type { ChartOptions } from "chart.js";

/**
 * チャートタイプに応じたオプションを構築する
 * @param type チャートタイプ
 * @param title チャートタイトル（オプション）
 * @param showLegend 凡例を表示するか
 * @returns Chart.js用のオプションオブジェクト
 */
export function buildChartOptions(
  type: 'bar' | 'doughnut' | 'line' | 'pie',
  title?: string,
  showLegend = true
): any {
  // Chart.jsの型に合わせてオプションを構築
  // 複数のチャートタイプに対応するため、any型を使用して型エラーを回避
  const base: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' // Chart.jsが期待するリテラル型（'top'）
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  };

  // チャートタイプに応じたオプションを追加
  if (type === 'bar' || type === 'line') {
    base.scales = {
      y: {
        beginAtZero: true
      }
    };
  } else if (type === 'doughnut') {
    // ドーナツチャートではcutoutプロパティを使用
    base.cutout = '50%';
  }

  return base;
}


