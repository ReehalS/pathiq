import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ careerId: string }> }
) {
  const { careerId } = await params;

  const { data, error } = await supabase
    .from("market_trends")
    .select("career_id, date, average_salary, employment_count, source")
    .eq("career_id", careerId)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
