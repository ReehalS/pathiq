# PathIQ Data Pipeline

## Quick Start

```bash
cd data
pip install -r requirements.txt
python collect_all.py
```

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase credentials
2. (Optional) Add Adzuna API keys for live job counts
3. Run `python collect_all.py`

## Data Sources

### Required (Automated Download)

| Source          | What It Provides                          | Size  |
| --------------- | ----------------------------------------- | ----- |
| BLS OEWS        | Salaries, employment for 800+ occupations | ~5MB  |
| BLS Projections | Growth rates, annual openings             | ~2MB  |
| O\*NET Database | Descriptions, skills, interests           | ~25MB |

### Optional (Free API / Scraping)

| Source      | What It Provides        | Setup                                 |
| ----------- | ----------------------- | ------------------------------------- |
| Adzuna      | Live job posting counts | Free signup at developer.adzuna.com   |
| levels.fyi  | Tech total compensation | Automated scraping (needs Playwright) |
| layoffs.fyi | Industry layoff risk    | Automated scraping (needs Playwright) |

## Files

- `career_mapping.json` — 35 careers mapped to SOC codes
- `fetch_bls.py` — BLS OEWS salary + projections data
- `fetch_onet.py` — O\*NET skills, interests, descriptions
- `fetch_job_openings.py` — Adzuna API job counts
- `scrape_levels.py` — levels.fyi tech compensation
- `scrape_layoffs.py` — layoffs.fyi layoff risk
- `seed_supabase.py` — Push data to Supabase
- `collect_all.py` — Master orchestrator

## Environment Variables

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...  # service role key
ADZUNA_APP_ID=...     # optional
ADZUNA_APP_KEY=...    # optional
```
