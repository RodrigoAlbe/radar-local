-- Persistencia simples do estado do app/pipeline
-- Executar no Supabase SQL Editor ou via migrations

CREATE TABLE IF NOT EXISTS app_state_store (
  scope TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_state_store_updated_at
  ON app_state_store (updated_at DESC);
