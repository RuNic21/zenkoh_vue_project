// チーム管理用の型定義
// 目的: ユーザー、チームメンバー、権限管理の型を定義

// ユーザー基本情報
export interface User {
  id: number;
  email: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 拡張プロフィール情報
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  avatar_url?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  work_hours_start?: string;
  work_hours_end?: string;
  skills?: string[];
  tags?: string[];
  last_login_at?: string;
  login_count?: number;
}

// チームメンバー情報（タスクとの関連を含む）
export interface TeamMember {
  user_id: number;
  task_id: number;
  role: "OWNER" | "CONTRIBUTOR" | "REVIEWER";
  user?: User; // JOIN用
}

// チームメンバー作成用
export interface TeamMemberInsert {
  user_id: number;
  task_id: number;
  role: "OWNER" | "CONTRIBUTOR" | "REVIEWER";
}

// チームメンバー更新用
export interface TeamMemberUpdate {
  role?: "OWNER" | "CONTRIBUTOR" | "REVIEWER";
}

// プロジェクト別チーム情報
export interface ProjectTeam {
  project_id: number;
  project_name: string;
  members: TeamMemberWithUser[];
  total_members: number;
  active_members: number;
}

// ユーザー情報を含むチームメンバー
export interface TeamMemberWithUser extends TeamMember {
  user: User;
}

// チーム統計情報
export interface TeamStats {
  total_users: number;
  active_users: number;
  total_projects: number;
  total_tasks: number;
  average_tasks_per_user: number;
}

// ユーザー活動統計
export interface UserActivity {
  user_id: number;
  display_name: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  completion_rate: number;
  last_activity: string;
}

// チーム役割定義
export type TeamRole = "OWNER" | "CONTRIBUTOR" | "REVIEWER";

// チーム役割の日本語表示用
export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: "オーナー",
  CONTRIBUTOR: "貢献者", 
  REVIEWER: "レビューアー"
};

// チーム役割の色定義
export const TEAM_ROLE_COLORS: Record<TeamRole, string> = {
  OWNER: "bg-gradient-danger",
  CONTRIBUTOR: "bg-gradient-primary",
  REVIEWER: "bg-gradient-info"
};

// ユーザープロフィール更新用
export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  avatar_url?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  work_hours_start?: string;
  work_hours_end?: string;
  skills?: string[];
  tags?: string[];
}

// ユーザー統計情報
export interface UserProfileStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  average_task_duration: number;
  last_activity: string;
  productivity_score: number;
}

// ユーザー活動履歴
export interface UserActivityLog {
  id: number;
  user_id: number;
  action: string;
  description: string;
  target_type?: string;
  target_id?: number;
  created_at: string;
}

// スキル・タグ管理
export interface UserSkill {
  id: number;
  name: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  category: string;
}

export interface UserTag {
  id: number;
  name: string;
  color: string;
  description?: string;
}

// スキルレベルの日本語表示用
export const SKILL_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "初級",
  INTERMEDIATE: "中級",
  ADVANCED: "上級",
  EXPERT: "エキスパート"
};

// スキルレベルの色定義
export const SKILL_LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-gradient-info",
  INTERMEDIATE: "bg-gradient-primary",
  ADVANCED: "bg-gradient-warning",
  EXPERT: "bg-gradient-success"
};
