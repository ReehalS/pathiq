import { Career, UserProfile } from "./types";

/** Maps user interest selections to career categories. */
const INTEREST_TO_CATEGORIES: Record<string, string[]> = {
  technology: ["tech"],
  business: ["business"],
  healthcare: ["healthcare"],
  engineering: ["engineering"],
  science: ["science"],
  arts: ["creative"],
  education: ["education"],
  law: ["law"],
  "social-impact": ["healthcare", "education"],
  entrepreneurship: ["business", "tech", "alternative"],
};

/** Score a career against a user profile (0-100). */
export function scoreCareer(career: Career, profile: UserProfile): number {
  let score = 0;

  // --- Interest → category match (0-40) ---
  const matchedCategories = new Set(
    profile.interests.flatMap((i) => INTEREST_TO_CATEGORIES[i] || [])
  );
  if (matchedCategories.has(career.category)) score += 40;

  // --- Direct interest overlap (0-20) ---
  const careerInterestsLower = career.interests.map((i) => i.toLowerCase());
  const overlap = profile.interests.filter((i) =>
    careerInterestsLower.some(
      (ci) => ci.includes(i.toLowerCase()) || i.toLowerCase().includes(ci)
    )
  ).length;
  score += Math.min(overlap * 10, 20);

  // --- Major match (0-25) ---
  if (profile.major) {
    const majorLower = profile.major.toLowerCase();
    const majorMatch = career.preferred_majors.some(
      (m) =>
        m.toLowerCase().includes(majorLower) ||
        majorLower.includes(m.toLowerCase())
    );
    if (majorMatch) score += 25;
  }

  // --- Market health bonus (0-10) ---
  if (career.market_health_score) {
    score += Math.round(career.market_health_score / 10);
  }

  // --- Trending bonus (0-5) ---
  if (career.is_trending) score += 5;

  return Math.min(score, 100);
}

/** Minimum relevance score to show as a recommendation, based on year. */
function minScoreForYear(year: string): number {
  switch (year) {
    case "Senior":
    case "Recent Grad":
      return 30; // Focused — need strong category or major match
    case "Junior":
      return 20;
    default:
      return 10; // Freshman/Sophomore — explore broadly
  }
}

export interface ScoredCareer {
  career: Career;
  score: number;
  matchReasons: string[];
}

/** Return top-N recommended careers for a user, with match reasons. */
export function getRecommendations(
  careers: Career[],
  profile: UserProfile,
  limit = 6
): ScoredCareer[] {
  const minScore = minScoreForYear(profile.year);

  const scored: ScoredCareer[] = careers.map((career) => {
    const score = scoreCareer(career, profile);
    const reasons: string[] = [];

    const matchedCategories = new Set(
      profile.interests.flatMap((i) => INTEREST_TO_CATEGORIES[i] || [])
    );
    if (matchedCategories.has(career.category))
      reasons.push("Matches your interests");
    if (
      profile.major &&
      career.preferred_majors.some(
        (m) =>
          m.toLowerCase().includes(profile.major.toLowerCase()) ||
          profile.major.toLowerCase().includes(m.toLowerCase())
      )
    )
      reasons.push("Fits your major");
    if (career.is_trending) reasons.push("Trending");

    return { career, score, matchReasons: reasons };
  });

  return scored
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
