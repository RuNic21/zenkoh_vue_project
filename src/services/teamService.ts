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
import type { Tasks } from "../types/db/tasks";
import type { ProjectMembers } from "../types/db/project_members";
import { supabase, selectRows, type SelectFilter, type WhereCondition } from "./supabaseClient";
import { handleServiceCall, createSuccessResult, createErrorResult, translateSupabaseError, type ServiceResult } from "../utils/errorHandler";

// ユーザー関連のテーブル名
const USERS_TABLE = "users";
const TASK_MEMBERS_TABLE = "task_members";
const TASKS_TABLE = "tasks";
const PROJECTS_TABLE = "projects";
const PROJECT_MEMBERS_TABLE = "project_members"; // プロジェクトメンバー管理テーブル

// ===== ユーザー管理 =====

// 全ユーザー一覧取得
export async function listUsers(
  filter?: SelectFilter,
  where?: WhereCondition[]
): Promise<ServiceResult<User[]>> {
  return handleServiceCall(
    async () => {
      const res = await selectRows<User>(USERS_TABLE, "*", filter, where);
      if (!res.ok) {
        throw new Error(res.error || "ユーザー一覧の取得に失敗しました");
      }
      return res.data ?? [];
    },
    "ユーザー一覧の取得に失敗しました"
  );
}

// アクティブユーザーのみ取得
export async function listActiveUsers(): Promise<ServiceResult<User[]>> {
  return await listUsers({ is_active: true });
}

// ユーザーIDで取得
export async function getUserById(id: number): Promise<ServiceResult<User | null>> {
  return handleServiceCall(
    async () => {
      const res = await selectRows<User>(USERS_TABLE, "*", { id });
      if (!res.ok) {
        throw new Error(res.error || "ユーザー取得に失敗しました");
      }
      return (res.data && res.data[0]) ?? null;
    },
    "ユーザー取得に失敗しました"
  );
}

// auth_id (Supabase Auth UUID) でユーザーを取得
export async function getUserByAuthId(authId: string): Promise<ServiceResult<User | null>> {
  return handleServiceCall(
    async () => {
      const res = await selectRows<User>(USERS_TABLE, "*", { auth_id: authId });
      if (!res.ok) {
        throw new Error(res.error || "ユーザー取得に失敗しました");
      }
      return (res.data && res.data[0]) ?? null;
    },
    "ユーザー取得に失敗しました"
  );
}

// ユーザー作成
export async function createUser(payload: Partial<User> & {
  email: string;
  display_name: string;
  password_hash: string;
}): Promise<ServiceResult<User | null>> {
  return handleServiceCall(
    async () => {
      const { data, error } = await supabase
        .from(USERS_TABLE)
        .insert([{ 
          is_active: payload.is_active ?? true, 
          email: payload.email,
          display_name: payload.display_name,
          password_hash: payload.password_hash,
          // プロフィール情報
          first_name: payload.first_name,
          last_name: payload.last_name,
          phone: payload.phone,
          department: payload.department,
          position: payload.position,
          avatar_url: payload.avatar_url,
          bio: payload.bio,
          timezone: payload.timezone,
          language: payload.language,
          work_hours_start: payload.work_hours_start,
          work_hours_end: payload.work_hours_end,
          skills: payload.skills ? JSON.parse(JSON.stringify(payload.skills)) : undefined,
          tags: payload.tags ? JSON.parse(JSON.stringify(payload.tags)) : undefined
        }])
        .select("*")
        .single();
      
      if (error) {
        throw new Error(translateSupabaseError(error));
      }
      return data as User;
    },
    "ユーザー作成に失敗しました"
  );
}

// ユーザー更新
export async function updateUser(id: number, payload: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({ 
        email: payload.email,
        display_name: payload.display_name,
        is_active: payload.is_active,
        // プロフィール情報
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        department: payload.department,
        position: payload.position,
        avatar_url: payload.avatar_url,
        bio: payload.bio,
        timezone: payload.timezone,
        language: payload.language,
        work_hours_start: payload.work_hours_start,
        work_hours_end: payload.work_hours_end,
        skills: payload.skills ? JSON.parse(JSON.stringify(payload.skills)) : undefined,
        tags: payload.tags ? JSON.parse(JSON.stringify(payload.tags)) : undefined
      })
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

// ユーザー削除
// 目的: ユーザーおよび関連する task_members のレコードを安全に削除する
// 注意: 外部キー制約により削除が失敗する可能性に備え、関連レコードを先に削除
export async function deleteUser(id: number): Promise<boolean> {
  try {
    // 1) 関連する task_members を削除
    const { error: tmError } = await supabase
      .from(TASK_MEMBERS_TABLE)
      .delete()
      .eq("user_id", id);
    if (tmError) {
      console.error("関連チームメンバー削除に失敗:", tmError.message);
      return false;
    }

    // 2) ユーザー本体を削除
    const { error: userError } = await supabase
      .from(USERS_TABLE)
      .delete()
      .eq("id", id);
    if (userError) {
      console.error("ユーザー削除に失敗:", userError.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ユーザー削除時に予期せぬエラー:", msg);
    return false;
  }
}

// ===== チームメンバー管理 =====

// チームメンバー一覧取得（ユーザー情報含む）
export async function listTeamMembersWithUsers(
  taskId?: number
): Promise<ServiceResult<TeamMemberWithUser[]>> {
  return handleServiceCall(async () => {
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
      throw new Error(`チームメンバー取得に失敗: ${error.message}`);
    }
    
    return (data as TeamMemberWithUser[]) ?? [];
  });
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
export async function getProjectTeams(): Promise<ServiceResult<ProjectTeam[]>> {
  return handleServiceCall(async () => {
    // プロジェクト一覧を取得
    const { data: projects, error: projectsError } = await supabase
      .from(PROJECTS_TABLE)
      .select("id, name")
      .eq("is_archived", false);
    
    if (projectsError) {
      throw new Error(`プロジェクト取得に失敗: ${projectsError.message}`);
    }
    
    const projectTeams: ProjectTeam[] = [];
    
    for (const project of projects || []) {
      // プロジェクトメンバーを project_members から取得（ユーザー情報JOIN）
      const { data: members, error: membersError } = await supabase
        .from(PROJECT_MEMBERS_TABLE)
        .select(`
          user_id,
          role,
          joined_at,
          user:users(*)
        `)
        .eq("project_id", project.id);

      if (membersError) {
        console.warn(`プロジェクト${project.id}のメンバー取得に失敗:`, membersError.message);
        projectTeams.push({
          project_id: project.id,
          project_name: project.name,
          members: [],
          total_members: 0,
          active_members: 0
        });
        continue;
      }

      // ProjectMembers with User 型の members をマッピング
      interface ProjectMemberWithUser extends ProjectMembers {
        user: User;
      }
      const memberList: TeamMemberWithUser[] = (members || []).map((m: ProjectMemberWithUser) => ({
        user_id: m.user_id,
        task_id: 0, // プロジェクトメンバーには task_id の概念がないため 0 を設定（UIで未使用）
        role: m.role,
        user: m.user,
      }));

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
  });
}

// ===== 統計情報 =====

// チーム統計情報取得
export async function getTeamStats(): Promise<ServiceResult<TeamStats>> {
  return handleServiceCall(
    async () => {
      // ユーザー統計
      const { data: users, error: usersError } = await supabase
        .from(USERS_TABLE)
        .select("id, is_active");
      
      if (usersError) {
        throw new Error(`ユーザー統計取得に失敗: ${usersError.message}`);
      }
      
      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.is_active).length || 0;
      
      // プロジェクト統計
      const { data: projects, error: projectsError } = await supabase
        .from(PROJECTS_TABLE)
        .select("id")
        .eq("is_archived", false);
      
      if (projectsError) {
        console.warn("プロジェクト統計取得に失敗:", projectsError.message);
      }
      
      const totalProjects = projects?.length || 0;
      
      // タスク統計
      const { data: tasks, error: tasksError } = await supabase
        .from(TASKS_TABLE)
        .select("id")
        .eq("is_archived", false);
      
      if (tasksError) {
        console.warn("タスク統計取得に失敗:", tasksError.message);
      }
      
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
    },
    "チーム統計取得に失敗しました"
  );
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
      
      const tasks = (taskMembers || []).map(tm => tm.task).filter((t): t is Tasks => t !== null && t !== undefined);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: Tasks) => t.status === "DONE").length;
      const inProgressTasks = tasks.filter((t: Tasks) => t.status === "IN_PROGRESS").length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // 最後の活動日時を取得
      const lastActivity = tasks.length > 0 
        ? Math.max(...tasks.map((t: Tasks) => new Date(t.updated_at).getTime()))
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
    
    const tasks = (taskMembers || []).map(tm => tm.task).filter((t): t is Tasks => t !== null && t !== undefined);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: Tasks) => t.status === "DONE").length;
    const inProgressTasks = tasks.filter((t: Tasks) => t.status === "IN_PROGRESS").length;
    const overdueTasks = tasks.filter((t: Tasks) => {
      if (!t.planned_end) return false;
      return new Date(t.planned_end) < new Date() && t.status !== "DONE";
    }).length;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // 平均タスク期間を計算
    const completedTasksWithDuration = tasks.filter((t: Tasks) => 
      t.status === "DONE" && t.actual_start && t.actual_end
    );
    const averageTaskDuration = completedTasksWithDuration.length > 0 
      ? completedTasksWithDuration.reduce((sum: number, t: Tasks) => {
          const duration = new Date(t.actual_end!).getTime() - new Date(t.actual_start!).getTime();
          return sum + duration;
        }, 0) / completedTasksWithDuration.length / (1000 * 60 * 60 * 24) // 日数に変換
      : 0;
    
    // 最後の活動日時
    const lastActivity = tasks.length > 0 
      ? Math.max(...tasks.map((t: Tasks) => new Date(t.updated_at).getTime()))
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
    // task_membersテーブルには updated_at がないため、tasksテーブルから直接取得
    // task_members.user_id でフィルタリングするために inner join を使用
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(`
        id,
        task_name,
        status,
        updated_at,
        task_members!inner (
          user_id,
          role
        )
      `)
      .eq("task_members.user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("ユーザー活動履歴取得に失敗:", error.message);
      return [];
    }
    
    const activities: UserActivityLog[] = (tasks || []).map((task: Tasks, index: number) => ({
      id: index + 1,
      user_id: userId,
      action: "TASK_UPDATE",
      description: `タスク「${task.task_name}」のステータスが${task.status}に更新されました`,
      target_type: "task",
      target_id: task.id,
      created_at: task.updated_at
    }));
    
    return activities;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("ユーザー活動履歴取得でエラー:", msg);
    return [];
  }
}

// ユーザーアバターアップロード（将来実装予定）
export async function uploadUserAvatar(
  userId: number, 
  file: File
): Promise<string | null> {
  try {
    // TODO: Supabase Storage を使用した実際のアバターアップロード実装が必要
    console.log("アバターアップロード機能は未実装です:", { userId, fileName: file.name });
    return null;
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
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`);
    
    // フィルター適用（利用可能なフィールドのみ）
    if (filters) {
      // 部署フィルター（完全一致）。NULL安全のため値が指定された場合のみ適用
      if (filters.department) {
        supabaseQuery = supabaseQuery.eq("department", filters.department);
      }
      // 役職フィルター（完全一致）。NULL安全のため値が指定された場合のみ適用
      if (filters.position) {
        supabaseQuery = supabaseQuery.eq("position", filters.position);
      }
      // スキルフィルター（部分一致/ANY含有）。JSONB 配列に対して OR 条件でゆるく検索
      if (filters.skills && filters.skills.length > 0) {
        // Supabaseのjsonb演算がクライアントクエリで限定的なため、簡易的に ilike を併用
        const skillConds = filters.skills.map((s) => `skills::text.ilike.%${s}%`).join(",");
        if (skillConds) {
          supabaseQuery = supabaseQuery.or(skillConds);
        }
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

// ===== プロジェクトメンバー CRUD =====
// 用途: TeamManagement の将来 UI 連携を想定し、サービス層のみ先行実装

/**
 * プロジェクトメンバー一覧を取得する
 * @param projectId 対象プロジェクトID
 */
export async function listProjectMembers(projectId: number): Promise<Array<{ user_id: number; role: string; joined_at: string; user: User }>> {
  try {
    const { data, error } = await supabase
      .from(PROJECT_MEMBERS_TABLE)
      .select(`
        user_id,
        role,
        joined_at,
        user:users(*)
      `)
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true });
    if (error) {
      console.error("プロジェクトメンバー取得に失敗:", error.message);
      return [];
    }
    // ProjectMembers with User join の結果を適切な型で返す
    interface ProjectMemberWithUserData extends ProjectMembers {
      user: User;
    }
    return (data || []) as ProjectMemberWithUserData[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("プロジェクトメンバー取得でエラー:", msg);
    return [];
  }
}

/**
 * プロジェクトメンバーを追加する
 */
export async function addProjectMember(projectId: number, userId: number, role: "OWNER" | "CONTRIBUTOR" | "REVIEWER"): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(PROJECT_MEMBERS_TABLE)
      .insert([{ project_id: projectId, user_id: userId, role }]);
    if (error) {
      console.error("プロジェクトメンバー追加に失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("プロジェクトメンバー追加でエラー:", msg);
    return false;
  }
}

/**
 * プロジェクトメンバーの役割を更新する
 */
export async function updateProjectMemberRole(projectId: number, userId: number, role: "OWNER" | "CONTRIBUTOR" | "REVIEWER"): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(PROJECT_MEMBERS_TABLE)
      .update({ role })
      .eq("project_id", projectId)
      .eq("user_id", userId);
    if (error) {
      console.error("プロジェクトメンバー役割更新に失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("プロジェクトメンバー役割更新でエラー:", msg);
    return false;
  }
}

/**
 * プロジェクトメンバーを削除する
 */
export async function removeProjectMember(projectId: number, userId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(PROJECT_MEMBERS_TABLE)
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);
    if (error) {
      console.error("プロジェクトメンバー削除に失敗:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("プロジェクトメンバー削除でエラー:", msg);
    return false;
  }
}

export type { SelectFilter, WhereCondition };
