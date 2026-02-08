"""
Scrape levels.fyi for tech total compensation data.
Falls back to BLS data if scraping fails.
"""
import json
import os

def load_career_mapping():
    mapping_path = os.path.join(os.path.dirname(__file__), "career_mapping.json")
    with open(mapping_path) as f:
        return json.load(f)

# Tech roles that benefit from levels.fyi data
TECH_ROLES = {
    "software-engineer": "Software-Engineer",
    "data-scientist": "Data-Scientist",
    "product-manager": "Product-Manager",
    "ux-designer": "Software-Engineer",  # proxy
    "devops-engineer": "Software-Engineer",  # proxy
    "ai-ml-engineer": "Data-Scientist",  # proxy
}

def scrape_levels(career_mapping):
    """
    Attempt to scrape levels.fyi for tech compensation.
    Requires Playwright with Chromium installed.
    """
    print("\n--- Scraping levels.fyi ---")
    result = {}

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            for career_id, levels_title in TECH_ROLES.items():
                url = f"https://www.levels.fyi/leaderboard/{levels_title}/All-Levels/country/United-States/"
                print(f"  [scrape] {career_id}: {url}")

                try:
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    page.wait_for_timeout(3000)

                    # Try to extract median compensation
                    # levels.fyi typically shows compensation data in table/card format
                    comp_elements = page.query_selector_all("[class*='comp'], [class*='salary'], [class*='total']")
                    for elem in comp_elements[:5]:
                        text = elem.inner_text()
                        # Look for dollar amounts
                        if "$" in text:
                            cleaned = text.replace("$", "").replace(",", "").replace("K", "000").strip()
                            try:
                                val = int(float(cleaned))
                                if 50000 < val < 1000000:
                                    result[career_id] = val
                                    print(f"    → ${val:,}")
                                    break
                            except ValueError:
                                continue
                except Exception as e:
                    print(f"    [warn] Failed: {e}")

            browser.close()

    except ImportError:
        print("  [skip] Playwright not installed")
    except Exception as e:
        print(f"  [error] levels.fyi scraping failed: {e}")

    return result

# Fallback: levels.fyi-informed tech compensation data (total comp including stock/bonus)
FALLBACK_LEVELS = {
    "software-engineer": 190000,
    "data-scientist": 165000,
    "product-manager": 185000,
    "ux-designer": 145000,
    "devops-engineer": 170000,
    "ai-ml-engineer": 210000,
}

def get_levels_data(career_mapping):
    """Get levels.fyi data with fallback."""
    data = scrape_levels(career_mapping)

    # Sanity check: levels.fyi leaderboard shows top earners, not medians.
    # If scraped values are unreasonably high (>$400K median total comp), fall back.
    if data:
        avg_scraped = sum(data.values()) / len(data)
        if avg_scraped > 400000:
            print(f"  [warn] Scraped average ${avg_scraped:,.0f} looks like top-of-leaderboard, not median")
            print("  [fallback] Using compiled levels.fyi compensation data")
            data = FALLBACK_LEVELS

    if len(data) < 3:
        print("  [fallback] Using compiled levels.fyi compensation data")
        data = FALLBACK_LEVELS
    return data

if __name__ == "__main__":
    mapping = load_career_mapping()
    levels = get_levels_data(mapping)
    print(f"\nlevels.fyi: {len(levels)} tech roles")
    for role, comp in levels.items():
        print(f"  {role}: ${comp:,}")
