"""
Master data collection orchestrator.
Run: python collect_all.py

Combines data from BLS, O*NET, Adzuna, levels.fyi, and layoffs.fyi
to produce 35 career records and seed them into Supabase.
"""
import json
import os
import sys

# Add parent dir to path
sys.path.insert(0, os.path.dirname(__file__))

from fetch_bls import load_career_mapping, get_oews_data, get_projections_data
from fetch_onet import get_onet_data
from fetch_job_openings import get_job_openings
from scrape_levels import get_levels_data
from scrape_layoffs import get_layoff_data
from fetch_bls_history import get_historical_data
from validate_data import validate_careers
from seed_supabase import seed_careers, seed_market_trends

def estimate_salary_trajectory(oews_entry):
    """Estimate salary trajectory from BLS percentile data."""
    if not oews_entry:
        return {}
    return {
        "salary_entry": oews_entry.get("p25"),
        "salary_year3": oews_entry.get("median"),
        "salary_year5": oews_entry.get("p75"),
        "salary_year10": oews_entry.get("p90"),
        "salary_median": oews_entry.get("median"),
        "salary_p25": oews_entry.get("p25"),
        "salary_p75": oews_entry.get("p75"),
        "salary_p90": oews_entry.get("p90"),
    }

# Career-specific salary trajectory overrides.
# For professional-school paths, BLS percentiles don't reflect actual career progression
# because the p25/p75 distribution doesn't account for training years.
# These are research-informed estimates (entry = first year after training).
SALARY_OVERRIDES = {
    "physician": {
        "salary_entry": 65000,       # Residency salary (PGY-1)
        "salary_year3": 250000,      # Early attending (3 yrs after med school)
        "salary_year5": 300000,      # Established attending
        "salary_year10": 380000,     # Senior attending / subspecialty
    },
    "lawyer": {
        "salary_entry": 100000,      # First-year associate (Big Law ~$225K, but median ~$100K)
        "salary_year3": 145000,      # Mid-level associate
        "salary_year5": 190000,      # Senior associate
        "salary_year10": 275000,     # Junior partner / counsel
    },
    "pharmacist": {
        "salary_entry": 120000,      # New grad pharmacist
        "salary_year3": 136000,      # Staff pharmacist
        "salary_year5": 150000,      # Clinical / specialist
        "salary_year10": 175000,     # Pharmacy manager / director
    },
    "physician-assistant": {
        "salary_entry": 110000,      # New grad PA
        "salary_year3": 130000,      # Experienced PA
        "salary_year5": 145000,      # Senior / specialty PA
        "salary_year10": 165000,     # Lead PA / surgical specialty
    },
    "college-professor": {
        "salary_entry": 62000,       # Assistant professor
        "salary_year3": 75000,       # Assistant professor (pre-tenure)
        "salary_year5": 90000,       # Associate professor (post-tenure)
        "salary_year10": 130000,     # Full professor
    },
    "investment-banking": {
        "salary_entry": 110000,      # First-year analyst (base, excluding bonus)
        "salary_year3": 175000,      # Associate (base + some bonus)
        "salary_year5": 250000,      # VP (total comp)
        "salary_year10": 500000,     # Director / MD (total comp)
    },
    "management-consultant": {
        "salary_entry": 95000,       # Analyst / Associate
        "salary_year3": 145000,      # Engagement Manager
        "salary_year5": 200000,      # Principal / AP
        "salary_year10": 350000,     # Partner
    },
    "startup-founder": {
        "salary_entry": 50000,       # Early stage, bootstrapping
        "salary_year3": 100000,      # Series A founder salary
        "salary_year5": 150000,      # Growth stage
        "salary_year10": 250000,     # Established company (excludes equity)
    },
    "high-school-teacher": {
        "salary_entry": 45000,       # Starting teacher salary
        "salary_year3": 52000,       # 3 years experience
        "salary_year5": 60000,       # 5 years + masters bump
        "salary_year10": 75000,      # 10 years + leadership
    },
    "research-scientist": {
        "salary_entry": 55000,       # Postdoc
        "salary_year3": 80000,       # Research scientist (industry or late postdoc)
        "salary_year5": 110000,      # Senior scientist
        "salary_year10": 155000,     # Principal scientist
    },
    "nonprofit-manager": {
        "salary_entry": 48000,       # Program coordinator
        "salary_year3": 62000,       # Program manager
        "salary_year5": 78000,       # Director level
        "salary_year10": 110000,     # Executive director
    },
    "graphic-designer": {
        "salary_entry": 42000,       # Junior designer
        "salary_year3": 55000,       # Mid-level designer
        "salary_year5": 72000,       # Senior designer
        "salary_year10": 95000,      # Art director
    },
    "content-strategist": {
        "salary_entry": 45000,       # Junior content writer
        "salary_year3": 60000,       # Content strategist
        "salary_year5": 78000,       # Senior strategist
        "salary_year10": 110000,     # Head of content
    },
    "policy-analyst": {
        "salary_entry": 55000,       # Entry-level analyst
        "salary_year3": 75000,       # Mid-level
        "salary_year5": 95000,       # Senior analyst
        "salary_year10": 140000,     # Director of policy
    },
    "urban-planner": {
        "salary_entry": 52000,       # Planner I
        "salary_year3": 65000,       # Planner II
        "salary_year5": 82000,       # Senior planner
        "salary_year10": 110000,     # Planning manager / director
    },
    "public-health-analyst": {
        "salary_entry": 52000,       # Entry epidemiologist
        "salary_year3": 70000,       # Mid-level
        "salary_year5": 90000,       # Senior epidemiologist
        "salary_year10": 125000,     # Division director
    },
}

def combine_career_data(career_id, career_info, oews, projections, onet, openings, levels, layoffs):
    """Combine all data sources into a single career record."""
    soc = career_info["soc_code"]

    # Start with mapping metadata
    record = {
        "id": career_id,
        "title": career_info["title"],
        "path_type": career_info["path_type"],
        "category": career_info["category"],
    }

    # BLS OEWS (salary + employment)
    oews_data = oews.get(soc, {})
    trajectory = estimate_salary_trajectory(oews_data)
    record.update(trajectory)
    record["employment_total"] = oews_data.get("employment")

    # Apply career-specific salary trajectory overrides
    if career_id in SALARY_OVERRIDES:
        overrides = SALARY_OVERRIDES[career_id]
        record.update(overrides)
        # Set median to year3 value if not already set from BLS
        if not record.get("salary_median"):
            record["salary_median"] = overrides.get("salary_year3")
        record["salary_source"] = "BLS OEWS 2024 + research estimates"

    # Ensure salary_median is never None — use year3 as fallback
    if not record.get("salary_median") and record.get("salary_year3"):
        record["salary_median"] = record["salary_year3"]

    # Override tech salaries with levels.fyi if available
    if career_id in levels:
        tech_comp = levels[career_id]
        # levels.fyi reflects total comp - use as median, adjust others
        if tech_comp and record.get("salary_median"):
            ratio = tech_comp / record["salary_median"] if record["salary_median"] else 1
            record["salary_median"] = tech_comp
            if record.get("salary_entry"):
                record["salary_entry"] = int(record["salary_entry"] * ratio)
            if record.get("salary_year3"):
                record["salary_year3"] = tech_comp
            if record.get("salary_year5"):
                record["salary_year5"] = int(record["salary_year5"] * ratio)
            if record.get("salary_year10"):
                record["salary_year10"] = int(record["salary_year10"] * ratio)
            record["salary_source"] = "BLS OEWS 2024 + levels.fyi"
        else:
            record["salary_source"] = "levels.fyi"
    else:
        record["salary_source"] = "BLS OEWS May 2024"

    # BLS Projections (growth + openings)
    proj_data = projections.get(soc, {})
    record["growth_rate"] = proj_data.get("growth_rate")
    record["growth_rate_numeric"] = proj_data.get("growth_rate_numeric")
    record["annual_openings"] = proj_data.get("annual_openings")
    record["minimum_degree"] = proj_data.get("minimum_degree") or career_info.get("minimum_degree")

    # Job openings (Adzuna or fallback)
    record["current_openings"] = openings.get(career_id)
    record["openings_source"] = "Adzuna API" if openings.get(career_id) else "BLS Projections (annual estimate)"

    # O*NET (description, skills, interests)
    onet_data = onet.get(soc, {})
    record["description"] = onet_data.get("description", f"Career in {career_info['category']}")
    record["skills"] = onet_data.get("skills", [])
    record["interests"] = onet_data.get("interests", [])

    # Layoff risk
    record["layoff_risk"] = layoffs.get(career_id, "medium")

    # Static metadata from career_mapping
    record["preferred_majors"] = career_info.get("preferred_majors", [])
    record["alternative_paths"] = career_info.get("alternative_paths", [])
    record["work_style"] = career_info.get("work_style", [])
    record["industries"] = career_info.get("industries", [])
    record["typical_employers"] = career_info.get("typical_employers", [])
    record["work_life_balance"] = career_info.get("work_life_balance")
    record["remote_options"] = career_info.get("remote_options")
    record["geographic_concentration"] = career_info.get("geographic_concentration", [])
    record["certifications"] = career_info.get("certifications", [])
    record["experience"] = career_info.get("experience")
    record["typical_path"] = career_info.get("typical_path")
    record["time_to_promotion"] = career_info.get("time_to_promotion")
    record["career_ceiling"] = career_info.get("career_ceiling")
    record["related_paths"] = career_info.get("related_paths", [])
    record["is_trending"] = career_info.get("is_trending", False)

    return record

def main():
    print("=" * 60)
    print("PathIQ Data Collection Pipeline")
    print("=" * 60)

    # Load master career mapping
    career_mapping = load_career_mapping()
    print(f"\nLoaded {len(career_mapping)} careers from career_mapping.json")

    # Collect data from all sources
    sources = {}

    # Required sources
    print("\n" + "=" * 40)
    print("REQUIRED SOURCES")
    print("=" * 40)

    oews = get_oews_data(career_mapping)
    sources["BLS OEWS"] = len(oews) > 0

    projections = get_projections_data(career_mapping)
    sources["BLS Projections"] = len(projections) > 0

    onet = get_onet_data(career_mapping)
    sources["O*NET"] = len(onet) > 0

    # Optional sources
    print("\n" + "=" * 40)
    print("OPTIONAL SOURCES")
    print("=" * 40)

    openings = get_job_openings(career_mapping)
    sources["Adzuna"] = len(openings) > 0

    levels = get_levels_data(career_mapping)
    sources["levels.fyi"] = len(levels) > 0

    layoffs, layoffs_live = get_layoff_data(career_mapping)
    if layoffs_live:
        sources["layoffs.fyi"] = True
    else:
        sources["layoffs.fyi (fallback)"] = True

    historical = get_historical_data(career_mapping)
    sources["BLS Historical"] = len(historical) > 0

    # Combine all data
    print("\n" + "=" * 40)
    print("COMBINING DATA")
    print("=" * 40)

    careers_data = []
    for career_id, career_info in career_mapping.items():
        record = combine_career_data(
            career_id, career_info, oews, projections, onet, openings, levels, layoffs
        )
        careers_data.append(record)
        print(f"  {career_id}: ${record.get('salary_median', 0):,} median, "
              f"{record.get('growth_rate', 'N/A')} growth")

    # Validate data
    print("\n" + "=" * 40)
    print("VALIDATING DATA")
    print("=" * 40)

    warnings = validate_careers(careers_data)
    if warnings:
        print(f"  [warn] {len(warnings)} validation warnings (see above)")
    else:
        print("  [ok] All data passed validation")

    # Seed to Supabase
    print("\n" + "=" * 40)
    print("SEEDING DATABASE")
    print("=" * 40)

    success = seed_careers(careers_data)

    # Seed historical market trends
    if historical:
        seed_market_trends(historical, career_mapping)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Careers processed: {len(careers_data)}")
    for source, status in sources.items():
        icon = "✓" if status else "✗"
        print(f"  {source}: {icon}")

    if success:
        print(f"\n✓ {len(careers_data)} careers seeded to Supabase")
    else:
        print(f"\n! Careers saved to data/raw/careers_export.json")
        print("  Run 'python seed_supabase.py' after setting up Supabase credentials")

    return careers_data

if __name__ == "__main__":
    main()
