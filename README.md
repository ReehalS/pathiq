# PathIQ - Data-Driven Career Intelligence

The Bloomberg Terminal for career decisions. PathIQ helps undergraduates compare post-graduation paths using AI analysis and live market data.

## Features

- **Career Dashboard** — Browse and filter 35 career paths with real BLS/O\*NET data
- **Market Insights** — Aggregate charts: growth rates, salary rankings, category breakdown
- **Multi-Path Comparison** — Side-by-side comparison with salary trajectories and AI analysis (GPT-4o)
- **AI Career Chat** — Natural language exploration with database-backed answers (GPT-4o-mini)
- **Career Detail Pages** — Historical salary/employment charts (10 years), skills radar, AI-enhanced descriptions
- **Onboarding** — Personalized experience based on your major, year, and interests

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (Postgres)
- **AI**: OpenAI GPT-4o (comparison) + GPT-4o-mini (chat, content generation)
- **Data**: BLS OEWS, BLS Projections, BLS Historical OES, O\*NET Database
- **Charts**: Recharts
- **Deploy**: Vercel

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your keys:

| Variable                        | Required | Description                            |
| ------------------------------- | -------- | -------------------------------------- |
| `OPENAI_API_KEY`                | Yes      | OpenAI API key for AI Chat and Compare |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase project URL                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase anon/public key               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Yes      | Supabase service role key              |

### 3. Set up Supabase

**Fresh setup:** Run `supabase/schema.sql` in your Supabase SQL editor.

**Existing database:** Run `supabase/migration_001_historical_and_ai.sql` to add historical data and AI content columns.

### 4. Seed data

```bash
cd data
pip install -r requirements.txt
cp .env.example .env
```

Edit `data/.env` with your credentials, then:

```bash
python collect_all.py
```

This will:

- Fetch salary/employment data from BLS OEWS
- Fetch growth projections from BLS Projections
- Fetch skills/interests from O\*NET
- Fetch historical employment/wage data (2014–2024) from BLS
- Optionally fetch job counts from Adzuna, tech comp from levels.fyi, layoff data
- Validate all data (range checks, cross-field checks, known-range spot checks)
- Seed `careers` and `market_trends` tables in Supabase

### 5. Generate AI content (optional)

Requires `OPENAI_API_KEY` in `data/.env`. Uses GPT-4o-mini (~$0.10 total for 35 careers).

```bash
python generate_ai_content.py
```

This generates for each career:

- An engaging description (~150 words)
- A career trajectory narrative (~150 words)
- Preparation advice for students (~150 words)

Results are cached in the database. Use `--force` to regenerate.

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Pipeline

### Sources

| Source             | What It Provides                             | Required                |
| ------------------ | -------------------------------------------- | ----------------------- |
| BLS OEWS           | Salaries, employment (800+ occupations)      | Yes                     |
| BLS Projections    | Growth rates, annual openings                | Yes                     |
| O\*NET Database    | Skills, interests, descriptions              | Yes                     |
| BLS Historical OES | 10-year salary/employment trends (2014–2024) | Yes (fallback included) |
| Adzuna API         | Live job posting counts                      | Optional                |
| levels.fyi         | Tech total compensation                      | Optional                |
| layoffs.fyi        | Industry layoff risk                         | Optional                |
| OpenAI GPT-4o-mini | AI-enhanced career descriptions              | Optional                |

### Environment Variables (data pipeline)

| Variable         | Required | Description                                                                                                                            |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`   | Yes      | Supabase project URL                                                                                                                   |
| `SUPABASE_KEY`   | Yes      | Supabase service role key                                                                                                              |
| `ADZUNA_APP_ID`  | No       | Adzuna API app ID                                                                                                                      |
| `ADZUNA_APP_KEY` | No       | Adzuna API key                                                                                                                         |
| `BLS_API_KEY`    | No       | BLS API key ([free registration](https://data.bls.gov/registrationEngine/)) — increases rate limits; fallback data included without it |
| `OPENAI_API_KEY` | No       | Required only for `generate_ai_content.py`                                                                                             |

### Data Validation

The pipeline includes automatic validation (`data/validate_data.py`) that checks:

- **Range checks**: salary, growth rate, employment within expected bounds
- **Cross-field checks**: entry salary ≤ median, salary trajectory is monotonically increasing
- **Spot checks**: known salary ranges for key careers (SWE, RN, physician, teacher, etc.)
- Warnings are printed to console but don't block seeding

### Running Individual Scripts

```bash
cd data

# Fetch only BLS data
python fetch_bls.py

# Fetch only O*NET data
python fetch_onet.py

# Fetch only historical trends
python fetch_bls_history.py

# Validate existing exported data
python validate_data.py

# Generate AI content (requires OPENAI_API_KEY)
python generate_ai_content.py         # skip already-generated careers
python generate_ai_content.py --force  # regenerate all

# Seed Supabase from exported JSON
python seed_supabase.py

# Run full pipeline
python collect_all.py
```

## Project Structure

```
src/
├── app/
│   ├── dashboard/page.tsx     # Career grid with filters
│   ├── insights/page.tsx      # Market overview charts + aggregate stats
│   ├── careers/[id]/page.tsx  # Career detail with historical charts
│   ├── compare/page.tsx       # Multi-path comparison
│   ├── chat/page.tsx          # AI career chat
│   ├── onboarding/page.tsx    # User profile setup
│   └── api/
│       ├── careers/           # Career CRUD endpoints
│       ├── market-trends/     # Historical trend data endpoint
│       ├── compare/           # AI comparison endpoint
│       └── chat/              # AI chat endpoint
├── components/                # UI components (charts, cards, filters)
├── hooks/                     # React hooks (useCareers, useMarketTrends)
└── lib/                       # Types, utils, Supabase client

data/
├── collect_all.py             # Master pipeline orchestrator
├── fetch_bls.py               # BLS OEWS + Projections fetcher
├── fetch_bls_history.py       # BLS historical time-series (2014–2024)
├── fetch_onet.py              # O*NET database parser
├── fetch_job_openings.py      # Adzuna API job counts
├── scrape_levels.py           # levels.fyi tech compensation
├── scrape_layoffs.py          # layoffs.fyi risk data
├── validate_data.py           # Data validation checks
├── generate_ai_content.py     # GPT-4o-mini content generation
├── seed_supabase.py           # Database seeder
├── career_mapping.json        # Master career → SOC code mapping
└── requirements.txt           # Python dependencies

supabase/
├── schema.sql                 # Full database schema (fresh setup)
└── migration_001_historical_and_ai.sql  # Incremental migration
```

## Deployment

```bash
vercel
```

Add environment variables in Vercel dashboard:

- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Built for ProdCon 2026.
