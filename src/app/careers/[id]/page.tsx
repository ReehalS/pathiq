'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';

export default function CareerDetailPage() {
  const params = useParams();
  const [career, setCareer] = useState<Career | null>(null);
  const [loading, setLoading] = useState(true);

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
          {career.description}
        </p>
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

      {/* Salary Trajectory Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Salary Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryChart careers={[career]} showArea />
          <p className="text-xs text-muted-foreground mt-2">
            Source: {career.salary_source || 'BLS OEWS'}. Trajectory estimated
            from wage percentile distribution.
          </p>
        </CardContent>
      </Card>

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
          <Card>
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
          <Card>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Skills & Interests */}
          <Card>
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
                    {career.skills.map((s) => (
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
                    {career.interests.map((i) => (
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Career Trajectory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
        <Link href={`/compare?paths=${career.id}`}>
          <Button className="gap-2">
            <GitCompare className="h-4 w-4" />
            Compare this path
          </Button>
        </Link>
        <Link href={`/chat?about=${career.id}`}>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Ask AI about this career
          </Button>
        </Link>
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
