'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { XCircle, AlertTriangle, CheckCircle2, Lightbulb, TrendingUp, X, Sparkles } from 'lucide-react';
import { useAnalysisStore } from '@/lib/store/analysis-store';
import type { SentenceAnalysis } from '@/lib/types/analysis';

interface SuggestionPanelProps {
  sentence: SentenceAnalysis | null;
}

export function SuggestionPanel({ sentence }: SuggestionPanelProps) {
  const { applySuggestion, rejectSuggestion, setSelectedSentence } = useAnalysisStore();

  if (!sentence) {
    return (
      <Card className="h-48 border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Lightbulb className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No Sentence Selected</p>
          <p className="text-xs mt-1">Click on a sentence to view detailed suggestions</p>
        </CardContent>
      </Card>
    );
  }

  const getHeaderColor = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green':
        return 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400';
      case 'orange':
        return 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400';
      case 'red':
        return 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400';
    }
  };

  const getIcon = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'orange':
        return <AlertTriangle className="h-4 w-4" />;
      case 'red':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getTitle = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green':
        return 'Good Quality Sentence';
      case 'orange':
        return 'Can Be Improved';
      case 'red':
        return 'Critical Issue';
    }
  };

  const handleApply = () => {
    applySuggestion(sentence.position);
  };

  const handleReject = () => {
    rejectSuggestion(sentence.position);
  };

  const handleClose = () => {
    setSelectedSentence(null);
  };

  const averageScore = sentence.criteria_scores 
    ? Math.round(Object.values(sentence.criteria_scores).reduce((a, b) => a + b, 0) / Object.keys(sentence.criteria_scores).length)
    : 0;

  return (
    <Card className="min-h-48 shadow-lg border-2">
      <CardHeader className={`py-4 px-5 border-b-2 ${getHeaderColor(sentence.score)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              sentence.score === 'red' ? 'bg-red-100 dark:bg-red-900' :
              sentence.score === 'orange' ? 'bg-orange-100 dark:bg-orange-900' :
              'bg-green-100 dark:bg-green-900'
            }`}>
              {getIcon(sentence.score)}
            </div>
            <div>
              <h3 className="font-semibold text-base">{getTitle(sentence.score)}</h3>
              <p className="text-xs opacity-75">Sentence #{sentence.position}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-white/20" 
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Original vs Suggestion Comparison */}
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 border-l-4 border-muted">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">Current</Badge>
            </div>
            <p className="text-sm leading-relaxed">{sentence.original}</p>
          </div>

          {sentence.suggestion && (
            <>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-px w-12 bg-border" />
                  <Sparkles className="h-3 w-3" />
                  <div className="h-px w-12 bg-border" />
                </div>
              </div>

              <div className={`rounded-lg p-4 border-l-4 ${
                sentence.score === 'red' 
                  ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-950/20 border-green-500'
                  : 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-950/20 border-green-500'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-xs bg-green-600">Improved</Badge>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-sm leading-relaxed font-medium">{sentence.suggestion}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1" 
                  onClick={handleReject}
                >
                  Ignore
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 ${
                    sentence.score === 'red'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  onClick={handleApply}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Apply Fix
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Analysis Reason */}
        {sentence.reason && (
          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Why This Matters
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300">{sentence.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expert Note */}
        {sentence.expert_note && (
          <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-900">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                  Expert Note
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-300 italic">
                  {sentence.expert_note}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Criteria Scores */}
        {sentence.criteria_scores && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground">SEO Quality Metrics</p>
              <Badge variant="outline" className="text-xs">
                Avg: {averageScore}/10
              </Badge>
            </div>
            <div className="space-y-2.5">
              {Object.entries(sentence.criteria_scores).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="capitalize font-medium">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="font-bold">{value}/10</span>
                  </div>
                  <Progress 
                    value={value * 10} 
                    className={`h-1.5 ${
                      value >= 8 ? '[&>div]:bg-green-500' :
                      value >= 5 ? '[&>div]:bg-orange-500' :
                      '[&>div]:bg-red-500'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
