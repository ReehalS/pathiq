'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Career } from '@/lib/types';
import {
  formatCurrency,
  formatGrowthRate,
  formatCompactNumber,
  growthColor,
  cn,
} from '@/lib/utils';
import { getCategoryColor, getPathTypeLabel } from '@/lib/constants';
import { SalaryChart } from '@/components/salary-chart';
import { SkillsRadar } from '@/components/skills-radar';
import { SalaryHistoryChart } from '@/components/salary-history-chart';
import { EmploymentTrendChart } from '@/components/employment-trend-chart';
import { SalaryDistributionChart } from '@/components/salary-distribution-chart';
import { PercentileCalculator } from '@/components/percentile-calculator';
import { HealthScoreDetail } from '@/components/health-score-badge';
import { PremiumButton } from '@/components/auth/premium-gate';
import { useMarketTrends } from '@/hooks/use-market-trends';
import { calculateHealthScore } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Users,
  Briefcase,
  GraduationCap,
  MapPin,
  Shield,
  Clock,
  MessageSquare,
  GitCompare,
  Sparkles,
} from 'lucide-react';

export default function CareerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [career, setCareer] = useState<Career | null>(null);
  const [loading, setLoading] = useState(true);
  const careerId = typeof params.id === 'string' ? params.id : '';
  const { trends, loading: trendsLoading } = useMarketTrends(careerId);

  useEffect(() => {
    async function fetchCareer() {
      try {
        const res = await fetch(`/api/careers/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setCareer(data);
        }
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchCareer();
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!career) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Career not found</h2>
        <Link href="/dashboard">
          <Button className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const layoffColors: Record<string, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  };

  const hasTrends = trends.length > 0;
  const description = career.ai_description || career.description;
  const healthScore = career.market_health_score ?? calculateHealthScore(career);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Back Button */}
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="outline">{getPathTypeLabel(career.path_type)}</Badge>
          <Badge className={getCategoryColor(career.category)}>
            {career.category}
          </Badge>
          {career.is_trending && (
            <Badge className="bg-yellow-100 text-yellow-800">Trending</Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{career.title}</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          {description}
        </p>
        {career.ai_description && (
          <div className="flex items-center gap-1 mt-1">
            <Sparkles className="h-3 w-3 text-purple-500" />
            <span className="text-xs text-purple-500">AI-enhanced</span>
          </div>
        )}
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Entry Salary"
          value={formatCurrency(career.salary_entry)}
        />
        <MetricCard
          icon={DollarSign}
          label="Median Salary"
          value={formatCurrency(career.salary_median)}
        />
        <MetricCard
          icon={TrendingUp}
          label="Growth Rate"
          value={formatGrowthRate(career.growth_rate_numeric)}
          className={growthColor(career.growth_rate_numeric)}
        />
        <MetricCard
          icon={Users}
          label="Total Employed"
          value={formatCompactNumber(career.employment_total)}
        />
        <MetricCard
          icon={Briefcase}
          label="Annual Openings"
          value={formatCompactNumber(career.current_openings)}
        />
      </div>

      {/* Market Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <HealthScoreDetail
            score={healthScore}
            growthRate={career.growth_rate_numeric}
            openings={career.current_openings}
            salaryEntry={career.salary_entry}
            salaryYear10={career.salary_year10}
            layoffRisk={career.layoff_risk}
          />
        </CardContent>
      </Card>

      {/* Salary Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compensation</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trajectory" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="trajectory" className="text-xs">
                Trajectory
              </TabsTrigger>
              <TabsTrigger value="distribution" className="text-xs">
                Distribution
              </TabsTrigger>
              <TabsTrigger value="calculator" className="text-xs">
                Calculator
              </TabsTrigger>
            </TabsList>
            <TabsContent value="trajectory" className="mt-4">
              <SalaryChart careers={[career]} showArea />
              <p className="text-xs text-muted-foreground mt-2">
                Source: {career.salary_source || 'BLS OEWS'}. Trajectory estimated
                from wage percentile distribution.
              </p>
            </TabsContent>
            <TabsContent value="distribution" className="mt-4">
              <SalaryDistributionChart career={career} />
              <p className="text-xs text-muted-foreground mt-2">
                Source: BLS OEWS May 2024. Shows salary range from 25th to 90th percentile.
              </p>
            </TabsContent>
            <TabsContent value="calculator" className="mt-4">
              <PercentileCalculator career={career} />
              <p className="text-xs text-muted-foreground mt-2">
                Estimated salary at any percentile, interpolated from BLS wage data.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Historical Market Data */}
      {!trendsLoading && hasTrends && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historical Market Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="salary-history" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-sm">
                <TabsTrigger value="salary-history" className="text-xs">
                  Salary History
                </TabsTrigger>
                <TabsTrigger value="employment-trend" className="text-xs">
                  Employment Trend
                </TabsTrigger>
              </TabsList>
              <TabsContent value="salary-history" className="mt-4">
                <SalaryHistoryChart trends={trends} />
                <p className="text-xs text-muted-foreground mt-2">
                  Source: BLS Occupational Employment and Wage Statistics (OES), annual May estimates
                </p>
              </TabsContent>
              <TabsContent value="employment-trend" className="mt-4">
                <EmploymentTrendChart trends={trends} />
                <p className="text-xs text-muted-foreground mt-2">
                  Source: BLS Occupational Employment and Wage Statistics (OES), annual May estimates
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Skills Radar */}
      {career.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skills Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <SkillsRadar career={career} />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Skill category scores based on O*NET required skills data
            </p>
          </CardContent>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Work Details */}
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-lg">Work Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow
                icon={MapPin}
                label="Locations"
                value={career.geographic_concentration.join(', ') || 'N/A'}
              />
              <DetailRow
                icon={Clock}
                label="Work-Life Balance"
                value={career.work_life_balance || 'N/A'}
              />
              <DetailRow
                icon={Briefcase}
                label="Remote Options"
                value={career.remote_options || 'N/A'}
              />
              <DetailRow
                icon={Shield}
                label="Layoff Risk"
                value={career.layoff_risk}
                valueClass={layoffColors[career.layoff_risk]}
              />
              {career.typical_employers.length > 0 && (
                <DetailRow
                  icon={Users}
                  label="Typical Employers"
                  value={career.typical_employers.join(', ')}
                />
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-lg">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailRow
                icon={GraduationCap}
                label="Min Education"
                value={career.minimum_degree || 'N/A'}
              />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Preferred Majors
                </p>
                <div className="flex flex-wrap gap-1">
                  {career.preferred_majors.map((m) => (
                    <Badge key={m} variant="secondary" className="text-xs">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
              {career.certifications.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Certifications
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {career.certifications.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {career.experience && (
                <DetailRow label="Experience" value={career.experience} />
              )}
              {career.ai_requirements && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span className="text-xs text-purple-500">AI-enhanced</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {career.ai_requirements}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Skills & Interests */}
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-lg">Skills & Interests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {career.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Key Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(career.skills)].map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {career.interests.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    RIASEC Interests
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(career.interests)].map((i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {i}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {career.work_style.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Work Style
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {career.work_style.map((w) => (
                      <Badge key={w} variant="secondary" className="text-xs">
                        {w}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Career Trajectory */}
          <Card className="gap-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Career Trajectory</CardTitle>
                {career.ai_trajectory && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span className="text-xs text-purple-500">AI-enhanced</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {career.ai_trajectory ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {career.ai_trajectory}
                </p>
              ) : (
                <>
                  {career.typical_path && (
                    <DetailRow label="Typical Path" value={career.typical_path} />
                  )}
                  {career.time_to_promotion && (
                    <DetailRow
                      label="Time to Promotion"
                      value={career.time_to_promotion}
                    />
                  )}
                  {career.career_ceiling && (
                    <DetailRow
                      label="Career Ceiling"
                      value={career.career_ceiling}
                    />
                  )}
                </>
              )}
              {career.ai_trajectory && career.typical_path && (
                <>
                  <Separator />
                  {career.typical_path && (
                    <DetailRow label="Typical Path" value={career.typical_path} />
                  )}
                  {career.time_to_promotion && (
                    <DetailRow
                      label="Time to Promotion"
                      value={career.time_to_promotion}
                    />
                  )}
                  {career.career_ceiling && (
                    <DetailRow
                      label="Career Ceiling"
                      value={career.career_ceiling}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Paths */}
      {career.related_paths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Career Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {career.related_paths.map((rp) => (
                <Link key={rp} href={`/careers/${rp}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-secondary text-sm py-1 px-3"
                  >
                    {rp
                      .replace(/-/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA Buttons */}
      <Separator />
      <div className="flex flex-wrap gap-3">
        <PremiumButton
          feature="Career Comparison"
          onClick={() => router.push(`/compare?paths=${career.id}`)}
          className="gap-2"
        >
          <GitCompare className="h-4 w-4" />
          Compare this path
        </PremiumButton>
        <PremiumButton
          feature="AI Career Chat"
          variant="outline"
          onClick={() => router.push(`/chat?about=${career.id}&title=${encodeURIComponent(career.title)}`)}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Ask AI about this career
        </PremiumButton>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      {Icon && <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />}
      <p className={cn('text-xl font-bold', className)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {Icon && (
        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      )}
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={cn('text-sm', valueClass)}>{value}</p>
      </div>
    </div>
  );
}
