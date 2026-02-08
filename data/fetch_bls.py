"""
Fetch and parse BLS OEWS (salary/employment) and Employment Projections data.
Downloads ZIP files, extracts Excel, and filters to our 35 career SOC codes.
"""
import json
import os
import zipfile
import pandas as pd
import requests

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")
OEWS_URL = "https://www.bls.gov/oes/special-requests/oesm24nat.zip"
PROJECTIONS_URL = "https://www.bls.gov/emp/ind-occ-matrix/occupation.xlsx"

def ensure_raw_dir():
    os.makedirs(RAW_DIR, exist_ok=True)

def download_file(url, filename):
    filepath = os.path.join(RAW_DIR, filename)
    if os.path.exists(filepath):
        print(f"  [skip] {filename} already exists")
        return filepath
    print(f"  [download] {url}")
    headers = {"User-Agent": "PathIQ-DataPipeline/1.0 (educational project)"}
    resp = requests.get(url, headers=headers, timeout=120)
    resp.raise_for_status()
    with open(filepath, "wb") as f:
        f.write(resp.content)
    print(f"  [saved] {filepath} ({len(resp.content) / 1024:.0f} KB)")
    return filepath

def load_career_mapping():
    mapping_path = os.path.join(os.path.dirname(__file__), "career_mapping.json")
    with open(mapping_path) as f:
        return json.load(f)

def get_soc_codes(career_mapping):
    """Get unique SOC codes from career mapping."""
    return list(set(c["soc_code"] for c in career_mapping.values()))

def parse_clean_number(val):
    """Parse BLS numeric values, handling suppressed markers."""
    if pd.isna(val):
        return None
    s = str(val).strip().replace(",", "").replace("$", "")
    if s in ("*", "#", "**", "N/A", "-", ""):
        return None
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return None

def fetch_oews(career_mapping):
    """Download and parse BLS OEWS data for salaries and employment."""
    print("\n--- Fetching BLS OEWS Data ---")
    ensure_raw_dir()

    soc_codes = get_soc_codes(career_mapping)
    result = {}

    try:
        zip_path = download_file(OEWS_URL, "oesm24nat.zip")

        # Extract ZIP
        with zipfile.ZipFile(zip_path, "r") as zf:
            xlsx_files = [n for n in zf.namelist() if n.endswith(".xlsx") and "national" in n.lower()]
            if not xlsx_files:
                xlsx_files = [n for n in zf.namelist() if n.endswith(".xlsx")]

            if not xlsx_files:
                print("  [warn] No Excel file found in OEWS ZIP")
                return result

            xlsx_name = xlsx_files[0]
            zf.extract(xlsx_name, RAW_DIR)
            xlsx_path = os.path.join(RAW_DIR, xlsx_name)

        print(f"  [parse] {xlsx_name}")
        df = pd.read_excel(xlsx_path)

        # Normalize column names
        df.columns = [c.strip().upper() for c in df.columns]

        # Find the right columns (BLS naming varies slightly)
        occ_col = next((c for c in df.columns if "OCC_CODE" in c), None)
        if not occ_col:
            occ_col = next((c for c in df.columns if "OCC" in c and "CODE" in c), df.columns[0])

        # Filter to national, detailed occupations
        if "O_GROUP" in df.columns:
            df = df[df["O_GROUP"] == "detailed"]
        if "AREA_TYPE" in df.columns:
            df = df[df["AREA_TYPE"] == 1]
        elif "AREA_TITLE" in df.columns:
            df = df[df["AREA_TITLE"].str.contains("National", case=False, na=False)]

        for _, row in df.iterrows():
            code = str(row.get(occ_col, "")).strip()
            if code not in soc_codes:
                continue

            result[code] = {
                "median": parse_clean_number(row.get("A_MEDIAN")),
                "mean": parse_clean_number(row.get("A_MEAN")),
                "p10": parse_clean_number(row.get("A_PCT10")),
                "p25": parse_clean_number(row.get("A_PCT25")),
                "p75": parse_clean_number(row.get("A_PCT75")),
                "p90": parse_clean_number(row.get("A_PCT90")),
                "employment": parse_clean_number(row.get("TOT_EMP")),
            }

        print(f"  [done] Found salary data for {len(result)}/{len(soc_codes)} SOC codes")
    except Exception as e:
        print(f"  [error] OEWS fetch failed: {e}")

    return result

def fetch_projections(career_mapping):
    """Download and parse BLS Employment Projections data."""
    print("\n--- Fetching BLS Employment Projections ---")
    ensure_raw_dir()

    soc_codes = get_soc_codes(career_mapping)
    result = {}

    try:
        filepath = download_file(PROJECTIONS_URL, "occupation_projections.xlsx")

        print(f"  [parse] occupation_projections.xlsx")
        # Try reading with different header rows
        df = None
        for header_row in range(0, 5):
            try:
                test_df = pd.read_excel(filepath, header=header_row)
                cols = [str(c).lower() for c in test_df.columns]
                if any("occupation" in c or "occ" in c for c in cols):
                    df = test_df
                    break
            except Exception:
                continue

        if df is None:
            df = pd.read_excel(filepath, header=1)

        df.columns = [str(c).strip() for c in df.columns]

        # Find relevant columns by pattern matching
        code_col = None
        growth_col = None
        openings_col = None
        edu_col = None

        for c in df.columns:
            cl = c.lower()
            if ("code" in cl or "soc" in cl) and code_col is None:
                code_col = c
            if "percent" in cl and "change" in cl and growth_col is None:
                growth_col = c
            if ("opening" in cl or "annual" in cl) and openings_col is None:
                openings_col = c
            if "education" in cl and edu_col is None:
                edu_col = c

        if code_col is None:
            print("  [warn] Could not find occupation code column in projections")
            return result

        for _, row in df.iterrows():
            code = str(row.get(code_col, "")).strip()
            # Handle codes like "15-1252" or "15-1252.00"
            code_short = code[:7] if len(code) > 7 else code
            if code_short not in soc_codes:
                continue

            growth_pct = parse_clean_number(row.get(growth_col)) if growth_col else None
            annual_openings = parse_clean_number(row.get(openings_col)) if openings_col else None
            education = str(row.get(edu_col, "")) if edu_col else None

            result[code_short] = {
                "growth_rate_numeric": growth_pct,
                "growth_rate": f"{growth_pct}%" if growth_pct is not None else None,
                "annual_openings": annual_openings,
                "minimum_degree": education if education and education != "nan" else None,
            }

        print(f"  [done] Found projections for {len(result)}/{len(soc_codes)} SOC codes")
    except Exception as e:
        print(f"  [error] Projections fetch failed: {e}")

    return result

# Fallback data when BLS download fails (real BLS data, manually compiled)
FALLBACK_OEWS = {
    "15-1252": {"median": 132270, "p25": 98540, "p75": 168070, "p90": 202960, "employment": 1795300},
    "15-2051": {"median": 108020, "p25": 80420, "p75": 145560, "p90": 184550, "employment": 192300},
    "11-2021": {"median": 156580, "p25": 109960, "p75": 208000, "p90": 239200, "employment": 316680},
    "15-1255": {"median": 98540, "p25": 72840, "p75": 123860, "p90": 150880, "employment": 109600},
    "15-1212": {"median": 120360, "p25": 92600, "p75": 153060, "p90": 182930, "employment": 175350},
    "15-1244": {"median": 95360, "p25": 72820, "p75": 120970, "p90": 149830, "employment": 367500},
    "13-1111": {"median": 99410, "p25": 72000, "p75": 134560, "p90": 167650, "employment": 806400},
    "13-2051": {"median": 99890, "p25": 72130, "p75": 137140, "p90": 173890, "employment": 328600},
    "13-2011": {"median": 79880, "p25": 63980, "p75": 101350, "p90": 130710, "employment": 1366800},
    "13-1081": {"median": 79150, "p25": 61240, "p75": 100540, "p90": 126090, "employment": 191580},
    "29-1215": {"median": 229300, "p25": 147380, "p75": 261390, "p90": 261390, "employment": 55810},
    "29-1141": {"median": 86070, "p25": 68200, "p75": 106670, "p90": 132680, "employment": 3175390},
    "29-1071": {"median": 130020, "p25": 109850, "p75": 152900, "p90": 170470, "employment": 148050},
    "29-1051": {"median": 136030, "p25": 115000, "p75": 161040, "p90": 174160, "employment": 330100},
    "19-1041": {"median": 83420, "p25": 64920, "p75": 108600, "p90": 132070, "employment": 8940},
    "17-2141": {"median": 99200, "p25": 79750, "p75": 123530, "p90": 148680, "employment": 284140},
    "17-2051": {"median": 95890, "p25": 76740, "p75": 119100, "p90": 145090, "employment": 316400},
    "17-2071": {"median": 106950, "p25": 84020, "p75": 134510, "p90": 166900, "employment": 189580},
    "17-2031": {"median": 100980, "p25": 78070, "p75": 125750, "p90": 158510, "employment": 18900},
    "19-1042": {"median": 100890, "p25": 68520, "p75": 133520, "p90": 168020, "employment": 136620},
    "19-2041": {"median": 78980, "p25": 61100, "p75": 100720, "p90": 129070, "employment": 86100},
    "19-3011": {"median": 115730, "p25": 80530, "p75": 157780, "p90": 198230, "employment": 16780},
    "23-1011": {"median": 145760, "p25": 82630, "p75": 208980, "p90": 239200, "employment": 793010},
    "19-3094": {"median": 132470, "p25": 78960, "p75": 164470, "p90": 182970, "employment": 4940},
    "19-3051": {"median": 81800, "p25": 63940, "p75": 103620, "p90": 126120, "employment": 38030},
    "25-2031": {"median": 65220, "p25": 51320, "p75": 84540, "p90": 104250, "employment": 1016960},
    "25-1099": {"median": 84380, "p25": 55290, "p75": 125610, "p90": 174550, "employment": 171640},
    "27-1024": {"median": 59970, "p25": 44570, "p75": 78680, "p90": 100190, "employment": 246240},
    "27-3042": {"median": 80050, "p25": 59470, "p75": 104660, "p90": 128600, "employment": 48310},
    "27-3043": {"median": 73690, "p25": 49740, "p75": 103200, "p90": 146520, "employment": 47930},
    "11-9151": {"median": 77030, "p25": 57450, "p75": 101200, "p90": 126070, "employment": 184080},
    "11-1021": {"median": 101280, "p25": 65860, "p75": 155970, "p90": 218810, "employment": 3236050},
}

FALLBACK_PROJECTIONS = {
    "15-1252": {"growth_rate_numeric": 17, "growth_rate": "17%", "annual_openings": 140100, "minimum_degree": "Bachelor's degree"},
    "15-2051": {"growth_rate_numeric": 36, "growth_rate": "36%", "annual_openings": 20800, "minimum_degree": "Bachelor's degree"},
    "11-2021": {"growth_rate_numeric": 8, "growth_rate": "8%", "annual_openings": 34000, "minimum_degree": "Bachelor's degree"},
    "15-1255": {"growth_rate_numeric": 16, "growth_rate": "16%", "annual_openings": 18900, "minimum_degree": "Bachelor's degree"},
    "15-1212": {"growth_rate_numeric": 33, "growth_rate": "33%", "annual_openings": 17300, "minimum_degree": "Bachelor's degree"},
    "15-1244": {"growth_rate_numeric": 3, "growth_rate": "3%", "annual_openings": 24500, "minimum_degree": "Bachelor's degree"},
    "13-1111": {"growth_rate_numeric": 11, "growth_rate": "11%", "annual_openings": 92700, "minimum_degree": "Bachelor's degree"},
    "13-2051": {"growth_rate_numeric": 9, "growth_rate": "9%", "annual_openings": 27400, "minimum_degree": "Bachelor's degree"},
    "13-2011": {"growth_rate_numeric": 6, "growth_rate": "6%", "annual_openings": 126500, "minimum_degree": "Bachelor's degree"},
    "13-1081": {"growth_rate_numeric": 18, "growth_rate": "18%", "annual_openings": 23800, "minimum_degree": "Bachelor's degree"},
    "29-1215": {"growth_rate_numeric": 3, "growth_rate": "3%", "annual_openings": 24200, "minimum_degree": "Doctoral or professional degree"},
    "29-1141": {"growth_rate_numeric": 6, "growth_rate": "6%", "annual_openings": 193100, "minimum_degree": "Bachelor's degree"},
    "29-1071": {"growth_rate_numeric": 28, "growth_rate": "28%", "annual_openings": 12200, "minimum_degree": "Master's degree"},
    "29-1051": {"growth_rate_numeric": -2, "growth_rate": "-2%", "annual_openings": 11400, "minimum_degree": "Doctoral or professional degree"},
    "19-1041": {"growth_rate_numeric": 27, "growth_rate": "27%", "annual_openings": 900, "minimum_degree": "Master's degree"},
    "17-2141": {"growth_rate_numeric": 10, "growth_rate": "10%", "annual_openings": 17900, "minimum_degree": "Bachelor's degree"},
    "17-2051": {"growth_rate_numeric": 5, "growth_rate": "5%", "annual_openings": 24200, "minimum_degree": "Bachelor's degree"},
    "17-2071": {"growth_rate_numeric": 5, "growth_rate": "5%", "annual_openings": 12700, "minimum_degree": "Bachelor's degree"},
    "17-2031": {"growth_rate_numeric": 5, "growth_rate": "5%", "annual_openings": 1200, "minimum_degree": "Bachelor's degree"},
    "19-1042": {"growth_rate_numeric": 10, "growth_rate": "10%", "annual_openings": 10000, "minimum_degree": "Doctoral or professional degree"},
    "19-2041": {"growth_rate_numeric": 6, "growth_rate": "6%", "annual_openings": 8000, "minimum_degree": "Bachelor's degree"},
    "19-3011": {"growth_rate_numeric": 6, "growth_rate": "6%", "annual_openings": 1500, "minimum_degree": "Master's degree"},
    "23-1011": {"growth_rate_numeric": 8, "growth_rate": "8%", "annual_openings": 39100, "minimum_degree": "Doctoral or professional degree"},
    "19-3094": {"growth_rate_numeric": 7, "growth_rate": "7%", "annual_openings": 300, "minimum_degree": "Master's degree"},
    "19-3051": {"growth_rate_numeric": 4, "growth_rate": "4%", "annual_openings": 3700, "minimum_degree": "Master's degree"},
    "25-2031": {"growth_rate_numeric": 1, "growth_rate": "1%", "annual_openings": 77400, "minimum_degree": "Bachelor's degree"},
    "25-1099": {"growth_rate_numeric": 8, "growth_rate": "8%", "annual_openings": 25000, "minimum_degree": "Doctoral or professional degree"},
    "27-1024": {"growth_rate_numeric": 3, "growth_rate": "3%", "annual_openings": 22800, "minimum_degree": "Bachelor's degree"},
    "27-3042": {"growth_rate_numeric": 7, "growth_rate": "7%", "annual_openings": 5500, "minimum_degree": "Bachelor's degree"},
    "27-3043": {"growth_rate_numeric": 4, "growth_rate": "4%", "annual_openings": 8200, "minimum_degree": "Bachelor's degree"},
    "11-9151": {"growth_rate_numeric": 9, "growth_rate": "9%", "annual_openings": 19300, "minimum_degree": "Bachelor's degree"},
    "11-1021": {"growth_rate_numeric": 6, "growth_rate": "6%", "annual_openings": 291800, "minimum_degree": "Bachelor's degree"},
}

def get_oews_data(career_mapping):
    """Get OEWS data with fallback."""
    data = fetch_oews(career_mapping)
    if len(data) < 5:
        print("  [fallback] Using compiled BLS data")
        data = FALLBACK_OEWS
    return data

def get_projections_data(career_mapping):
    """Get projections data with fallback."""
    data = fetch_projections(career_mapping)
    if len(data) < 5:
        print("  [fallback] Using compiled BLS projections")
        data = FALLBACK_PROJECTIONS
    return data

if __name__ == "__main__":
    mapping = load_career_mapping()
    oews = get_oews_data(mapping)
    proj = get_projections_data(mapping)
    print(f"\nOEWS: {len(oews)} occupations")
    print(f"Projections: {len(proj)} occupations")
    for code, d in list(oews.items())[:3]:
        print(f"  {code}: median=${d.get('median', 'N/A'):,}")
