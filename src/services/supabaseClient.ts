import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase 接続クライアントの生成と接続テスト関数を提供します
// 必要な環境変数は Vite の `import.meta.env` から読み込みます
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	// ユーザー向け: .env.local に VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を設定してください
	// 開発者向けログ（日本語）
	console.error(
		"Supabase の環境変数が未設定です。.env.local に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください"
	);
}

export const supabase: SupabaseClient = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
	},
});

// 軽量な接続確認: 認証セッション取得を用いて疎通を確認します
export async function testSupabaseConnection(): Promise<{
	ok: boolean;
	message: string;
	error?: string;
}> {
	try {
		const { error } = await supabase.auth.getSession();
		if (error) {
			return { ok: false, message: "接続に失敗しました", error: error.message };
		}
		return { ok: true, message: "接続に成功しました" };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { ok: false, message: "エラーが発生しました", error: msg };
	}
}

export type SelectFilter = Record<string, string | number | boolean | null>;
export type WhereOperator =
	| "eq"
	| "neq"
	| "gt"
	| "gte"
	| "lt"
	| "lte"
	| "like"
	| "ilike"
	| "is"
	| "in"
	| "contains"
	| "containedBy";
export type WhereCondition = { column: string; op: WhereOperator; value: unknown };

function normalizeContainsValue(
	value: unknown
): string | readonly unknown[] | Record<string, unknown> {
	if (typeof value === "string") {
		return value;
	}
	if (Array.isArray(value)) {
		return value as readonly unknown[];
	}
	if (value !== null && typeof value === "object") {
		return value as Record<string, unknown>;
	}
	return String(value);
}

export async function selectRows<T = unknown>(
	tableName: string,
	columns: string = "*",
	filter?: SelectFilter,
	where?: WhereCondition[]
): Promise<{
	ok: boolean;
	data?: T[];
	message: string;
	error?: string;
}> {
	try {
		let query = supabase.from(tableName).select(columns);

		if (filter) {
			for (const [columnName, value] of Object.entries(filter)) {
				query = query.eq(columnName, value as unknown as string | number | boolean | null);
			}
		}

		if (where && where.length > 0) {
			for (const cond of where) {
				switch (cond.op) {
					case "eq":
						query = query.eq(cond.column, cond.value as unknown as string | number | boolean | null);
						break;
					case "neq":
						query = query.neq(cond.column, cond.value as unknown as string | number | boolean | null);
						break;
					case "gt":
						query = query.gt(cond.column, cond.value as unknown as number | string);
						break;
					case "gte":
						query = query.gte(cond.column, cond.value as unknown as number | string);
						break;
					case "lt":
						query = query.lt(cond.column, cond.value as unknown as number | string);
						break;
					case "lte":
						query = query.lte(cond.column, cond.value as unknown as number | string);
						break;
					case "like":
						query = query.like(cond.column, cond.value as unknown as string);
						break;
					case "ilike":
						query = query.ilike(cond.column, cond.value as unknown as string);
						break;
					case "is":
						query = query.is(cond.column, cond.value as unknown as string | null);
						break;
					case "in": {
						const values = Array.isArray(cond.value) ? (cond.value as unknown[]) : [cond.value];
						query = query.in(cond.column, values as unknown[]);
						break;
					}
					case "contains":
						query = query.contains(cond.column, normalizeContainsValue(cond.value));
						break;
					case "containedBy":
						query = query.containedBy(cond.column, normalizeContainsValue(cond.value));
						break;
					default:
						break;
				}
			}
		}

		const { data, error } = await query;
		if (error) {
			return { ok: false, message: "エラーが発生しました", error: error.message };
		}
		return { ok: true, data: (data as T[]) ?? [], message: "正常に処理されました" };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		return { ok: false, message: "エラーが発生しました", error: msg };
	}
}