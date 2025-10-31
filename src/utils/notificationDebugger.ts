// 通知デバッグヘルパー
// 目的: 通知が作成されない理由を診断

/**
 * 通知作成の条件をチェックしてログ出力
 */
export function debugNotificationConditions(
  taskData: any,
  assigneeInfo: any,
  projectName: string
): void {
  console.group("🔍 通知作成条件チェック");
  
  // 1. タスクデータチェック
  console.log("1️⃣ タスクデータ:", taskData);
  console.log("   - primary_assignee_id:", taskData?.primary_assignee_id);
  
  // 2. 割り当て先情報チェック
  console.log("2️⃣ 割り当て先情報:", assigneeInfo);
  if (!assigneeInfo) {
    console.warn("   ❌ 割り当て先情報が取得できませんでした");
  } else {
    console.log("   - 名前:", assigneeInfo.name);
    console.log("   - メール:", assigneeInfo.email);
    if (!assigneeInfo.email) {
      console.warn("   ❌ メールアドレスがありません");
    }
  }
  
  // 3. プロジェクト名チェック
  console.log("3️⃣ プロジェクト名:", projectName);
  
  // 4. 通知が作成される条件
  const canCreateNotification = 
    taskData?.primary_assignee_id && 
    assigneeInfo && 
    assigneeInfo.email;
  
  console.log("4️⃣ 通知作成可能:", canCreateNotification ? "✅ はい" : "❌ いいえ");
  
  console.groupEnd();
}

/**
 * データベースの通知テーブルを確認
 */
export async function checkNotificationsInDatabase(): Promise<void> {
  try {
    const { supabase } = await import("@/services/supabaseClient");
    
    console.group("📊 データベース通知確認");
    
    // 最新の通知5件を取得
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (error) {
      console.error("❌ 通知取得エラー:", error);
    } else {
      console.log("✅ 最新の通知5件:", data);
      console.log("   - 件数:", data?.length || 0);
      if (data && data.length > 0) {
        console.table(data.map(n => ({
          ID: n.id,
          件名: n.subject,
          送信先: n.to_email,
          状態: n.status,
          作成日時: new Date(n.created_at).toLocaleString("ja-JP")
        })));
      }
    }
    
    console.groupEnd();
  } catch (e) {
    console.error("通知確認エラー:", e);
  }
}

/**
 * ユーザーテーブルの状態を確認
 */
export async function checkUsersTable(): Promise<void> {
  try {
    const { supabase } = await import("@/services/supabaseClient");
    
    console.group("👥 ユーザーテーブル確認");
    
    const { data, error } = await supabase
      .from("users")
      .select("id, email, display_name")
      .limit(10);
    
    if (error) {
      console.error("❌ ユーザー取得エラー:", error);
    } else {
      console.log("✅ ユーザー一覧:", data);
      console.table(data);
    }
    
    console.groupEnd();
  } catch (e) {
    console.error("ユーザー確認エラー:", e);
  }
}

