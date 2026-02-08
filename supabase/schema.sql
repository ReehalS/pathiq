-- PathIQ Database Schema
-- Run this in Supabase SQL Editor to set up all tables

-- Careers table (main)
CREATE TABLE careers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  path_type TEXT NOT NULL CHECK (path_type IN (
    'industry-job', 'graduate-school', 'research',
    'fellowship', 'professional-school', 'alternative'
  )),
  category TEXT NOT NULL,

  -- Compensation
  salary_entry INTEGER,
  salary_year3 INTEGER,
  salary_year5 INTEGER,
  salary_year10 INTEGER,
  salary_median INTEGER,
  salary_p25 INTEGER,
  salary_p75 INTEGER,
  salary_p90 INTEGER,

  -- Market Data
  current_openings INTEGER,
  growth_rate TEXT,
  growth_rate_numeric REAL,
  employment_total INTEGER,
  annual_openings INTEGER,
  layoff_risk TEXT DEFAULT 'medium' CHECK (layoff_risk IN ('low', 'medium', 'high')),

  -- Education
  minimum_degree TEXT,
  preferred_majors TEXT[],
  alternative_paths TEXT[],

  -- Fit / Interests
  interests TEXT[],
  work_style TEXT[],
  industries TEXT[],

  -- Details
  description TEXT,
  typical_employers TEXT[],
  work_life_balance TEXT,
  remote_options TEXT CHECK (remote_options IN ('fully-remote', 'hybrid', 'on-site', 'varies')),
  geographic_concentration TEXT[],

  -- Requirements
  skills TEXT[],
  certifications TEXT[],
  experience TEXT,

  -- Trajectory
  typical_path TEXT,
  time_to_promotion TEXT,
  career_ceiling TEXT,

  -- Related
  related_paths TEXT[],

  -- Sources
  salary_source TEXT,
  openings_source TEXT,

  -- Metadata
  is_trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Market trends (time-series for charts)
CREATE TABLE market_trends (
  id SERIAL PRIMARY KEY,
  career_id TEXT REFERENCES careers(id),
  date DATE NOT NULL,
  openings_count INTEGER,
  average_salary INTEGER,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved comparisons
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  paths_compared TEXT[] NOT NULL,
  ai_analysis TEXT,
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_careers_path_type ON careers(path_type);
CREATE INDEX idx_careers_category ON careers(category);
CREATE INDEX idx_careers_salary ON careers(salary_median);
CREATE INDEX idx_market_trends_career ON market_trends(career_id, date);

-- Enable Row Level Security (open for now, no auth)
ALTER TABLE careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read careers" ON careers FOR SELECT USING (true);
CREATE POLICY "Public read trends" ON market_trends FOR SELECT USING (true);
CREATE POLICY "Public all comparisons" ON comparisons FOR ALL USING (true);
