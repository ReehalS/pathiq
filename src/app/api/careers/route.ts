import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Career } from '@/lib/types';
import { calculateHealthScore } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pathType = searchParams.get('pathType');
  const category = searchParams.get('category');
  const minSalary = searchParams.get('minSalary');
  const maxSalary = searchParams.get('maxSalary');
  const search = searchParams.get('search');
  const workLifeBalance = searchParams.get('workLifeBalance');
  const sort = searchParams.get('sort') || 'salary-desc';

  let query = supabase.from('careers').select('*');

  // Filters
  if (pathType) {
    const types = pathType.split(',');
    query = query.in('path_type', types);
  }

  if (category) {
    const cats = category.split(',');
    query = query.in('category', cats);
  }

  if (minSalary) {
    query = query.gte('salary_median', parseInt(minSalary));
  }

  if (maxSalary) {
    query = query.lte('salary_median', parseInt(maxSalary));
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`
    );
  }

  if (workLifeBalance) {
    const wlbValues = workLifeBalance.split(',');
    // DB stores free-text like "Good - standard hours...", match by prefix
    const wlbFilter = wlbValues.map((v) => `work_life_balance.ilike.${v}%`).join(',');
    query = query.or(wlbFilter);
  }

  // Sort (health sort handled in memory after score computation)
  if (sort !== 'health-desc') {
    switch (sort) {
      case 'salary-desc':
        query = query.order('salary_median', {
          ascending: false,
          nullsFirst: false,
        });
        break;
      case 'salary-asc':
        query = query.order('salary_median', {
          ascending: true,
          nullsFirst: false,
        });
        break;
      case 'growth-desc':
        query = query.order('growth_rate_numeric', {
          ascending: false,
          nullsFirst: false,
        });
        break;
      case 'growth-asc':
        query = query.order('growth_rate_numeric', {
          ascending: true,
          nullsFirst: false,
        });
        break;
      case 'openings-desc':
        query = query.order('current_openings', {
          ascending: false,
          nullsFirst: false,
        });
        break;
      case 'alphabetical':
        query = query.order('title', { ascending: true });
        break;
      default:
        query = query.order('salary_median', {
          ascending: false,
          nullsFirst: false,
        });
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute health scores for all careers
  const careers = (data || []).map((career: Career) => ({
    ...career,
    market_health_score: calculateHealthScore(career),
  }));

  // Sort by health score if requested
  if (sort === 'health-desc') {
    careers.sort(
      (a: Career, b: Career) =>
        (b.market_health_score ?? 0) - (a.market_health_score ?? 0)
    );
  }

  return NextResponse.json(careers);
}
