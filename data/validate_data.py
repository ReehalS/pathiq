"""
Validate career data before seeding to Supabase.
Checks for absurd values, cross-field inconsistencies, and known-range violations.
Returns warnings but does not block seeding.
"""


# Range checks per field
FIELD_RANGES = {
    "salary_entry": (20000, 300000),
    "salary_year3": (25000, 400000),
    "salary_year5": (30000, 500000),
    "salary_year10": (35000, 700000),
    "salary_median": (30000, 500000),
    "salary_p25": (20000, 400000),
    "salary_p75": (40000, 600000),
    "salary_p90": (50000, 800000),
    "growth_rate_numeric": (-20, 100),
    "employment_total": (100, 10000000),
    "current_openings": (50, 5000000),
    "annual_openings": (50, 2000000),
}

# Known salary ranges for spot-check (median)
KNOWN_RANGES = {
    "software-engineer": (90000, 200000),
    "registered-nurse": (60000, 120000),
    "physician": (180000, 350000),
    "high-school-teacher": (45000, 90000),
    "lawyer": (90000, 200000),
    "data-scientist": (85000, 180000),
    "accountant": (55000, 110000),
    "pharmacist": (110000, 160000),
    "mechanical-engineer": (70000, 130000),
    "graphic-designer": (40000, 85000),
}


def validate_careers(careers_data):
    """Validate career records. Returns list of warning strings."""
    warnings = []

    for career in careers_data:
        cid = career.get("id", "unknown")

        # Range checks
        for field, (lo, hi) in FIELD_RANGES.items():
            val = career.get(field)
            if val is not None and (val < lo or val > hi):
                msg = f"  [warn] {cid}.{field} = {val:,} (expected {lo:,}–{hi:,})"
                warnings.append(msg)
                print(msg)

        # Cross-field: salary_entry <= salary_median
        entry = career.get("salary_entry")
        median = career.get("salary_median")
        if entry and median and entry > median * 1.1:
            msg = f"  [warn] {cid}: salary_entry ({entry:,}) > salary_median ({median:,})"
            warnings.append(msg)
            print(msg)

        # Cross-field: salary trajectory should be monotonically increasing
        trajectory = [
            career.get("salary_entry"),
            career.get("salary_year3"),
            career.get("salary_year5"),
            career.get("salary_year10"),
        ]
        trajectory = [v for v in trajectory if v is not None]
        for i in range(1, len(trajectory)):
            if trajectory[i] < trajectory[i - 1]:
                msg = (f"  [warn] {cid}: salary trajectory not increasing "
                       f"({trajectory[i-1]:,} → {trajectory[i]:,})")
                warnings.append(msg)
                print(msg)
                break

        # Known-range spot checks
        if cid in KNOWN_RANGES and median:
            lo, hi = KNOWN_RANGES[cid]
            if median < lo or median > hi:
                msg = (f"  [warn] {cid}: salary_median ({median:,}) "
                       f"outside expected range ({lo:,}–{hi:,})")
                warnings.append(msg)
                print(msg)

        # Check required fields are present
        for req in ["title", "path_type", "category"]:
            if not career.get(req):
                msg = f"  [warn] {cid}: missing required field '{req}'"
                warnings.append(msg)
                print(msg)

        # Check arrays are actually arrays
        for arr_field in ["skills", "interests", "preferred_majors"]:
            val = career.get(arr_field)
            if val is not None and not isinstance(val, list):
                msg = f"  [warn] {cid}.{arr_field} is not a list: {type(val)}"
                warnings.append(msg)
                print(msg)

    if not warnings:
        print("  [ok] All records passed validation")

    return warnings


if __name__ == "__main__":
    import json
    import os

    export_path = os.path.join(os.path.dirname(__file__), "raw", "careers_export.json")
    if os.path.exists(export_path):
        with open(export_path) as f:
            data = json.load(f)
        print(f"Validating {len(data)} careers from {export_path}")
        warns = validate_careers(data)
        print(f"\n{len(warns)} warning(s) found")
    else:
        print("No careers_export.json found. Run collect_all.py first.")
