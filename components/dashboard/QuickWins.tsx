'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickWinsProps {
  wins: string[];
}

export function QuickWins({ wins }: QuickWinsProps) {
  if (wins.length === 0) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            All Good!
          </CardTitle>
          <CardDescription>
            No quick wins needed. Your site is well optimized!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Quick Wins
        </CardTitle>
        <CardDescription>Easy fixes with high impact</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {wins.map((win, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                "bg-gradient-to-r from-amber-500/5 to-transparent",
                "border border-amber-500/10",
                "hover:border-amber-500/20 transition-colors"
              )}
            >
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-600">{index + 1}</span>
              </div>
              <p className="text-sm leading-relaxed">{win}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

