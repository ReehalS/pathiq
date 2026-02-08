"""
Scrape layoffs.fyi for industry layoff risk data.
Falls back to static risk assessment if scraping fails.
"""
import json
import os

def load_career_mapping():
    mapping_path = os.path.join(os.path.dirname(__file__), "career_mapping.json")
    with open(mapping_path) as f:
        return json.load(f)

def scrape_layoffs(career_mapping):
    """
    Attempt to scrape layoffs.fyi for layoff data.
    Requires Playwright with Chromium installed.
    """
    print("\n--- Scraping layoffs.fyi ---")
    result = {}

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            try:
                page.goto("https://layoffs.fyi/", wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(5000)

                # Try to extract layoff data from the Airtable embed
                rows = page.query_selector_all("tr, [class*='row']")
                industry_counts = {}

                for row in rows[:200]:
                    text = row.inner_text()
                    parts = text.split("\t") if "\t" in text else text.split("  ")
                    if len(parts) >= 3:
                        try:
                            count = int(parts[1].replace(",", "").strip())
                            # Categorize by industry keywords
                            text_lower = text.lower()
                            if any(w in text_lower for w in ["tech", "software", "ai", "crypto"]):
                                industry_counts["tech"] = industry_counts.get("tech", 0) + count
                            elif any(w in text_lower for w in ["finance", "bank", "fintech"]):
                                industry_counts["finance"] = industry_counts.get("finance", 0) + count
                            elif any(w in text_lower for w in ["health", "pharma", "biotech"]):
                                industry_counts["healthcare"] = industry_counts.get("healthcare", 0) + count
                        except (ValueError, IndexError):
                            continue

                # Map to career risk levels
                for career_id, info in career_mapping.items():
                    category = info["category"]
                    count = industry_counts.get(category, 0)
                    if count > 10000:
                        result[career_id] = "high"
                    elif count > 1000:
                        result[career_id] = "medium"
                    else:
                        result[career_id] = "low"

            except Exception as e:
                print(f"  [warn] Scraping failed: {e}")

            browser.close()

    except ImportError:
        print("  [skip] Playwright not installed")
    except Exception as e:
        print(f"  [error] layoffs.fyi scraping failed: {e}")

    return result

# Fallback: static risk assessment based on industry knowledge
FALLBACK_LAYOFF_RISK = {
    "software-engineer": "medium",
    "data-scientist": "medium",
    "product-manager": "medium",
    "ux-designer": "medium",
    "cybersecurity-analyst": "low",
    "devops-engineer": "medium",
    "ai-ml-engineer": "low",
    "management-consultant": "low",
    "investment-banking": "medium",
    "financial-analyst": "low",
    "marketing-manager": "medium",
    "accountant": "low",
    "supply-chain-analyst": "low",
    "physician": "low",
    "registered-nurse": "low",
    "physician-assistant": "low",
    "pharmacist": "low",
    "public-health-analyst": "low",
    "mechanical-engineer": "low",
    "civil-engineer": "low",
    "electrical-engineer": "low",
    "biomedical-engineer": "low",
    "research-scientist": "low",
    "environmental-scientist": "low",
    "economist": "low",
    "lawyer": "low",
    "policy-analyst": "low",
    "urban-planner": "low",
    "high-school-teacher": "low",
    "college-professor": "medium",
    "graphic-designer": "medium",
    "technical-writer": "medium",
    "content-strategist": "medium",
    "nonprofit-manager": "low",
    "startup-founder": "high",
}

def get_layoff_data(career_mapping):
    """Get layoff risk data with fallback."""
    data = scrape_layoffs(career_mapping)
    if len(data) < 5:
        print("  [fallback] Using static layoff risk assessment")
        data = FALLBACK_LAYOFF_RISK
    return data

if __name__ == "__main__":
    mapping = load_career_mapping()
    risk = get_layoff_data(mapping)
    print(f"\nLayoff risk: {len(risk)} careers")
    for level in ["high", "medium", "low"]:
        count = sum(1 for v in risk.values() if v == level)
        print(f"  {level}: {count} careers")
