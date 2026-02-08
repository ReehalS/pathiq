"""
Fetch and parse O*NET database for occupation descriptions, skills, and interests.
Downloads ZIP containing Excel files, extracts relevant tables.
"""
import json
import os
import zipfile
import pandas as pd
import requests

RAW_DIR = os.path.join(os.path.dirname(__file__), "raw")
ONET_URL = "https://www.onetcenter.org/dl_files/database/db_30_1_excel.zip"

def ensure_raw_dir():
    os.makedirs(RAW_DIR, exist_ok=True)

def download_file(url, filename):
    filepath = os.path.join(RAW_DIR, filename)
    if os.path.exists(filepath):
        print(f"  [skip] {filename} already exists")
        return filepath
    print(f"  [download] {url}")
    headers = {"User-Agent": "PathIQ-DataPipeline/1.0 (educational project)"}
    resp = requests.get(url, headers=headers, timeout=300)
    resp.raise_for_status()
    with open(filepath, "wb") as f:
        f.write(resp.content)
    print(f"  [saved] {filepath} ({len(resp.content) / 1024 / 1024:.1f} MB)")
    return filepath

def load_career_mapping():
    mapping_path = os.path.join(os.path.dirname(__file__), "career_mapping.json")
    with open(mapping_path) as f:
        return json.load(f)

def get_soc_codes(career_mapping):
    return list(set(c["soc_code"] for c in career_mapping.values()))

def fetch_onet(career_mapping):
    """Download and parse O*NET database."""
    print("\n--- Fetching O*NET Database ---")
    ensure_raw_dir()

    soc_codes = get_soc_codes(career_mapping)
    result = {}

    try:
        zip_path = download_file(ONET_URL, "onet_database.zip")

        with zipfile.ZipFile(zip_path, "r") as zf:
            all_files = zf.namelist()
            onet_dir = ""
            for f in all_files:
                if "Occupation Data" in f and f.endswith(".xlsx"):
                    onet_dir = os.path.dirname(f)
                    break

            # Helper: find and read a file from the ZIP
            def read_onet_file(pattern):
                matches = [f for f in all_files if pattern in f and f.endswith(".xlsx")]
                if not matches:
                    return None
                zf.extract(matches[0], RAW_DIR)
                return pd.read_excel(os.path.join(RAW_DIR, matches[0]))

            def match_soc(onet_code):
                """Match O*NET code (e.g. 15-1252.00) to our SOC codes."""
                short = str(onet_code)[:7]
                return short if short in soc_codes else None

            # 1. Occupation Data (descriptions)
            print("  [parse] Occupation Data")
            occ_df = read_onet_file("Occupation Data")
            if occ_df is not None:
                occ_df.columns = [c.strip() for c in occ_df.columns]
                code_col = next((c for c in occ_df.columns if "Code" in c), occ_df.columns[0])
                desc_col = next((c for c in occ_df.columns if "Description" in c), None)

                for _, row in occ_df.iterrows():
                    soc = match_soc(row[code_col])
                    if soc and desc_col:
                        if soc not in result:
                            result[soc] = {}
                        result[soc]["description"] = str(row[desc_col])

            # 2. Interests (RIASEC)
            print("  [parse] Interests")
            int_df = read_onet_file("Interests")
            if int_df is not None:
                int_df.columns = [c.strip() for c in int_df.columns]
                code_col = next((c for c in int_df.columns if "Code" in c), int_df.columns[0])
                elem_col = next((c for c in int_df.columns if "Element Name" in c or "Interest" in c), None)
                # Match "Data Value" first; avoid "Scale ID" which contains non-numeric codes like 'OI'
                score_col = next((c for c in int_df.columns if "Data Value" in c), None)
                if not score_col:
                    score_col = next((c for c in int_df.columns if c.strip() == "Score"), None)

                if elem_col:
                    interests_by_soc = {}
                    for _, row in int_df.iterrows():
                        soc = match_soc(row[code_col])
                        if soc and elem_col:
                            if soc not in interests_by_soc:
                                interests_by_soc[soc] = []
                            try:
                                score = float(row[score_col]) if score_col and pd.notna(row.get(score_col)) else 0
                            except (ValueError, TypeError):
                                score = 0
                            interests_by_soc[soc].append((str(row[elem_col]), score))

                    for soc, items in interests_by_soc.items():
                        # Sort by score, take top 3
                        items.sort(key=lambda x: x[1], reverse=True)
                        top = [i[0] for i in items[:3]]
                        if soc not in result:
                            result[soc] = {}
                        result[soc]["interests"] = top

            # 3. Skills
            print("  [parse] Skills")
            skills_df = read_onet_file("Skills")
            if skills_df is not None:
                skills_df.columns = [c.strip() for c in skills_df.columns]
                code_col = next((c for c in skills_df.columns if "Code" in c), skills_df.columns[0])
                elem_col = next((c for c in skills_df.columns if "Element Name" in c or "Skill" in c), None)
                score_col = next((c for c in skills_df.columns if "Data Value" in c), None)

                if elem_col:
                    skills_by_soc = {}
                    for _, row in skills_df.iterrows():
                        soc = match_soc(row[code_col])
                        if soc:
                            if soc not in skills_by_soc:
                                skills_by_soc[soc] = []
                            try:
                                score = float(row[score_col]) if score_col and pd.notna(row.get(score_col)) else 0
                            except (ValueError, TypeError):
                                score = 0
                            skills_by_soc[soc].append((str(row[elem_col]), score))

                    for soc, items in skills_by_soc.items():
                        items.sort(key=lambda x: x[1], reverse=True)
                        # Deduplicate
                        seen = set()
                        top = []
                        for name, _ in items:
                            if name not in seen:
                                seen.add(name)
                                top.append(name)
                            if len(top) >= 8:
                                break
                        if soc not in result:
                            result[soc] = {}
                        result[soc]["skills"] = top

        print(f"  [done] O*NET data for {len(result)}/{len(soc_codes)} SOC codes")
    except Exception as e:
        print(f"  [error] O*NET fetch failed: {e}")

    return result

# Fallback O*NET data (real data, manually compiled)
FALLBACK_ONET = {
    "15-1252": {
        "description": "Research, design, and develop computer and network software or specialized utility programs. Analyze user needs and develop software solutions, applying principles and techniques of computer science, engineering, and mathematical analysis.",
        "interests": ["Investigative", "Conventional", "Realistic"],
        "skills": ["Programming", "Complex Problem Solving", "Systems Analysis", "Critical Thinking", "Mathematics", "Active Learning", "Systems Evaluation", "Judgment and Decision Making"]
    },
    "15-2051": {
        "description": "Develop and implement methods to collect, process, and analyze large amounts of data. Use analytical and statistical software to find patterns, trends, and relationships. Design surveys and experiments and analyze data.",
        "interests": ["Investigative", "Conventional", "Realistic"],
        "skills": ["Mathematics", "Programming", "Critical Thinking", "Complex Problem Solving", "Active Learning", "Systems Analysis", "Writing", "Reading Comprehension"]
    },
    "11-2021": {
        "description": "Plan, direct, or coordinate marketing policies and programs. Oversee product development, pricing strategy, and marketing research. Identify potential markets and develop marketing strategies.",
        "interests": ["Enterprising", "Conventional", "Social"],
        "skills": ["Coordination", "Persuasion", "Active Listening", "Critical Thinking", "Social Perceptiveness", "Judgment and Decision Making", "Complex Problem Solving", "Monitoring"]
    },
    "15-1255": {
        "description": "Design digital user interfaces or websites. Develop and test layouts, interfaces, functionality, and navigation for usability. Create visual elements for web pages, including layouts, graphics, and animations.",
        "interests": ["Artistic", "Investigative", "Conventional"],
        "skills": ["Active Listening", "Critical Thinking", "Complex Problem Solving", "Judgment and Decision Making", "Programming", "Systems Analysis", "Active Learning", "Reading Comprehension"]
    },
    "15-1212": {
        "description": "Plan, implement, upgrade, or monitor security measures for the protection of computer networks and information. Assess system vulnerabilities for security risks and propose and implement risk mitigation strategies.",
        "interests": ["Investigative", "Conventional", "Enterprising"],
        "skills": ["Critical Thinking", "Complex Problem Solving", "Systems Analysis", "Active Learning", "Monitoring", "Reading Comprehension", "Judgment and Decision Making", "Systems Evaluation"]
    },
    "15-1244": {
        "description": "Install, configure, and maintain an organization's local area network, wide area network, data communications network, operating systems, and physical and virtual servers.",
        "interests": ["Investigative", "Conventional", "Realistic"],
        "skills": ["Critical Thinking", "Complex Problem Solving", "Systems Analysis", "Active Learning", "Monitoring", "Systems Evaluation", "Programming", "Judgment and Decision Making"]
    },
    "13-1111": {
        "description": "Conduct organizational studies and evaluations, design systems and procedures, conduct work simplification and measurement studies, and prepare operations and procedures manuals to assist management.",
        "interests": ["Enterprising", "Investigative", "Conventional"],
        "skills": ["Complex Problem Solving", "Critical Thinking", "Active Listening", "Systems Analysis", "Judgment and Decision Making", "Writing", "Reading Comprehension", "Active Learning"]
    },
    "13-2051": {
        "description": "Conduct quantitative analyses of information involving investment programs or financial data of public or private institutions, including valuation of businesses.",
        "interests": ["Conventional", "Investigative", "Enterprising"],
        "skills": ["Mathematics", "Critical Thinking", "Active Listening", "Complex Problem Solving", "Judgment and Decision Making", "Reading Comprehension", "Writing", "Active Learning"]
    },
    "13-2011": {
        "description": "Examine, analyze, and interpret accounting records to prepare financial statements, give advice, or audit and evaluate statements prepared by others.",
        "interests": ["Conventional", "Enterprising", "Investigative"],
        "skills": ["Mathematics", "Critical Thinking", "Active Listening", "Reading Comprehension", "Complex Problem Solving", "Writing", "Monitoring", "Judgment and Decision Making"]
    },
    "13-1081": {
        "description": "Analyze and coordinate the ongoing logistical functions of a firm or organization. Responsible for the entire life cycle of a product, including acquisition, distribution, internal allocation, delivery, and disposal.",
        "interests": ["Enterprising", "Conventional", "Investigative"],
        "skills": ["Complex Problem Solving", "Critical Thinking", "Coordination", "Monitoring", "Active Listening", "Judgment and Decision Making", "Mathematics", "Systems Analysis"]
    },
    "29-1215": {
        "description": "Diagnose, treat, and help prevent diseases and injuries. Physicians examine patients, take medical histories, prescribe medications, and order, perform, and interpret diagnostic tests.",
        "interests": ["Investigative", "Social", "Realistic"],
        "skills": ["Critical Thinking", "Active Listening", "Complex Problem Solving", "Judgment and Decision Making", "Reading Comprehension", "Science", "Social Perceptiveness", "Active Learning"]
    },
    "29-1141": {
        "description": "Assess patient health problems and needs, develop and implement nursing care plans, and maintain medical records. Administer nursing care to ill, injured, convalescent, or disabled patients.",
        "interests": ["Social", "Investigative", "Conventional"],
        "skills": ["Active Listening", "Critical Thinking", "Social Perceptiveness", "Service Orientation", "Monitoring", "Coordination", "Speaking", "Reading Comprehension"]
    },
    "29-1071": {
        "description": "Provide healthcare services typically performed by a physician, under the supervision of a physician. Conduct complete physicals, provide treatment, and counsel patients.",
        "interests": ["Investigative", "Social", "Realistic"],
        "skills": ["Critical Thinking", "Active Listening", "Complex Problem Solving", "Science", "Judgment and Decision Making", "Reading Comprehension", "Social Perceptiveness", "Speaking"]
    },
    "29-1051": {
        "description": "Dispense drugs prescribed by physicians and other health practitioners and provide information to patients about medications and their use.",
        "interests": ["Investigative", "Conventional", "Social"],
        "skills": ["Reading Comprehension", "Active Listening", "Critical Thinking", "Speaking", "Science", "Social Perceptiveness", "Monitoring", "Judgment and Decision Making"]
    },
    "19-1041": {
        "description": "Investigate and describe the determinants and distribution of disease, disability, or health outcomes. May develop the means for prevention and control of disease.",
        "interests": ["Investigative", "Conventional", "Social"],
        "skills": ["Science", "Critical Thinking", "Mathematics", "Reading Comprehension", "Active Learning", "Writing", "Complex Problem Solving", "Systems Analysis"]
    },
    "17-2141": {
        "description": "Perform engineering duties in planning and designing tools, engines, machines, and other mechanically functioning equipment. Oversee installation, operation, maintenance, and repair.",
        "interests": ["Realistic", "Investigative", "Conventional"],
        "skills": ["Complex Problem Solving", "Critical Thinking", "Mathematics", "Active Learning", "Judgment and Decision Making", "Reading Comprehension", "Systems Analysis", "Science"]
    },
    "17-2051": {
        "description": "Perform engineering duties in planning, designing, and overseeing construction and maintenance of building structures and facilities, such as roads, railroads, airports, and bridges.",
        "interests": ["Realistic", "Investigative", "Conventional"],
        "skills": ["Complex Problem Solving", "Critical Thinking", "Mathematics", "Reading Comprehension", "Systems Analysis", "Active Learning", "Judgment and Decision Making", "Coordination"]
    },
    "17-2071": {
        "description": "Research, design, develop, test, or supervise the manufacturing and installation of electrical equipment, components, or systems.",
        "interests": ["Investigative", "Realistic", "Conventional"],
        "skills": ["Complex Problem Solving", "Critical Thinking", "Mathematics", "Active Learning", "Reading Comprehension", "Systems Analysis", "Judgment and Decision Making", "Science"]
    },
    "17-2031": {
        "description": "Apply knowledge of engineering, biology, chemistry, computer science, and biomechanical principles to the design, development, and evaluation of biological, agricultural, and health systems.",
        "interests": ["Investigative", "Realistic", "Social"],
        "skills": ["Science", "Complex Problem Solving", "Critical Thinking", "Active Learning", "Reading Comprehension", "Mathematics", "Judgment and Decision Making", "Systems Analysis"]
    },
    "19-1042": {
        "description": "Conduct research dealing with the understanding of human diseases and the improvement of human health. Engage in clinical investigation, research and development, or other related activities.",
        "interests": ["Investigative", "Realistic", "Artistic"],
        "skills": ["Science", "Critical Thinking", "Reading Comprehension", "Active Learning", "Writing", "Complex Problem Solving", "Judgment and Decision Making", "Mathematics"]
    },
    "19-2041": {
        "description": "Conduct research or perform investigation for the purpose of identifying, abating, or eliminating sources of pollutants or hazards that affect either the environment or public health.",
        "interests": ["Investigative", "Realistic", "Conventional"],
        "skills": ["Science", "Critical Thinking", "Reading Comprehension", "Active Learning", "Writing", "Complex Problem Solving", "Mathematics", "Monitoring"]
    },
    "19-3011": {
        "description": "Conduct research, prepare reports, or formulate plans to address economic problems related to the production and distribution of goods and services or monetary and fiscal policy.",
        "interests": ["Investigative", "Conventional", "Enterprising"],
        "skills": ["Mathematics", "Critical Thinking", "Complex Problem Solving", "Reading Comprehension", "Writing", "Active Learning", "Judgment and Decision Making", "Systems Analysis"]
    },
    "23-1011": {
        "description": "Represent clients in criminal and civil litigation and other legal proceedings, draw up legal documents, or manage or advise clients on legal transactions.",
        "interests": ["Enterprising", "Investigative", "Social"],
        "skills": ["Critical Thinking", "Active Listening", "Reading Comprehension", "Complex Problem Solving", "Speaking", "Persuasion", "Writing", "Judgment and Decision Making"]
    },
    "19-3094": {
        "description": "Study the origin, development, and operation of political systems. Analyze the structure and operation of governments and political organizations.",
        "interests": ["Investigative", "Artistic", "Social"],
        "skills": ["Critical Thinking", "Reading Comprehension", "Writing", "Active Learning", "Complex Problem Solving", "Speaking", "Judgment and Decision Making", "Active Listening"]
    },
    "19-3051": {
        "description": "Develop comprehensive plans and programs for use of land and physical facilities of jurisdictions, such as towns, cities, counties, and metropolitan areas.",
        "interests": ["Investigative", "Enterprising", "Artistic"],
        "skills": ["Critical Thinking", "Complex Problem Solving", "Active Listening", "Speaking", "Reading Comprehension", "Writing", "Coordination", "Judgment and Decision Making"]
    },
    "25-2031": {
        "description": "Teach one or more subjects to students at the secondary school level. May be designated according to subject matter specialty.",
        "interests": ["Social", "Artistic", "Conventional"],
        "skills": ["Speaking", "Active Listening", "Learning Strategies", "Instructing", "Social Perceptiveness", "Monitoring", "Critical Thinking", "Writing"]
    },
    "25-1099": {
        "description": "Teach courses in their subject area at colleges and universities. Conduct original research in their field, publish findings, and mentor students.",
        "interests": ["Social", "Investigative", "Artistic"],
        "skills": ["Speaking", "Instructing", "Reading Comprehension", "Writing", "Active Listening", "Critical Thinking", "Learning Strategies", "Active Learning"]
    },
    "27-1024": {
        "description": "Design or create graphics to meet specific commercial or promotional needs, such as packaging, displays, or logos. May use a variety of mediums to achieve artistic or decorative effects.",
        "interests": ["Artistic", "Realistic", "Conventional"],
        "skills": ["Active Listening", "Critical Thinking", "Complex Problem Solving", "Judgment and Decision Making", "Time Management", "Coordination", "Active Learning", "Reading Comprehension"]
    },
    "27-3042": {
        "description": "Write technical materials, such as equipment manuals, appendices, or operating and maintenance instructions. May assist in layout work. Translate complex information into clear, concise documents.",
        "interests": ["Artistic", "Conventional", "Investigative"],
        "skills": ["Writing", "Reading Comprehension", "Active Listening", "Critical Thinking", "Complex Problem Solving", "Active Learning", "Speaking", "Monitoring"]
    },
    "27-3043": {
        "description": "Originate and prepare written material, such as scripts, stories, advertisements, and other material. Develop content strategy and create engaging written content across platforms.",
        "interests": ["Artistic", "Enterprising", "Social"],
        "skills": ["Writing", "Reading Comprehension", "Active Listening", "Critical Thinking", "Social Perceptiveness", "Speaking", "Active Learning", "Complex Problem Solving"]
    },
    "11-9151": {
        "description": "Plan, direct, or coordinate the activities of a social service program or community outreach organization. Oversee budgets, policies, and staff for programs serving the community.",
        "interests": ["Social", "Enterprising", "Conventional"],
        "skills": ["Social Perceptiveness", "Active Listening", "Speaking", "Coordination", "Critical Thinking", "Complex Problem Solving", "Service Orientation", "Monitoring"]
    },
    "11-1021": {
        "description": "Plan, direct, or coordinate the operations of public or private sector organizations, overseeing multiple departments, setting policies, and managing daily operations.",
        "interests": ["Enterprising", "Conventional", "Social"],
        "skills": ["Critical Thinking", "Complex Problem Solving", "Active Listening", "Coordination", "Judgment and Decision Making", "Monitoring", "Speaking", "Management of Personnel Resources"]
    },
}

def get_onet_data(career_mapping):
    """Get O*NET data with fallback."""
    data = fetch_onet(career_mapping)
    if len(data) < 5:
        print("  [fallback] Using compiled O*NET data")
        data = FALLBACK_ONET
    return data

if __name__ == "__main__":
    mapping = load_career_mapping()
    onet = get_onet_data(mapping)
    print(f"\nO*NET: {len(onet)} occupations")
    for code, d in list(onet.items())[:3]:
        print(f"  {code}: {d.get('interests', [])[:3]}")
