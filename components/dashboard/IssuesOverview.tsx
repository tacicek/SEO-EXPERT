'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface IssuesOverviewProps {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export function IssuesOverview({ high, medium, low, total }: IssuesOverviewProps) {
  const issues = [
    { 
      label: 'Critical', 
      count: high, 
      color: 'bg-rose-500', 
      textColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      icon: AlertTriangle 
    },
    { 
      label: 'Warning', 
      count: medium, 
      color: 'bg-amber-500', 
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      icon: AlertCircle 
    },
    { 
      label: 'Info', 
      count: low, 
      color: 'bg-blue-500', 
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      icon: Info 
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Issues Overview</span>
          <span className="text-2xl font-bold">{total}</span>
        </CardTitle>
        <CardDescription>Total issues found across all categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.label} className="flex items-center gap-4">
              <div className={cn("p-2 rounded-lg", issue.bgColor)}>
                <issue.icon className={cn("h-4 w-4", issue.textColor)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{issue.label}</span>
                  <span className={cn("text-sm font-bold", issue.textColor)}>{issue.count}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-500", issue.color)}
                    style={{ width: total > 0 ? `${(issue.count / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}



