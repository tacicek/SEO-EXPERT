'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { EEATScores } from '@/lib/types/analysis';

interface EEATReportProps {
  scores: EEATScores;
}

export function EEATReport({ scores }: EEATReportProps) {
  const categories = [
    {
      key: 'experience',
      title: 'Experience',
      description: 'First-hand knowledge and real-world usage',
      data: scores.experience,
      color: 'bg-blue-500',
    },
    {
      key: 'expertise',
      title: 'Expertise',
      description: 'Deep knowledge and technical understanding',
      data: scores.expertise,
      color: 'bg-purple-500',
    },
    {
      key: 'authoritativeness',
      title: 'Authoritativeness',
      description: 'Recognition and credibility',
      data: scores.authoritativeness,
      color: 'bg-orange-500',
    },
    {
      key: 'trustworthiness',
      title: 'Trustworthiness',
      description: 'Reliability and transparency',
      data: scores.trustworthiness,
      color: 'bg-green-500',
    },
  ];

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const };
    if (score >= 40) return { label: 'Fair', variant: 'outline' as const };
    return { label: 'Needs Work', variant: 'destructive' as const };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">E-E-A-T Analysis</h2>
        <p className="text-muted-foreground">
          Evaluation based on Google's Search Quality Rater Guidelines
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category) => {
          const scoreInfo = getScoreLabel(category.data.score);
          
          return (
            <Card key={category.key}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {category.description}
                    </CardDescription>
                  </div>
                  <Badge variant={scoreInfo.variant}>{scoreInfo.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Score</span>
                    <span className="text-2xl font-bold">{category.data.score}/100</span>
                  </div>
                  <Progress value={category.data.score} className="h-2" />
                </div>

                {category.data.signals_found.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Strengths Found</span>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {category.data.signals_found.slice(0, 3).map((signal, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          <span>{signal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {category.data.signals_missing.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Missing Elements</span>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {category.data.signals_missing.slice(0, 3).map((signal, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5">•</span>
                          <span>{signal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {category.data.recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-2">
                      <span>Top Recommendations</span>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {category.data.recommendations.slice(0, 2).map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">→</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
