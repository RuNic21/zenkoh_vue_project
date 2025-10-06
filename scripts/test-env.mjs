import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const mode = process.env.NODE_ENV || "development";
const env = loadEnv(mode, process.cwd(), "VITE_");

const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function log(message) {
  console.log(message);
}

function logError(message) {
  console.error(message);
}

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    logError("環境変数が見つかりません: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    process.exitCode = 1;
  } else {
    log("環境変数の読み込みに成功しました");
    const maskedKey = `${supabaseAnonKey.slice(0, 6)}...(${supabaseAnonKey.length}文字)`;
    log(`VITE_SUPABASE_URL: ${supabaseUrl}`);
    log(`VITE_SUPABASE_ANON_KEY: ${maskedKey}`);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { error } = await supabase.auth.getSession();
    if (error) {
      logError("接続に失敗しました");
      logError(`詳細: ${error.message}`);
      process.exitCode = 1;
    } else {
      log("接続に成功しました");
      process.exitCode = 0;
    }
  }
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  logError("エラーが発生しました");
  logError(`詳細: ${msg}`);
  process.exitCode = 1;
}


