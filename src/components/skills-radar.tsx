"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Career } from "@/lib/types";

interface SkillsRadarProps {
  career: Career;
  comparisonCareer?: Career;
}

// Map common skills to broader categories for radar chart
const SKILL_CATEGORIES: Record<string, string[]> = {
  "Analytical": ["Critical Thinking", "Complex Problem Solving", "Systems Analysis", "Mathematics", "Science"],
  "Communication": ["Active Listening", "Speaking", "Writing", "Reading Comprehension", "Persuasion"],
  "Technical": ["Programming", "Systems Evaluation", "Monitoring", "Technology Design"],
  "Leadership": ["Coordination", "Management of Personnel Resources", "Judgment and Decision Making", "Negotiation"],
  "Interpersonal": ["Social Perceptiveness", "Service Orientation", "Active Learning", "Instructing", "Learning Strategies"],
  "Creative": ["Time Management", "Complex Problem Solving", "Active Learning"],
};

function scoreSkillCategory(skills: string[], categorySkills: string[]): number {
  let matches = 0;
  for (const skill of skills) {
    for (const catSkill of categorySkills) {
      if (skill.toLowerCase().includes(catSkill.toLowerCase()) ||
          catSkill.toLowerCase().includes(skill.toLowerCase())) {
        matches++;
        break;
      }
    }
  }
  // Score from 0-100 based on matches
  return Math.min(100, Math.round((matches / Math.max(categorySkills.length, 1)) * 100));
}

export function SkillsRadar({ career, comparisonCareer }: SkillsRadarProps) {
  const data = Object.entries(SKILL_CATEGORIES).map(([category, categorySkills]) => {
    const entry: Record<string, string | number> = {
      category,
      [career.title]: scoreSkillCategory(career.skills, categorySkills),
    };
    if (comparisonCareer) {
      entry[comparisonCareer.title] = scoreSkillCategory(comparisonCareer.skills, categorySkills);
    }
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid className="stroke-muted" />
        <PolarAngleAxis
          dataKey="category"
          className="text-xs"
          tick={{ fontSize: 11 }}
        />
        <Radar
          name={career.title}
          dataKey={career.title}
          stroke="hsl(221, 83%, 53%)"
          fill="hsl(221, 83%, 53%)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        {comparisonCareer && (
          <Radar
            name={comparisonCareer.title}
            dataKey={comparisonCareer.title}
            stroke="hsl(142, 71%, 45%)"
            fill="hsl(142, 71%, 45%)"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        )}
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
