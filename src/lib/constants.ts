import { PathType, Category, SortOption } from "./types";

export const PATH_TYPE_OPTIONS: { value: PathType; label: string }[] = [
  { value: "industry-job", label: "Industry Job" },
  { value: "graduate-school", label: "Graduate School" },
  { value: "research", label: "Research" },
  { value: "fellowship", label: "Fellowship" },
  { value: "professional-school", label: "Professional School" },
  { value: "alternative", label: "Alternative" },
];

export const CATEGORY_OPTIONS: { value: Category; label: string; color: string }[] = [
  { value: "tech", label: "Technology", color: "bg-blue-100 text-blue-800" },
  { value: "business", label: "Business", color: "bg-emerald-100 text-emerald-800" },
  { value: "healthcare", label: "Healthcare", color: "bg-red-100 text-red-800" },
  { value: "engineering", label: "Engineering", color: "bg-orange-100 text-orange-800" },
  { value: "science", label: "Science", color: "bg-purple-100 text-purple-800" },
  { value: "law", label: "Law & Policy", color: "bg-amber-100 text-amber-800" },
  { value: "education", label: "Education", color: "bg-cyan-100 text-cyan-800" },
  { value: "creative", label: "Creative", color: "bg-pink-100 text-pink-800" },
  { value: "alternative", label: "Alternative", color: "bg-gray-100 text-gray-800" },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "salary-desc", label: "Salary: High to Low" },
  { value: "salary-asc", label: "Salary: Low to High" },
  { value: "growth-desc", label: "Growth Rate: High to Low" },
  { value: "growth-asc", label: "Growth Rate: Low to High" },
  { value: "openings-desc", label: "Openings: Most First" },
  { value: "health-desc", label: "Market Health: Best First" },
  { value: "alphabetical", label: "Alphabetical" },
];

export const WORK_LIFE_OPTIONS: { value: string; label: string }[] = [
  { value: "Excellent", label: "Excellent" },
  { value: "Above Average", label: "Above Average" },
  { value: "Average", label: "Average" },
  { value: "Below Average", label: "Below Average" },
];

export const RIASEC: Record<string, { name: string; description: string }> = {
  Realistic: { name: "Realistic", description: "Hands-on, practical work with tools and machines" },
  Investigative: { name: "Investigative", description: "Research, analysis, and problem-solving" },
  Artistic: { name: "Artistic", description: "Creative expression and design" },
  Social: { name: "Social", description: "Helping, teaching, and working with people" },
  Enterprising: { name: "Enterprising", description: "Leading, persuading, and managing" },
  Conventional: { name: "Conventional", description: "Organizing, planning, and data management" },
};

export const INTEREST_OPTIONS = [
  { value: "technology", label: "Technology & Computing", riasec: ["Investigative", "Realistic"] },
  { value: "business", label: "Business & Finance", riasec: ["Enterprising", "Conventional"] },
  { value: "healthcare", label: "Healthcare & Medicine", riasec: ["Social", "Investigative"] },
  { value: "engineering", label: "Engineering & Building", riasec: ["Realistic", "Investigative"] },
  { value: "science", label: "Science & Research", riasec: ["Investigative"] },
  { value: "arts", label: "Arts & Design", riasec: ["Artistic"] },
  { value: "education", label: "Education & Teaching", riasec: ["Social", "Artistic"] },
  { value: "law", label: "Law & Public Policy", riasec: ["Enterprising", "Social"] },
  { value: "social-impact", label: "Social Impact & Nonprofits", riasec: ["Social"] },
  { value: "entrepreneurship", label: "Entrepreneurship", riasec: ["Enterprising"] },
];

export const YEAR_OPTIONS = [
  "Freshman",
  "Sophomore",
  "Junior",
  "Senior",
  "Recent Grad",
];

export const STARTER_QUESTIONS = [
  "What careers match my interests?",
  "Compare tech vs consulting salaries",
  "What's the job market like for engineers?",
  "Should I go to grad school or work first?",
  "What careers are trending right now?",
  "What are the highest-paying entry-level careers?",
];

export function getCategoryColor(category: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.color || "bg-gray-100 text-gray-800";
}

export function getPathTypeLabel(pathType: string): string {
  return PATH_TYPE_OPTIONS.find((p) => p.value === pathType)?.label || pathType;
}
