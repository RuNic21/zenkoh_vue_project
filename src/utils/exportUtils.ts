// CSV/ダウンロードユーティリティ
// 目的: CSV生成とファイルダウンロード処理を共通化

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import type { PdfExportOptions, ExcelExportOptions, ReportData } from "@/types/report";

// ==================== CSV Export ====================

export function toCsv(rows: Array<Array<string | number>>): string {
  return rows.map((cols) => cols.map((c) => escapeCsv(String(c))).join(",")).join("\n");
}

export function downloadFile(content: string, filename: string, mime = "text/csv;charset=utf-8;") {
  // UTF-8 BOMを追加（Excel で日本語が正しく表示されるように）
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: mime });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

// ==================== Phase 1: PDF & Excel Export ====================

/**
 * レポートデータをExcel形式でエクスポート
 * @param reportData レポートデータ
 * @param options エクスポートオプション
 */
export async function exportToExcel(
  reportData: ReportData,
  options: ExcelExportOptions = {}
): Promise<void> {
  try {
    const filename = options.filename || `report_${new Date().toISOString().split("T")[0]}.xlsx`;

    // 新しいワークブックを作成
    const workbook = XLSX.utils.book_new();

    // プロジェクト進捗シートを追加
    if (reportData.projectProgress && reportData.projectProgress.length > 0) {
      const projectData = [
        ["プロジェクト名", "担当者", "開始日", "終了日", "総タスク数", "完了", "進行中", "未開始", "期限切れ", "進捗率", "状態"],
        ...reportData.projectProgress.map(p => [
          p.projectName,
          p.ownerName,
          p.startDate || "-",
          p.endDate || "-",
          p.totalTasks,
          p.completedTasks,
          p.inProgressTasks,
          p.notStartedTasks,
          p.overdueTasks,
          `${p.averageProgress}%`,
          p.status
        ])
      ];
      const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
      XLSX.utils.book_append_sheet(workbook, projectSheet, "プロジェクト進捗");
    }

    // タスク統計シートを追加
    if (reportData.taskStatistics) {
      const stats = reportData.taskStatistics;
      const taskStatsData = [
        ["項目", "値"],
        ["総タスク数", stats.totalTasks],
        ["完了タスク", stats.completedTasks],
        ["進行中タスク", stats.inProgressTasks],
        ["未開始タスク", stats.notStartedTasks],
        ["ブロックタスク", stats.blockedTasks],
        ["キャンセルタスク", stats.cancelledTasks],
        ["期限切れタスク", stats.overdueTasks],
        ["完了率", `${stats.completionRate}%`],
        ["平均進捗率", `${stats.averageProgress}%`]
      ];
      const statsSheet = XLSX.utils.aoa_to_sheet(taskStatsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, "タスク統計");
    }

    // ユーザー別作業量シートを追加
    if (reportData.userWorkload && reportData.userWorkload.length > 0) {
      const userData = [
        ["ユーザー名", "割当タスク数", "完了タスク", "進行中タスク", "期限切れタスク", "完了率", "平均進捗率"],
        ...reportData.userWorkload.map(u => [
          u.userName,
          u.totalAssignedTasks,
          u.completedTasks,
          u.inProgressTasks,
          u.overdueTasks,
          `${u.completionRate}%`,
          `${u.averageProgress}%`
        ])
      ];
      const userSheet = XLSX.utils.aoa_to_sheet(userData);
      XLSX.utils.book_append_sheet(workbook, userSheet, "ユーザー別作業量");
    }

    // 優先度別レポートシートを追加
    if (reportData.priorityReport && reportData.priorityReport.length > 0) {
      const priorityData = [
        ["優先度", "タスク数", "完了タスク数", "完了率", "平均進捗率"],
        ...reportData.priorityReport.map(p => [
          p.priority,
          p.taskCount,
          p.completedCount,
          `${p.completionRate}%`,
          `${p.averageProgress}%`
        ])
      ];
      const prioritySheet = XLSX.utils.aoa_to_sheet(priorityData);
      XLSX.utils.book_append_sheet(workbook, prioritySheet, "優先度別統計");
    }

    // カスタムシートを追加（オプション指定がある場合）
    if (options.sheets && options.sheets.length > 0) {
      options.sheets.forEach(sheetConfig => {
        const customData = sheetConfig.headers 
          ? [sheetConfig.headers, ...sheetConfig.data]
          : sheetConfig.data;
        const customSheet = XLSX.utils.aoa_to_sheet(customData);
        XLSX.utils.book_append_sheet(workbook, customSheet, sheetConfig.name);
      });
    }

    // ファイルを保存
    XLSX.writeFile(workbook, filename);
    console.log(`Excelエクスポート完了: ${filename}`);
  } catch (error) {
    console.error("Excelエクスポートエラー:", error);
    throw new Error("Excelエクスポートに失敗しました");
  }
}

/**
 * レポートデータをPDF形式でエクスポート（画像ベース - 日本語完全対応）
 * @param reportData レポートデータ
 * @param options エクスポートオプション
 */
export async function exportToPdf(
  reportData: ReportData,
  options: PdfExportOptions = {}
): Promise<void> {
  try {
    const filename = options.filename || `report_${new Date().toISOString().split("T")[0]}.pdf`;
    
    // レポート全体をキャプチャするための一時的な要素を作成
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "1000px";
    tempContainer.style.background = "white";
    tempContainer.style.padding = "40px";
    tempContainer.style.fontFamily = "Arial, sans-serif";
    
    // HTMLコンテンツを生成
    let html = `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="text-align: center; color: #344767; margin-bottom: 10px;">${options.title || "プロジェクトレポート"}</h1>
        <p style="text-align: center; color: #67748e; margin-bottom: 30px;">生成日時: ${new Date().toLocaleString("ja-JP")}</p>
    `;

    // タスク統計サマリー
    if (reportData.taskStatistics) {
      const stats = reportData.taskStatistics;
      html += `
        <div style="margin-bottom: 30px;">
          <h2 style="color: #344767; border-bottom: 2px solid #428bca; padding-bottom: 5px;">タスク統計サマリー</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">総タスク数</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.totalTasks}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">完了タスク</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.completedTasks} (${stats.completionRate}%)</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">進行中タスク</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.inProgressTasks}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">未開始タスク</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.notStartedTasks}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">ブロックタスク</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${stats.blockedTasks}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">期限切れタスク</td>
              <td style="padding: 10px; border: 1px solid #dee2e6; color: #dc3545;">${stats.overdueTasks}</td>
            </tr>
          </table>
        </div>
      `;
    }

    // プロジェクト進捗テーブル
    if (reportData.projectProgress && reportData.projectProgress.length > 0) {
      html += `
        <div style="margin-bottom: 30px; page-break-before: auto;">
          <h2 style="color: #344767; border-bottom: 2px solid #428bca; padding-bottom: 5px;">プロジェクト進捗</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px;">
            <thead>
              <tr style="background-color: #428bca; color: white;">
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">プロジェクト名</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: left;">担当者</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">総数</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">完了</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">進捗率</th>
                <th style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">状態</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      reportData.projectProgress.forEach((p, idx) => {
        const bgColor = idx % 2 === 0 ? "#ffffff" : "#f8f9fa";
        html += `
          <tr style="background-color: ${bgColor};">
            <td style="padding: 8px; border: 1px solid #dee2e6;">${p.projectName}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6;">${p.ownerName}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${p.totalTasks}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${p.completedTasks}</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${p.averageProgress}%</td>
            <td style="padding: 8px; border: 1px solid #dee2e6; text-align: center;">${p.status}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    html += `</div>`;
    
    tempContainer.innerHTML = html;
    document.body.appendChild(tempContainer);

    // 少し待機してレンダリングを完了
    await new Promise(resolve => setTimeout(resolve, 100));

    // HTML要素をCanvasに変換
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff"
    });

    // 一時要素を削除
    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 190; // A4幅 (mm) - 余白を考慮
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pageHeight = 277; // A4高さ (mm) - 余白を考慮
    let heightLeft = imgHeight;
    let position = 10;

    // PDFを作成
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? "portrait" : "landscape",
      unit: "mm",
      format: "a4"
    });

    // 最初のページに画像を追加
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 必要に応じて複数ページに分割
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
    console.log(`PDFエクスポート完了: ${filename}`);
  } catch (error) {
    console.error("PDFエクスポートエラー:", error);
    throw new Error("PDFエクスポートに失敗しました");
  }
}

/**
 * HTML要素をPDF形式でエクスポート（チャート含む）
 * @param elementId キャプチャする要素のID
 * @param filename ファイル名
 */
export async function exportElementToPdf(
  elementId: string,
  filename: string = `report_${new Date().toISOString().split("T")[0]}.pdf`
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`要素が見つかりません: ${elementId}`);
    }

    // HTML要素をCanvasに変換
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 190; // A4幅 (mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // PDFを作成
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? "portrait" : "landscape",
      unit: "mm",
      format: "a4"
    });

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(filename);

    console.log(`PDFエクスポート完了: ${filename}`);
  } catch (error) {
    console.error("PDFエクスポートエラー:", error);
    throw new Error("PDFエクスポートに失敗しました");
  }
}


