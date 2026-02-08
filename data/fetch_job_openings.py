"""
Fetch live job opening counts from Adzuna API.
Falls back to BLS annual openings data if no API key provided.
"""
import json
import os
import time
import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs/us/search/1"

def load_career_mapping():
    mapping_path = os.path.join(os.path.dirname(__file__), "career_mapping.json")
    with open(mapping_path) as f:
        return json.load(f)

def fetch_adzuna_count(query):
    """Fetch job count from Adzuna for a search query."""
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "what": query,
        "results_per_page": 0,
        "content-type": "application/json",
    }
    try:
        resp = requests.get(ADZUNA_BASE, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data.get("count", 0)
    except Exception as e:
        print(f"    [warn] Adzuna query failed for '{query}': {e}")
        return None

def fetch_job_openings(career_mapping):
    """Fetch live job openings for all careers."""
    print("\n--- Fetching Job Openings ---")
    result = {}

    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        print("  [skip] No Adzuna API keys found. Using fallback estimates.")
        return result

    for career_id, info in career_mapping.items():
        search_terms = info.get("search_terms", [info["title"]])
        query = search_terms[0]
        print(f"  [query] {career_id}: '{query}'")

        count = fetch_adzuna_count(query)
        if count is not None:
            result[career_id] = count
            print(f"    → {count:,} openings")

        time.sleep(1)  # Rate limit: 1 req/sec

    print(f"  [done] Got openings for {len(result)}/{len(career_mapping)} careers")
    return result

# Fallback estimates based on BLS data + general market knowledge
FALLBACK_OPENINGS = {
    "software-engineer": 140100,
    "data-scientist": 20800,
    "product-manager": 34000,
    "ux-designer": 18900,
    "cybersecurity-analyst": 17300,
    "devops-engineer": 24500,
    "ai-ml-engineer": 20800,
    "management-consultant": 92700,
    "investment-banking": 27400,
    "financial-analyst": 27400,
    "marketing-manager": 34000,
    "accountant": 126500,
    "supply-chain-analyst": 23800,
    "physician": 24200,
    "registered-nurse": 193100,
    "physician-assistant": 12200,
    "pharmacist": 11400,
    "public-health-analyst": 900,
    "mechanical-engineer": 17900,
    "civil-engineer": 24200,
    "electrical-engineer": 12700,
    "biomedical-engineer": 1200,
    "research-scientist": 10000,
    "environmental-scientist": 8000,
    "economist": 1500,
    "lawyer": 39100,
    "policy-analyst": 300,
    "urban-planner": 3700,
    "high-school-teacher": 77400,
    "college-professor": 25000,
    "graphic-designer": 22800,
    "technical-writer": 5500,
    "content-strategist": 8200,
    "nonprofit-manager": 19300,
    "startup-founder": 291800,
}

def get_job_openings(career_mapping):
    """Get job openings with fallback."""
    data = fetch_job_openings(career_mapping)
    if len(data) < 5:
        print("  [fallback] Using estimated openings from BLS data")
        data = FALLBACK_OPENINGS
    return data

if __name__ == "__main__":
    mapping = load_career_mapping()
    openings = get_job_openings(mapping)
    print(f"\nJob openings: {len(openings)} careers")
    total = sum(openings.values())
    print(f"Total openings: {total:,}")
