import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { openai } from "@/lib/openai";
import { Career } from "@/lib/types";

/** Canonical key for a set of paths (sorted so order doesn't matter). */
function pathsKey(ids: string[]): string[] {
  return [...ids].sort();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathIds, userProfile, userId, regenerate } = body as {
      pathIds: string[];
      userProfile?: { major?: string; year?: string; interests?: string[] };
      userId?: string;
      regenerate?: boolean;
    };

    if (!pathIds || pathIds.length < 2) {
      return NextResponse.json(
        { error: "At least 2 paths required for comparison" },
        { status: 400 }
      );
    }

    const sortedPaths = pathsKey(pathIds);

    // Check cache (if authenticated and not regenerating)
    if (userId && !regenerate) {
      const { data: cached } = await supabase
        .from("comparisons")
        .select("ai_analysis")
        .eq("user_id", userId)
        .contains("paths_compared", sortedPaths)
        .single();

      if (cached?.ai_analysis) {
        // Fetch careers to return alongside cached analysis
        const { data: careers } = await supabase
          .from("careers")
          .select("*")
          .in("id", pathIds);

        return NextResponse.json({
          careers: careers || [],
          aiAnalysis: cached.ai_analysis,
          cached: true,
        });
      }
    }

    // Fetch career data
    const { data: careers, error } = await supabase
      .from("careers")
      .select("*")
      .in("id", pathIds);

    if (error || !careers) {
      return NextResponse.json({ error: "Failed to fetch careers" }, { status: 500 });
    }

    // Build comparison data for AI
    const comparisonData = careers.map((c: Career) => ({
      title: c.title,
      category: c.category,
      salary_entry: c.salary_entry,
      salary_median: c.salary_median,
      salary_year5: c.salary_year5,
      salary_year10: c.salary_year10,
      growth_rate: c.growth_rate,
      current_openings: c.current_openings,
      employment_total: c.employment_total,
      minimum_degree: c.minimum_degree,
      work_life_balance: c.work_life_balance,
      remote_options: c.remote_options,
      layoff_risk: c.layoff_risk,
      time_to_promotion: c.time_to_promotion,
      career_ceiling: c.career_ceiling,
    }));

    const userContext = userProfile
      ? `a ${userProfile.year || "college"} ${userProfile.major || "undergraduate"} student interested in ${(userProfile.interests || []).join(", ") || "exploring options"}`
      : "an undergraduate student exploring career options";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a career decision analyst with expertise in labor markets and data analysis. Provide concise, data-driven analysis.`,
        },
        {
          role: "user",
          content: `Analyze the trade-offs between the following post-graduation paths for ${userContext}.

Path data:
${JSON.stringify(comparisonData, null, 2)}

Provide:
1. A 2-3 sentence executive summary of the key trade-off
2. Dimension-by-dimension analysis: compensation trajectory, time investment, market outlook, stability, growth potential
3. A personalized recommendation based on the student's profile
4. One non-obvious insight

Constraints:
- Cite specific numbers from the data
- Consider opportunity cost and net present value
- Acknowledge uncertainty where data is limited
- Be supportive but data-driven
- 200-250 words max`,
        },
      ],
      max_tokens: 600,
    });

    const aiAnalysis = completion.choices[0]?.message?.content || "Unable to generate analysis.";

    // Save to cache (if authenticated)
    if (userId) {
      // Upsert: delete old comparison for same user + paths, then insert
      const { data: existing } = await supabase
        .from("comparisons")
        .select("id")
        .eq("user_id", userId)
        .contains("paths_compared", sortedPaths)
        .single();

      if (existing) {
        await supabase
          .from("comparisons")
          .update({ ai_analysis: aiAnalysis, created_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("comparisons").insert({
          user_id: userId,
          paths_compared: sortedPaths,
          ai_analysis: aiAnalysis,
        });
      }
    }

    return NextResponse.json({ careers, aiAnalysis, cached: false });
  } catch (e) {
    console.error("Compare error:", e);
    return NextResponse.json(
      { error: "Failed to generate comparison" },
      { status: 500 }
    );
  }
}
