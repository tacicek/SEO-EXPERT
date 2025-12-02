'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SiteHealthGaugeProps {
  score: number;
  lastAnalyzed?: string | null;
}

export function SiteHealthGauge({ score, lastAnalyzed }: SiteHealthGaugeProps) {
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-400';
    if (score >= 60) return 'from-amber-500 to-amber-400';
    return 'from-rose-500 to-rose-400';
  };

  // Calculate rotation for gauge (0 = -90deg, 100 = 90deg)
  const rotation = -90 + (score / 100) * 180;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-center">Site Health Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        {/* Gauge */}
        <div className="relative w-48 h-24 overflow-hidden">
          {/* Background arc */}
          <div className="absolute bottom-0 left-0 right-0 h-24 w-48">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              {/* Background track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="16"
                className="text-muted"
              />
              {/* Colored progress */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 251.2} 251.2`}
              />
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" className={cn("stop-current", score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600')} />
                  <stop offset="100%" className={cn("stop-current", score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400')} />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Score display */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <div className={cn("text-5xl font-bold", getScoreColor(score))}>
              {score}
            </div>
          </div>
        </div>

        {/* Label */}
        <div className={cn(
          "mt-4 px-4 py-1.5 rounded-full text-sm font-medium",
          "bg-gradient-to-r", getGradient(score), "text-white"
        )}>
          {getScoreLabel(score)}
        </div>

        {/* Last analyzed */}
        {lastAnalyzed && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last analyzed: {new Date(lastAnalyzed).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}



