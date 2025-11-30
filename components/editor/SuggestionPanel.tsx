'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAnalysisStore } from '@/lib/store/analysis-store';
import type { SentenceAnalysis } from '@/lib/types/analysis';

interface SuggestionPanelProps {
  sentence: SentenceAnalysis | null;
}

export function SuggestionPanel({ sentence }: SuggestionPanelProps) {
  const { applySuggestion, rejectSuggestion, setSelectedSentence } = useAnalysisStore();

  if (!sentence) {
    return (
      <Card className="h-48">
        <CardContent className="flex items-center justify-center h-full text-muted-foreground">
          Click on a highlighted sentence to see suggestions
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

  return (
    <Card className="min-h-48">
      <CardHeader className={`py-3 px-4 border-b ${getHeaderColor(sentence.score)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            {getIcon(sentence.score)}
            <span>{getTitle(sentence.score)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleClose}>
              Close
            </Button>
            {sentence.score !== 'green' && sentence.suggestion && (
              <>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleReject}>
                  Ignore
                </Button>
                <Button
                  size="sm"
                  className={`h-7 text-xs ${
                    sentence.score === 'red'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  onClick={handleApply}
                >
                  Apply Fix
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">ORIGINAL</div>
            <div className="p-2 bg-muted rounded text-sm">{sentence.original}</div>
          </div>
          {sentence.suggestion && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">SUGGESTION</div>
              <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded text-sm">
                {sentence.suggestion}
              </div>
            </div>
          )}
        </div>

        {sentence.reason && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">WHY THIS MATTERS</div>
            <p className="text-sm text-muted-foreground">{sentence.reason}</p>
          </div>
        )}

        {sentence.expert_note && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">EXPERT NOTE</div>
            <p className="text-sm text-muted-foreground italic">{sentence.expert_note}</p>
          </div>
        )}

        {sentence.criteria_scores && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">CRITERIA SCORES</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(sentence.criteria_scores).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize text-muted-foreground">
                    {key.replace('_', ' ')}:
                  </span>
                  <span className="font-medium">{value}/10</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
