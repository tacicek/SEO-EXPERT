'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendDataPoint {
  date: string;
  score: number;
}

interface ScoreTrendProps {
  data: TrendDataPoint[];
}

export function ScoreTrend({ data }: ScoreTrendProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
          <CardDescription>No trend data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Analyze your site to see trends
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxScore = Math.max(...data.map(d => d.score), 100);
  const minScore = Math.min(...data.map(d => d.score), 0);
  const range = maxScore - minScore || 1;

  // Calculate trend
  const firstScore = data[0]?.score || 0;
  const lastScore = data[data.length - 1]?.score || 0;
  const trend = lastScore - firstScore;

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-rose-500" />;
    return <Minus className="h-4 w-4 text-slate-500" />;
  };

  const getTrendLabel = () => {
    if (trend > 0) return `+${trend} pts`;
    if (trend < 0) return `${trend} pts`;
    return 'No change';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Score Trend</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            {getTrendIcon()}
            <span className={cn(
              trend > 0 && 'text-emerald-500',
              trend < 0 && 'text-rose-500',
              trend === 0 && 'text-muted-foreground'
            )}>
              {getTrendLabel()}
            </span>
          </div>
        </CardTitle>
        <CardDescription>Score progression over recent analyses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-32 flex items-end gap-2">
          {data.map((point, index) => {
            const height = ((point.score - minScore) / range) * 100;
            const getBarColor = (score: number) => {
              if (score >= 80) return 'bg-emerald-500';
              if (score >= 60) return 'bg-amber-500';
              return 'bg-rose-500';
            };

            return (
              <div 
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">
                    {point.score}
                  </span>
                  <div 
                    className={cn(
                      "w-full rounded-t-sm transition-all duration-500",
                      getBarColor(point.score)
                    )}
                    style={{ height: `${Math.max(height, 10)}%`, minHeight: '8px' }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-full">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}



