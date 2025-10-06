import { createClient } from "@supabase/supabase-js";

// Supabase 接続クライアントの生成と接続テスト関数を提供します
// 必要な環境変数は Vite の `import.meta.env` から読み込みます
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	console.error(
		"Supabase の環境変数が未設定です。.env.local に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください"
	);
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true,
	},
});

/**
 * 軽量な接続確認: 認証セッション取得を用いて疎通を確認します
 * @returns {Promise<{ ok: boolean; message: string; error?: string }>} 結果
 */
export async function testSupabaseConnection() {
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

/**
 * シンプルなselectヘルパー
 * @template T
 * @param {string} tableName - テーブル名
 * @param {string} [columns='*'] - 取得カラム
 * @param {Record<string, string|number|boolean|null>} [filter] - 等価条件の簡易フィルタ
 * @returns {Promise<{ ok: boolean; data?: T[]; message: string; error?: string }>} 結果
 */
/**
 * where条件配列を追加で適用できるselectヘルパー
 * @param {string} tableName
 * @param {string} [columns]
 * @param {Record<string, string|number|boolean|null>} [filter]
 * @param {{ column: string; op: 'eq'|'neq'|'gt'|'gte'|'lt'|'lte'|'like'|'ilike'|'is'|'in'|'contains'|'containedBy'; value: any }[]} [where]
 */
export async function selectRows(tableName, columns = "*", filter, where) {
    try {
        let query = supabase.from(tableName).select(columns);

        if (filter) {
            for (const [columnName, value] of Object.entries(filter)) {
                query = query.eq(columnName, /** @type {any} */ (value));
            }
        }

        if (Array.isArray(where) && where.length > 0) {
            for (const cond of where) {
                switch (cond.op) {
                    case 'eq':
                        query = query.eq(cond.column, cond.value);
                        break;
                    case 'neq':
                        query = query.neq(cond.column, cond.value);
                        break;
                    case 'gt':
                        query = query.gt(cond.column, cond.value);
                        break;
                    case 'gte':
                        query = query.gte(cond.column, cond.value);
                        break;
                    case 'lt':
                        query = query.lt(cond.column, cond.value);
                        break;
                    case 'lte':
                        query = query.lte(cond.column, cond.value);
                        break;
                    case 'like':
                        query = query.like(cond.column, cond.value);
                        break;
                    case 'ilike':
                        query = query.ilike(cond.column, cond.value);
                        break;
                    case 'is':
                        query = query.is(cond.column, cond.value);
                        break;
                    case 'in': {
                        const values = Array.isArray(cond.value) ? cond.value : [cond.value];
                        query = query.in(cond.column, values);
                        break;
                    }
                    case 'contains':
                        query = query.contains(cond.column, cond.value);
                        break;
                    case 'containedBy':
                        query = query.containedBy(cond.column, cond.value);
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
        return { ok: true, data: data ?? [], message: "正常に処理されました" };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, message: "エラーが発生しました", error: msg };
    }
}