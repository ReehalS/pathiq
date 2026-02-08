"""
Generate AI-enhanced career content using OpenAI GPT-4o-mini.
Iterates all careers in Supabase and generates:
  1. Engaging description (~150 words)
  2. Career trajectory narrative (~150 words)
  3. Preparation advice (~150 words)

Results are cached in the careers table (ai_description, ai_trajectory,
ai_requirements, ai_generated_at columns).

Usage:
  python generate_ai_content.py [--force]

Flags:
  --force  Regenerate content even for careers that already have AI content

Requires:
  - OPENAI_API_KEY in data/.env
  - SUPABASE_URL and SUPABASE_KEY in data/.env
"""
import json
import os
import sys
import time
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def get_prompt(career):
    """Build the prompt for AI content generation."""
    return f"""You are a career counselor writing content for a career exploration platform aimed at college students and recent graduates. Based on the following career data, generate three sections of content.

Career: {career['title']}
Category: {career.get('category', 'N/A')}
Path Type: {career.get('path_type', 'N/A')}
Median Salary: ${career.get('salary_median', 0):,}
Entry Salary: ${career.get('salary_entry', 0):,}
Growth Rate: {career.get('growth_rate', 'N/A')}
Minimum Degree: {career.get('minimum_degree', 'N/A')}
Current Description: {career.get('description', 'N/A')}
Typical Path: {career.get('typical_path', 'N/A')}
Skills: {', '.join(career.get('skills', [])[:5])}
Work-Life Balance: {career.get('work_life_balance', 'N/A')}

Generate a JSON object with exactly three keys:
1. "description": An engaging, informative overview of this career (about 150 words). Focus on what makes this career path exciting, what a typical day looks like, and why someone might choose it. Write in second person ("you").
2. "trajectory": A narrative description of the typical career progression (about 150 words). Cover the path from entry-level to senior roles, typical milestones, and what advancement looks like. Be specific about titles and timelines.
3. "requirements": Practical preparation advice for college students interested in this career (about 150 words). Cover coursework, skills to develop, internships, certifications, and portfolio/experience recommendations. Be actionable and specific.

Write in a professional but approachable tone. Be factual — do not exaggerate salaries or opportunities."""


def generate_for_career(career, client):
    """Generate AI content for a single career using OpenAI."""
    prompt = get_prompt(career)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful career counselor. Always respond with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=1500,
    )

    content = response.choices[0].message.content
    return json.loads(content)


def main():
    force = "--force" in sys.argv

    if not OPENAI_API_KEY:
        print("[error] OPENAI_API_KEY required in data/.env")
        print("  Get a key at https://platform.openai.com/api-keys")
        sys.exit(1)

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[error] SUPABASE_URL and SUPABASE_KEY required in data/.env")
        sys.exit(1)

    try:
        from openai import OpenAI
    except ImportError:
        print("[error] openai package not installed: pip install openai")
        sys.exit(1)

    try:
        from supabase import create_client
    except ImportError:
        print("[error] supabase package not installed: pip install supabase")
        sys.exit(1)

    client = OpenAI(api_key=OPENAI_API_KEY)
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all careers
    result = supabase.table("careers").select("*").execute()
    careers = result.data

    if not careers:
        print("[error] No careers found in Supabase")
        sys.exit(1)

    print(f"Found {len(careers)} careers")

    generated = 0
    skipped = 0
    errors = 0

    for i, career in enumerate(careers):
        cid = career["id"]

        # Skip if already generated (unless --force)
        if career.get("ai_generated_at") and not force:
            print(f"  [{i+1}/{len(careers)}] {cid}: already generated, skipping")
            skipped += 1
            continue

        print(f"  [{i+1}/{len(careers)}] {cid}: generating...", end=" ", flush=True)

        try:
            ai_content = generate_for_career(career, client)

            # Update career in Supabase
            supabase.table("careers").update({
                "ai_description": ai_content.get("description"),
                "ai_trajectory": ai_content.get("trajectory"),
                "ai_requirements": ai_content.get("requirements"),
                "ai_generated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", cid).execute()

            print("done")
            generated += 1

        except Exception as e:
            print(f"error: {e}")
            errors += 1

        # Rate limit: 2 seconds between calls
        if i < len(careers) - 1:
            time.sleep(2)

    print(f"\nSummary:")
    print(f"  Generated: {generated}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {errors}")


if __name__ == "__main__":
    main()
