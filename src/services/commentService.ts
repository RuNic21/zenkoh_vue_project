import { supabase } from "./supabaseClient";
import type { TaskCommentInsert, TaskCommentWithAuthor } from "@/types/comment";

// コメントサービス：タスクに紐づくコメントの取得・登録を提供する
// - DB 直接アクセスはここに集約し、コンポーネントからは本サービスを呼び出す

/**
 * 指定タスクのコメント一覧を取得する（新着順）
 * @param taskId 対象タスクID
 * @returns TaskCommentWithAuthor 配列
 */
export async function listTaskComments(taskId: number): Promise<TaskCommentWithAuthor[]> {
  try {
    const { data, error } = await supabase
      .from("v_task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("コメント一覧の取得に失敗:", error.message);
      return [];
    }

    return (data as TaskCommentWithAuthor[]) ?? [];
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("コメント一覧の取得で予期せぬエラー:", msg);
    return [];
  }
}

/**
 * コメントを登録する
 * @param payload TaskCommentInsert（task_id, author_user_id, content）
 * @returns 作成後の TaskCommentWithAuthor（ビュー再取得）または null
 */
export async function createTaskComment(
  payload: TaskCommentInsert
): Promise<TaskCommentWithAuthor | null> {
  try {
    const { data: inserted, error: insertError } = await supabase
      .from("task_comments")
      .insert({
        task_id: payload.task_id,
        author_user_id: payload.author_user_id,
        content: payload.content,
        // project_id は DB トリガーで同期
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("コメントの作成に失敗:", insertError.message);
      return null;
    }

    const insertedId = inserted?.id as number | undefined;
    if (!insertedId) {
      return null;
    }

    const { data: rows, error: fetchError } = await supabase
      .from("v_task_comments")
      .select("*")
      .eq("id", insertedId)
      .single();

    if (fetchError) {
      console.error("作成直後のコメント取得に失敗:", fetchError.message);
      return null;
    }

    return rows as TaskCommentWithAuthor;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("コメントの作成で予期せぬエラー:", msg);
    return null;
  }
}



