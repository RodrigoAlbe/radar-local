-- Radar Local — Schema inicial
-- Execute este SQL no Supabase SQL Editor para criar as tabelas

-- ============================================================
-- search_jobs: registra cada busca realizada pelo usuário
-- ============================================================
CREATE TABLE IF NOT EXISTS search_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  category TEXT,
  radius INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_search_jobs_user ON search_jobs(user_id);
CREATE INDEX idx_search_jobs_created ON search_jobs(created_at DESC);

-- ============================================================
-- business_entities: negócios encontrados e normalizados
-- ============================================================
CREATE TABLE IF NOT EXISTS business_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT,
  region TEXT,
  phone TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  source_refs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_business_region ON business_entities(region);
CREATE INDEX idx_business_category ON business_entities(category);
CREATE INDEX idx_business_name ON business_entities(normalized_name);

-- ============================================================
-- digital_signals: sinais de presença digital por negócio
-- ============================================================
CREATE TABLE IF NOT EXISTS digital_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_entities(id) ON DELETE CASCADE,
  has_website BOOLEAN DEFAULT false,
  has_social_only BOOLEAN DEFAULT false,
  website_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  whatsapp_detected BOOLEAN DEFAULT false,
  linktree_url TEXT,
  google_maps_url TEXT,
  review_count INTEGER DEFAULT 0,
  average_rating NUMERIC(2,1),
  confidence NUMERIC(3,2) DEFAULT 0.5,
  presence_status TEXT NOT NULL DEFAULT 'indeterminado'
    CHECK (presence_status IN ('site_proprio', 'so_redes_sociais', 'sem_site_detectado', 'indeterminado')),
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_signals_business ON digital_signals(business_id);
CREATE INDEX idx_signals_presence ON digital_signals(presence_status);

-- ============================================================
-- lead_scores: score calculado por negócio
-- ============================================================
CREATE TABLE IF NOT EXISTS lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_entities(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  score_reasons JSONB DEFAULT '[]'::jsonb,
  priority_band TEXT NOT NULL DEFAULT 'media'
    CHECK (priority_band IN ('alta', 'media_alta', 'media', 'baixa')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scores_business ON lead_scores(business_id);
CREATE INDEX idx_scores_score ON lead_scores(score DESC);
CREATE INDEX idx_scores_band ON lead_scores(priority_band);

-- ============================================================
-- lead_pipeline: status de cada lead por usuário
-- ============================================================
CREATE TABLE IF NOT EXISTS lead_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'novo'
    CHECK (status IN ('novo', 'abordado', 'respondeu', 'sem_interesse', 'convertido')),
  notes TEXT DEFAULT '',
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(business_id, user_id)
);

CREATE INDEX idx_pipeline_user ON lead_pipeline(user_id);
CREATE INDEX idx_pipeline_status ON lead_pipeline(status);

-- ============================================================
-- RLS (Row Level Security) — cada usuário só vê seus dados
-- ============================================================
ALTER TABLE search_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own search jobs"
  ON search_jobs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own pipeline"
  ON lead_pipeline FOR ALL
  USING (auth.uid() = user_id);

-- business_entities, digital_signals e lead_scores são compartilhados
-- (um negócio é o mesmo para todos os usuários)
ALTER TABLE business_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses are readable by authenticated users"
  ON business_entities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Signals are readable by authenticated users"
  ON digital_signals FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Scores are readable by authenticated users"
  ON lead_scores FOR SELECT
  USING (auth.role() = 'authenticated');
