"""
Push combined career data to Supabase.
"""
import json
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def seed_careers(careers_data):
    """Push career records to Supabase."""
    print("\n--- Seeding Supabase ---")

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  [error] SUPABASE_URL and SUPABASE_KEY required in data/.env")
        print("  [info] Saving to data/raw/careers_export.json instead")
        raw_dir = os.path.join(os.path.dirname(__file__), "raw")
        os.makedirs(raw_dir, exist_ok=True)
        with open(os.path.join(raw_dir, "careers_export.json"), "w") as f:
            json.dump(careers_data, f, indent=2)
        print(f"  [saved] {len(careers_data)} careers to careers_export.json")
        return False

    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Upsert careers (insert or update)
        for i, career in enumerate(careers_data):
            try:
                supabase.table("careers").upsert(career).execute()
                print(f"  [{i+1}/{len(careers_data)}] {career['id']}: {career['title']}")
            except Exception as e:
                print(f"  [error] Failed to upsert {career['id']}: {e}")

        print(f"\n  [done] Seeded {len(careers_data)} careers to Supabase")
        return True

    except ImportError:
        print("  [error] supabase package not installed: pip install supabase")
        return False
    except Exception as e:
        print(f"  [error] Supabase seeding failed: {e}")
        return False

def seed_market_trends(historical_data, career_mapping):
    """Push historical market trend data to Supabase."""
    print("\n--- Seeding Market Trends ---")

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  [skip] No Supabase credentials, saving trends to JSON")
        raw_dir = os.path.join(os.path.dirname(__file__), "raw")
        os.makedirs(raw_dir, exist_ok=True)
        trends = []
        for career_id, info in career_mapping.items():
            soc = info["soc_code"]
            soc_data = historical_data.get(soc, {})
            for year in sorted(set(
                list(soc_data.get("wage", {}).keys()) +
                list(soc_data.get("employment", {}).keys())
            )):
                trends.append({
                    "career_id": career_id,
                    "date": f"{year}-05-01",
                    "average_salary": soc_data.get("wage", {}).get(year),
                    "employment_count": soc_data.get("employment", {}).get(year),
                    "source": "BLS OES",
                })
        with open(os.path.join(raw_dir, "market_trends_export.json"), "w") as f:
            json.dump(trends, f, indent=2)
        print(f"  [saved] {len(trends)} trend records to market_trends_export.json")
        return False

    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        count = 0
        for career_id, info in career_mapping.items():
            soc = info["soc_code"]
            soc_data = historical_data.get(soc, {})
            years = sorted(set(
                list(soc_data.get("wage", {}).keys()) +
                list(soc_data.get("employment", {}).keys())
            ))
            for year in years:
                record = {
                    "career_id": career_id,
                    "date": f"{year}-05-01",
                    "average_salary": soc_data.get("wage", {}).get(year),
                    "employment_count": soc_data.get("employment", {}).get(year),
                    "source": "BLS OES",
                }
                try:
                    supabase.table("market_trends").upsert(
                        record,
                        on_conflict="career_id,date"
                    ).execute()
                    count += 1
                except Exception as e:
                    print(f"  [error] Failed trend {career_id}/{year}: {e}")

        print(f"  [done] Seeded {count} market trend records")
        return True

    except ImportError:
        print("  [error] supabase package not installed: pip install supabase")
        return False
    except Exception as e:
        print(f"  [error] Market trends seeding failed: {e}")
        return False


if __name__ == "__main__":
    # Load from export file if available
    export_path = os.path.join(os.path.dirname(__file__), "raw", "careers_export.json")
    if os.path.exists(export_path):
        with open(export_path) as f:
            data = json.load(f)
        seed_careers(data)
    else:
        print("No careers_export.json found. Run collect_all.py first.")
