import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pathType = searchParams.get("pathType");
  const category = searchParams.get("category");
  const minSalary = searchParams.get("minSalary");
  const maxSalary = searchParams.get("maxSalary");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "salary-desc";

  let query = supabase.from("careers").select("*");

  // Filters
  if (pathType) {
    const types = pathType.split(",");
    query = query.in("path_type", types);
  }

  if (category) {
    const cats = category.split(",");
    query = query.in("category", cats);
  }

  if (minSalary) {
    query = query.gte("salary_median", parseInt(minSalary));
  }

  if (maxSalary) {
    query = query.lte("salary_median", parseInt(maxSalary));
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`
    );
  }

  // Sort
  switch (sort) {
    case "salary-desc":
      query = query.order("salary_median", { ascending: false, nullsFirst: false });
      break;
    case "salary-asc":
      query = query.order("salary_median", { ascending: true, nullsFirst: false });
      break;
    case "growth-desc":
      query = query.order("growth_rate_numeric", { ascending: false, nullsFirst: false });
      break;
    case "growth-asc":
      query = query.order("growth_rate_numeric", { ascending: true, nullsFirst: false });
      break;
    case "openings-desc":
      query = query.order("current_openings", { ascending: false, nullsFirst: false });
      break;
    case "alphabetical":
      query = query.order("title", { ascending: true });
      break;
    default:
      query = query.order("salary_median", { ascending: false, nullsFirst: false });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
