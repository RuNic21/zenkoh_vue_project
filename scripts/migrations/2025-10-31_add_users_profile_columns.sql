-- ユーザー拡張カラム追加マイグレーション
-- 目的: プロフィール/ロケール/勤務時間/スキル・タグ/ログインメタ情報を users テーブルに追加

-- ========== プロフィール情報 ==========
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;          -- 名
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;           -- 姓
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;               -- 電話番号
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;          -- 部署
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;            -- 役職
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;          -- アバター画像URL
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;                 -- 自己紹介

-- ========== ロケール/言語設定 ==========
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Tokyo'; -- タイムゾーン
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ja';         -- 表示言語

-- ========== 勤務時間 ==========
-- UI は "HH:mm" の文字列を想定しているため TEXT で保持（必要に応じて TIME へ移行可能）
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_hours_start TEXT;    -- 勤務開始時刻
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_hours_end TEXT;      -- 勤務終了時刻

-- ========== スキル/タグ ==========
-- 柔軟性のため JSONB 配列として保持
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb; -- スキル配列
ALTER TABLE users ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;   -- タグ配列

-- ========== アクティビティメタ ==========
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;            -- 最終ログイン
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER NOT NULL DEFAULT 0; -- ログイン回数

-- 逆マイグレーション（必要時の参考）
-- ALTER TABLE users DROP COLUMN IF EXISTS first_name;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_name;
-- ALTER TABLE users DROP COLUMN IF EXISTS phone;
-- ALTER TABLE users DROP COLUMN IF EXISTS department;
-- ALTER TABLE users DROP COLUMN IF EXISTS position;
-- ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
-- ALTER TABLE users DROP COLUMN IF EXISTS bio;
-- ALTER TABLE users DROP COLUMN IF EXISTS timezone;
-- ALTER TABLE users DROP COLUMN IF EXISTS language;
-- ALTER TABLE users DROP COLUMN IF EXISTS work_hours_start;
-- ALTER TABLE users DROP COLUMN IF EXISTS work_hours_end;
-- ALTER TABLE users DROP COLUMN IF EXISTS skills;
-- ALTER TABLE users DROP COLUMN IF EXISTS tags;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
-- ALTER TABLE users DROP COLUMN IF EXISTS login_count;


