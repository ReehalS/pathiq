-- PathIQ Migration 001: Historical data + AI content columns
-- Run this in Supabase SQL Editor if you already have existing tables.
-- If setting up from scratch, just run schema.sql instead.

-- 1. Add employment_count to market_trends
ALTER TABLE market_trends ADD COLUMN IF NOT EXISTS employment_count INTEGER;

-- 2. Add unique constraint on (career_id, date) for upsert support
ALTER TABLE market_trends DROP CONSTRAINT IF EXISTS market_trends_career_id_date_key;
ALTER TABLE market_trends ADD CONSTRAINT market_trends_career_id_date_key UNIQUE (career_id, date);

-- 3. Add AI content columns to careers
ALTER TABLE careers ADD COLUMN IF NOT EXISTS ai_description TEXT;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS ai_trajectory TEXT;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS ai_requirements TEXT;
ALTER TABLE careers ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMPTZ;

-- 4. RLS policies for market_trends insert/update (safe to re-run)
DO $$ BEGIN
  CREATE POLICY "Public insert trends" ON market_trends FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public update trends" ON market_trends FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
