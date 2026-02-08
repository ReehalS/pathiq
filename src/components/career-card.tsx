'use client';

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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase, TrendingUp, Sparkles } from 'lucide-react';

interface CareerCardProps {
  career: Career;
  onCompare?: (id: string) => void;
}

export function CareerCard({ career, onCompare }: CareerCardProps) {
  return (
    <Card className="group relative flex flex-col gap-0 transition-shadow hover:shadow-md">
      {career.is_trending && (
        <div className="absolute top-3 right-3">
          <Badge
            variant="secondary"
            className="gap-1 bg-yellow-100 text-yellow-800 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            Trending
          </Badge>
        </div>
      )}
      <CardHeader className="pb-0">
        <div className="space-y-1.5">
          <h3 className="font-semibold text-lg leading-tight pr-16">
            {career.title}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-xs">
              {getPathTypeLabel(career.path_type)}
            </Badge>
            <Badge className={cn('text-xs', getCategoryColor(career.category))}>
              {career.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-3 space-y-2.5">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Median Salary</p>
            <p className="font-bold text-lg">
              {formatCurrency(career.salary_median)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Growth Rate</p>
            <p
              className={cn(
                'font-bold text-lg',
                growthColor(career.growth_rate_numeric)
              )}
            >
              {formatGrowthRate(career.growth_rate_numeric)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Briefcase className="h-3.5 w-3.5" />
          <span>{formatCompactNumber(career.current_openings)} openings</span>
          {career.growth_rate_numeric && career.growth_rate_numeric > 10 && (
            <>
              <span className="mx-1">·</span>
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600">Fast growing</span>
            </>
          )}
        </div>

        {/* Interest Tags */}
        {career.interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {[...new Set(career.interests)].slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions — pinned to bottom */}
        <div className="flex items-center gap-2 pt-2 mt-auto">
          {onCompare && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onCompare(career.id);
              }}
            >
              Compare
            </Button>
          )}
          <Link href={`/careers/${career.id}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full gap-1">
              Details
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
