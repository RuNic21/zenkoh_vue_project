// スケジュール型定義（将来的な Supabase 連携を見据えた最低限の項目）
export type ScheduleStatus = "予定" | "進行中" | "完了" | "遅延" | "保留";
export type SchedulePriority = "高" | "中" | "低";

export interface ScheduleAttachment {
  name: string;
  size: string; // 例: "2.3MB"
  type: string; // 例: "pdf"
}

export interface ScheduleComment {
  id: number;
  author: string;
  content: string;
  timestamp: string; // ISO または ローカライズ文字列
  avatar?: string;
}

export interface ScheduleItem {
  id: number;
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: ScheduleStatus;
  priority: SchedulePriority;
  assignee: string;
  progress: number; // 0-100
  category?: string;
  tags?: string[];
  notes?: string;
  attachments?: ScheduleAttachment[];
  comments?: ScheduleComment[];
}


