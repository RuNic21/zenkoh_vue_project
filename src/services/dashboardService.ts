import { supabase } from "./supabaseClient";

// ダッシュボード用のプロジェクト進捗行の型
export interface ProjectProgressRow {
  // プロジェクトID
  id: number;
  // プロジェクト名
  name: string;
  // オーナー名（users.display_name）
  owner: string;
  // 進捗率（tasks.progress_percent の平均）
  progress: number;
  // 状態（進捗から算出）
  status: string;
  // 期限（projects.end_date を文字列化）
  dueDate: string;
}

// ダッシュボード用集計サービス
// 目的: UI レイヤーから DB アクセスロジックを分離し、テスト容易性と責務分離を確保する
export async function fetchProjectProgress(limit: number = 10): Promise<ProjectProgressRow[]> {
  try {
    // 1) プロジェクト一覧を取得
    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("id,name,owner_user_id,end_date")
      .order("id", { ascending: false })
      .limit(limit);
    if (projErr) throw new Error(projErr.message);

    const projectIds = (projects ?? []).map((p) => p.id);

    // 2) 対象プロジェクトのタスク進捗をまとめて取得
    const { data: tasks, error: taskErr } = await supabase
      .from("tasks")
      .select("project_id,progress_percent")
      .in("project_id", projectIds.length > 0 ? projectIds : [-1]);
    if (taskErr) throw new Error(taskErr.message);

    // 3) owner ユーザー名を一括取得
    const ownerIds = Array.from(
      new Set((projects ?? []).map((p) => p.owner_user_id).filter((v) => v != null))
    ) as number[];
    let ownersMap: Record<number, string> = {};
    if (ownerIds.length > 0) {
      const { data: owners, error: userErr } = await supabase
        .from("users")
        .select("id,display_name")
        .in("id", ownerIds);
      if (userErr) throw new Error(userErr.message);
      ownersMap = (owners ?? []).reduce((acc, u) => {
        acc[u.id as number] = (u.display_name as string) ?? "-";
        return acc;
      }, {} as Record<number, string>);
    }

    // 4) 集計して表示用配列を構築
    const progressByProject = new Map<number, { sum: number; count: number }>();
    for (const t of tasks ?? []) {
      const key = t.project_id as number;
      const cur = progressByProject.get(key) ?? { sum: 0, count: 0 };
      progressByProject.set(key, {
        sum: cur.sum + (t.progress_percent as number),
        count: cur.count + 1,
      });
    }

    return (projects ?? []).map((p) => {
      const agg = progressByProject.get(p.id) ?? { sum: 0, count: 0 };
      const avg = agg.count > 0 ? Math.round(agg.sum / agg.count) : 0;
      const status = avg >= 100 ? "完了" : "進行中";
      const owner = p.owner_user_id != null ? ownersMap[p.owner_user_id as number] ?? "-" : "-";
      const due = p.end_date ? String(p.end_date) : "-";
      return { id: p.id, name: p.name as string, owner, progress: avg, status, dueDate: due };
    });
  } catch (e) {
    console.error("ダッシュボード集計に失敗:", e);
    return [];
  }
}


