// ユーザー情報取得ヘルパー
// 目的: ユーザーIDからユーザー情報（名前、メールアドレス）を取得

import { supabase } from "@/services/supabaseClient";
import type { Users } from "@/types/db/users";

/**
 * ユーザーIDからユーザー情報を取得
 * @param userId ユーザーID
 * @returns ユーザー情報（名前、メール）または null
 */
export async function getUserInfo(userId: number | null | undefined): Promise<{
  name: string;
  email: string;
} | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("display_name, email")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.warn(`ユーザーID ${userId} の情報取得に失敗:`, error);
      return null;
    }

    return {
      name: data.display_name || "不明なユーザー",
      email: data.email || ""
    };
  } catch (e) {
    console.error("ユーザー情報取得エラー:", e);
    return null;
  }
}

/**
 * 複数のユーザーIDからユーザー情報を一括取得
 * @param userIds ユーザーIDの配列
 * @returns ユーザーIDをキーとしたユーザー情報のマップ
 */
export async function getUserInfoBatch(userIds: number[]): Promise<Map<number, {
  name: string;
  email: string;
}>> {
  const resultMap = new Map<number, { name: string; email: string }>();

  if (userIds.length === 0) return resultMap;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, email")
      .in("id", userIds);

    if (error || !data) {
      console.warn("ユーザー情報一括取得に失敗:", error);
      return resultMap;
    }

    data.forEach((user) => {
      resultMap.set(user.id, {
        name: user.display_name || "不明なユーザー",
        email: user.email || ""
      });
    });

    return resultMap;
  } catch (e) {
    console.error("ユーザー情報一括取得エラー:", e);
    return resultMap;
  }
}

/**
 * 現在ログイン中のユーザー情報を取得
 * @returns ユーザー情報または null
 */
export async function getCurrentUserInfo(): Promise<{
  id: number;
  name: string;
  email: string;
} | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.warn("現在のユーザー情報取得に失敗:", error);
      return null;
    }

    // auth.users の email を取得
    const email = user.email || "";

    // users テーブルから追加情報を取得
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      console.warn("ユーザーテーブルからの情報取得に失敗:", userError);
      return {
        id: 0,
        name: user.user_metadata?.display_name || email.split("@")[0] || "不明なユーザー",
        email
      };
    }

    return {
      id: userData.id,
      name: userData.display_name || email.split("@")[0] || "不明なユーザー",
      email
    };
  } catch (e) {
    console.error("現在のユーザー情報取得エラー:", e);
    return null;
  }
}

