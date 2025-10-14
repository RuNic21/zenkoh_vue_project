// チーム管理用サービス（Supabase 連携）
// 目的: ユーザー、チームメンバー、権限管理のCRUD操作を提供

import type { 
  User, 
  TeamMember, 
  TeamMemberInsert, 
  TeamMemberUpdate, 
  TeamMemberWithUser,
  ProjectTeam,
  TeamStats,
  UserActivity,
  UserProfileUpdate,
  UserProfileStats,
  UserActivityLog,
  UserSkill,
  UserTag
} from "../types/team";
import { supabase, selectRows, type SelectFilter, type WhereCondition } from "./supabaseClient";

// ユーザー関連のテーブル名
const USERS_TABLE = "users";
const TASK_MEMBERS_TABLE = "task_members";
const TASKS_TABLE = "tasks";
const PROJECTS_TABLE = "projects";

// ===== ユーザー管理 =====

// 全ユーザー一覧取得
export async function listUsers(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<User[]> {
  const res = await selectRows<User>(USERS_TABLE, "*", filter, where);
  if (!res.ok) {
    console.error("ユーザー一覧の取得に失敗:", res.error);
    return [];
  }
  return res.data ?? [];
}

// アクティブユーザーのみ取得
export async function listActiveUsers(): Promise<User[]> {
  return await listUsers({ is_active: true });
}

// ユーザーIDで取得
export async function getUserById(id: number): Promise<User | null> {
  const res = await selectRows<User>(USERS_TABLE, "*", { id });
  if (!res.ok) {
    console.error("ユーザー取得に失敗:", res.error);
    return null;
  }
  return (res.data && res.data[0]) ?? null;
}

// ユーザー作成
export async function createUser(payload: {
  email: string;
  display_name: string;
  password_hash: string;
  is_active?: boolean;
}): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .insert([{ 
        is_active: true, 
        ...payload 
      }])
      .select("*")
      .single();
    
    if (error) {
      console.error("ユーザー作成に失敗:", error.message);
      return null;
    }
    return data as User;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ユーザー作成時に予期せぬエラー:", msg);
    return null;
  }
}

// ユーザー更新
export async function updateUser(id: number, payload: {
  email?: string;
  display_name?: string;
  is_active?: boolean;
}): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({ ...payload })
      .eq("id", id)
      .select("*")
      .single();
    
    if (error) {
      console.error("ユーザー更新に失敗:", error.message);
      return null;
    }
    return data as User;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ユーザー更新時に予期せぬエラー:", msg);
    return null;
  }
}

// ===== チームメンバー管理 =====

// チームメンバー一覧取得（ユーザー情報含む）
export async function listTeamMembersWithUsers(
  taskId?: number
): Promise<TeamMemberWithUser[]> {
  try {
    let query = supabase
      .from(TASK_MEMBERS_TABLE)
      .select(`
        *,
        user:users(*)
      `);
    
    if (taskId) {
      query = query.eq("task_id", taskId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("チームメンバー取得に失敗:", error.message);
      return [];
    }
    
    return (data as TeamMemberWithUser[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("チームメンバー取得でエラー:", msg);
    return [];
  }
}

// チームメンバー追加
export async function addTeamMember(payload: TeamMemberInsert): Promise<TeamMember | null> {
  try {
    const { data, error } = await supabase
      .from(TASK_MEMBERS_TABLE)
      .insert([payload])
      .select("*")
      .single();
    
    if (error) {
      console.error("チームメンバー追加に失敗:", error.message);
      return null;
    }
    return data as TeamMember;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("チームメンバー追加時に予期せぬエラー:", msg);
    return null;
  }
}

// チームメンバー役割更新
export async function updateTeamMemberRole(
  userId: number, 
  taskId: number, 
  payload: TeamMemberUpdate
): Promise<TeamMember | null> {
  try {
    const { data, error } = await supabase
      .from(TASK_MEMBERS_TABLE)
      .update(payload)
      .eq("user_id", userId)
      .eq("task_id", taskId)
      .select("*")
      .single();
    
    if (error) {
      console.error("チームメンバー役割更新に失敗:", error.message);
      return null;
    }
    return data as TeamMember;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("チームメンバー役割更新時に予期せぬエラー:", msg);
    return null;
  }
}

// チームメンバー削除
export async function removeTeamMember(userId: number, taskId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TASK_MEMBERS_TABLE)
      .delete()
      .eq("user_id", userId)
      .eq("task_id", taskId);
    
    if (error) {
      console.error("チームメンバー削除に失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("チームメンバー削除時に予期せぬエラー:", msg);
    return false;
  }
}

// ===== プロジェクト別チーム情報 =====

// プロジェクト別チーム情報取得
export async function getProjectTeams(): Promise<ProjectTeam[]> {
  try {
    // プロジェクト一覧を取得
    const { data: projects, error: projectsError } = await supabase
      .from(PROJECTS_TABLE)
      .select("id, name")
      .eq("is_archived", false);
    
    if (projectsError) {
      console.error("プロジェクト取得に失敗:", projectsError.message);
      return [];
    }
    
    const projectTeams: ProjectTeam[] = [];
    
    for (const project of projects || []) {
      // プロジェクトのタスクを取得
      const { data: tasks, error: tasksError } = await supabase
        .from(TASKS_TABLE)
        .select("id")
        .eq("project_id", project.id)
        .eq("is_archived", false);
      
      if (tasksError) {
        console.error(`プロジェクト${project.id}のタスク取得に失敗:`, tasksError.message);
        continue;
      }
      
      const taskIds = (tasks || []).map(t => t.id);
      
      if (taskIds.length === 0) {
        projectTeams.push({
          project_id: project.id,
          project_name: project.name,
          members: [],
          total_members: 0,
          active_members: 0
        });
        continue;
      }
      
      // タスクのチームメンバーを取得
      const { data: members, error: membersError } = await supabase
        .from(TASK_MEMBERS_TABLE)
        .select(`
          *,
          user:users(*)
        `)
        .in("task_id", taskIds);
      
      if (membersError) {
        console.error(`プロジェクト${project.id}のメンバー取得に失敗:`, membersError.message);
        continue;
      }
      
      const uniqueMembers = new Map<number, TeamMemberWithUser>();
      
      // 重複を除去（同じユーザーが複数のタスクに参加している場合）
      (members || []).forEach(member => {
        if (member.user && !uniqueMembers.has(member.user_id)) {
          uniqueMembers.set(member.user_id, member as TeamMemberWithUser);
        }
      });
      
      const memberList = Array.from(uniqueMembers.values());
      const activeMembers = memberList.filter(m => m.user?.is_active).length;
      
      projectTeams.push({
        project_id: project.id,
        project_name: project.name,
        members: memberList,
        total_members: memberList.length,
        active_members: activeMembers
      });
    }
    
    return projectTeams;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("プロジェクトチーム情報取得でエラー:", msg);
    return [];
  }
}

// ===== 統計情報 =====

// チーム統計情報取得
export async function getTeamStats(): Promise<TeamStats> {
  try {
    // ユーザー統計
    const { data: users, error: usersError } = await supabase
      .from(USERS_TABLE)
      .select("id, is_active");
    
    if (usersError) {
      console.error("ユーザー統計取得に失敗:", usersError.message);
      return {
        total_users: 0,
        active_users: 0,
        total_projects: 0,
        total_tasks: 0,
        average_tasks_per_user: 0
      };
    }
    
    const totalUsers = users?.length || 0;
    const activeUsers = users?.filter(u => u.is_active).length || 0;
    
    // プロジェクト統計
    const { data: projects, error: projectsError } = await supabase
      .from(PROJECTS_TABLE)
      .select("id")
      .eq("is_archived", false);
    
    const totalProjects = projects?.length || 0;
    
    // タスク統計
    const { data: tasks, error: tasksError } = await supabase
      .from(TASKS_TABLE)
      .select("id")
      .eq("is_archived", false);
    
    const totalTasks = tasks?.length || 0;
    
    // ユーザーあたりの平均タスク数
    const averageTasksPerUser = activeUsers > 0 ? Math.round(totalTasks / activeUsers * 100) / 100 : 0;
    
    return {
      total_users: totalUsers,
      active_users: activeUsers,
      total_projects: totalProjects,
      total_tasks: totalTasks,
      average_tasks_per_user: averageTasksPerUser
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("チーム統計取得でエラー:", msg);
    return {
      total_users: 0,
      active_users: 0,
      total_projects: 0,
      total_tasks: 0,
      average_tasks_per_user: 0
    };
  }
}

// ユーザー活動統計取得
export async function getUserActivityStats(): Promise<UserActivity[]> {
  try {
    // ユーザー一覧を取得
    const { data: users, error: usersError } = await supabase
      .from(USERS_TABLE)
      .select("id, display_name, is_active")
      .eq("is_active", true);
    
    if (usersError) {
      console.error("ユーザー一覧取得に失敗:", usersError.message);
      return [];
    }
    
    const userActivities: UserActivity[] = [];
    
    for (const user of users || []) {
      // ユーザーのタスク統計を取得
      const { data: taskMembers, error: taskMembersError } = await supabase
        .from(TASK_MEMBERS_TABLE)
        .select(`
          task:tasks(
            id,
            status,
            updated_at
          )
        `)
        .eq("user_id", user.id);
      
      if (taskMembersError) {
        console.error(`ユーザー${user.id}のタスク統計取得に失敗:`, taskMembersError.message);
        continue;
      }
      
      const tasks = (taskMembers || []).map(tm => tm.task).filter(Boolean);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.status === "DONE").length;
      const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // 最後の活動日時を取得
      const lastActivity = tasks.length > 0 
        ? Math.max(...tasks.map((t: any) => new Date(t.updated_at).getTime()))
        : 0;
      
      userActivities.push({
        user_id: user.id,
        display_name: user.display_name,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        completion_rate: completionRate,
        last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : ""
      });
    }
    
    // 最後の活動日時でソート
    return userActivities.sort((a, b) => 
      new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ユーザー活動統計取得でエラー:", msg);
    return [];
  }
}

// ===== ユーザープロフィール管理 =====

// ユーザープロフィール更新
export async function updateUserProfile(
  userId: number, 
  profileData: UserProfileUpdate
): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update(profileData)
      .eq("id", userId)
      .select("*")
      .single();
    
    if (error) {
      console.error("ユーザープロフィール更新に失敗:", error.message);
      return null;
    }
    return data as User;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ユーザープロフィール更新時に予期せぬエラー:", msg);
    return null;
  }
}

// ユーザープロフィール統計取得
export async function getUserProfileStats(userId: number): Promise<UserProfileStats | null> {
  try {
    // ユーザーのタスク統計を取得
    const { data: taskMembers, error: taskError } = await supabase
      .from(TASK_MEMBERS_TABLE)
      .select(`
        task:tasks (
          id,
          status,
          planned_start,
          planned_end,
          actual_start,
          actual_end,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", userId);
    
    if (taskError) {
      console.error("タスク統計取得に失敗:", taskError.message);
      return null;
    }
    
    const tasks = (taskMembers || []).map(tm => tm.task).filter(Boolean);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === "DONE").length;
    const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS").length;
    const overdueTasks = tasks.filter((t: any) => {
      if (!t.planned_end) return false;
      return new Date(t.planned_end) < new Date() && t.status !== "DONE";
    }).length;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // 平均タスク期間を計算
    const completedTasksWithDuration = tasks.filter((t: any) => 
      t.status === "DONE" && t.actual_start && t.actual_end
    );
    const averageTaskDuration = completedTasksWithDuration.length > 0 
      ? completedTasksWithDuration.reduce((sum: number, t: any) => {
          const duration = new Date(t.actual_end).getTime() - new Date(t.actual_start).getTime();
          return sum + duration;
        }, 0) / completedTasksWithDuration.length / (1000 * 60 * 60 * 24) // 日数に変換
      : 0;
    
    // 最後の活動日時
    const lastActivity = tasks.length > 0 
      ? Math.max(...tasks.map((t: any) => new Date(t.updated_at).getTime()))
      : 0;
    
    // 生産性スコア（完了率 + 進捗率 - 遅延率）
    const progressRate = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
    const overdueRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;
    const productivityScore = Math.max(0, completionRate + progressRate - overdueRate);
    
    return {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      in_progress_tasks: inProgressTasks,
      overdue_tasks: overdueTasks,
      completion_rate: completionRate,
      average_task_duration: Math.round(averageTaskDuration * 10) / 10,
      last_activity: lastActivity > 0 ? new Date(lastActivity).toISOString() : "",
      productivity_score: productivityScore
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ユーザープロフィール統計取得でエラー:", msg);
    return null;
  }
}

// ユーザー活動履歴取得
export async function getUserActivityLogs(
  userId: number, 
  limit: number = 50
): Promise<UserActivityLog[]> {
  try {
    // 実際の実装では、activity_logs テーブルから取得
    // 現在は仮の実装として、タスク関連の活動を返す
    const { data: taskMembers, error } = await supabase
      .from(TASK_MEMBERS_TABLE)
      .select(`
        task:tasks (
          id,
          task_name,
          status,
          updated_at
        )
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("ユーザー活動履歴取得に失敗:", error.message);
      return [];
    }
    
    const activities: UserActivityLog[] = (taskMembers || []).map((tm: any, index: number) => ({
      id: index + 1,
      user_id: userId,
      action: "TASK_UPDATE",
      description: `タスク「${tm.task.task_name}」のステータスが${tm.task.status}に更新されました`,
      target_type: "task",
      target_id: tm.task.id,
      created_at: tm.task.updated_at
    }));
    
    return activities;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ユーザー活動履歴取得でエラー:", msg);
    return [];
  }
}

// ユーザーアバターアップロード（仮実装）
export async function uploadUserAvatar(
  userId: number, 
  file: File
): Promise<string | null> {
  try {
    // 実際の実装では、Supabase Storage を使用
    // 現在は仮の実装として、ファイル名を返す
    const fileName = `avatar_${userId}_${Date.now()}.${file.name.split('.').pop()}`;
    console.log("アバターアップロード（仮実装）:", fileName);
    return `https://example.com/avatars/${fileName}`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("アバターアップロードでエラー:", msg);
    return null;
  }
}

// ユーザー検索（拡張）
export async function searchUsers(
  query: string,
  filters?: {
    department?: string;
    position?: string;
    skills?: string[];
    is_active?: boolean;
  }
): Promise<User[]> {
  try {
    let supabaseQuery = supabase
      .from(USERS_TABLE)
      .select("*")
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
    
    // フィルター適用
    if (filters) {
      if (filters.department) {
        supabaseQuery = supabaseQuery.eq("department", filters.department);
      }
      if (filters.position) {
        supabaseQuery = supabaseQuery.eq("position", filters.position);
      }
      if (filters.is_active !== undefined) {
        supabaseQuery = supabaseQuery.eq("is_active", filters.is_active);
      }
    }
    
    const { data, error } = await supabaseQuery.order("display_name");
    
    if (error) {
      console.error("ユーザー検索に失敗:", error.message);
      return [];
    }
    
    return (data as User[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ユーザー検索でエラー:", msg);
    return [];
  }
}

export type { SelectFilter, WhereCondition };
