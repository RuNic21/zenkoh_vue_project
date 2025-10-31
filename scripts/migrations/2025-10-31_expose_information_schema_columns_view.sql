-- information_schema.columns を public に公開するビュー
-- 目的: REST 経由でカラム情報を取得し types:fromcsv で型生成するため

CREATE OR REPLACE VIEW public.information_schema_columns AS
SELECT 
  c.table_schema,
  c.table_name,
  c.column_name,
  c.is_nullable,
  c.data_type,
  c.udt_name,
  c.column_default,
  c.is_identity
FROM information_schema.columns c
WHERE c.table_schema = 'public';

-- 注意: Supabase でこのビューを "Expose to API" に設定してください
-- 必要に応じて RLS を無効化（ビューは通常 RLS 対象外）


