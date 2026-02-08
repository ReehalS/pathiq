export interface Career {
  id: string;
  title: string;
  path_type: PathType;
  category: Category;

  // Compensation
  salary_entry: number | null;
  salary_year3: number | null;
  salary_year5: number | null;
  salary_year10: number | null;
  salary_median: number | null;
  salary_p25: number | null;
  salary_p75: number | null;
  salary_p90: number | null;

  // Market Data
  current_openings: number | null;
  growth_rate: string | null;
  growth_rate_numeric: number | null;
  employment_total: number | null;
  annual_openings: number | null;
  layoff_risk: "low" | "medium" | "high";

  // Education
  minimum_degree: string | null;
  preferred_majors: string[];
  alternative_paths: string[];

  // Fit / Interests
  interests: string[];
  work_style: string[];
  industries: string[];

  // Details
  description: string | null;
  typical_employers: string[];
  work_life_balance: string | null;
  remote_options: "fully-remote" | "hybrid" | "on-site" | "varies" | null;
  geographic_concentration: string[];

  // Requirements
  skills: string[];
  certifications: string[];
  experience: string | null;

  // Trajectory
  typical_path: string | null;
  time_to_promotion: string | null;
  career_ceiling: string | null;

  // Related
  related_paths: string[];

  // Sources
  salary_source: string | null;
  openings_source: string | null;

  // AI-generated content
  ai_description: string | null;
  ai_trajectory: string | null;
  ai_requirements: string | null;
  ai_generated_at: string | null;

  // Metadata
  is_trending: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export type PathType =
  | "industry-job"
  | "graduate-school"
  | "research"
  | "fellowship"
  | "professional-school"
  | "alternative";

export type Category =
  | "tech"
  | "business"
  | "healthcare"
  | "engineering"
  | "science"
  | "law"
  | "education"
  | "creative"
  | "alternative";

export interface MarketTrend {
  career_id: string;
  date: string;
  average_salary: number | null;
  employment_count: number | null;
  source: string | null;
}

export interface UserProfile {
  year: string;
  major: string;
  interests: string[];
  values: {
    compensation: number;
    impact: number;
    flexibility: number;
    stability: number;
  };
  locationPreferences: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ComparisonResult {
  careers: Career[];
  aiAnalysis: string;
}

export interface CareerFilters {
  search: string;
  pathTypes: PathType[];
  categories: Category[];
  minSalary: number;
  maxSalary: number;
  sort: SortOption;
}

export type SortOption =
  | "salary-desc"
  | "salary-asc"
  | "growth-desc"
  | "growth-asc"
  | "openings-desc"
  | "alphabetical";
