'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAnalysisStore } from '@/lib/store/analysis-store';
import type { SentenceAnalysis } from '@/lib/types/analysis';

interface ContentEditorProps {
  sentences: SentenceAnalysis[];
  onSentenceClick?: (sentence: SentenceAnalysis) => void;
}

export function ContentEditor({ sentences, onSentenceClick }: ContentEditorProps) {
  const { setSelectedSentence } = useAnalysisStore();
  const [hoveredSentence, setHoveredSentence] = useState<number | null>(null);

  const getScoreStyles = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green':
        return {
          bg: 'bg-green-50/80 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-900/40',
          border: 'border-l-4 border-green-500',
          text: 'text-green-900 dark:text-green-100',
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          badge: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
        };
      case 'orange':
        return {
          bg: 'bg-orange-50/80 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40',
          border: 'border-l-4 border-orange-500',
          text: 'text-orange-900 dark:text-orange-100',
          icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
          badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
        };
      case 'red':
        return {
          bg: 'bg-red-50/80 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40',
          border: 'border-l-4 border-red-500',
          text: 'text-red-900 dark:text-red-100',
          icon: <AlertCircle className="h-4 w-4 text-red-600" />,
          badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
        };
      default:
        return {
          bg: 'bg-muted hover:bg-muted/80',
          border: 'border-l-4 border-transparent',
          text: '',
          icon: null,
          badge: '',
        };
    }
  };

  const handleSentenceClick = (sentence: SentenceAnalysis) => {
    setSelectedSentence(sentence);
    if (onSentenceClick) {
      onSentenceClick(sentence);
    }
  };

  if (!sentences || sentences.length === 0) {
    return (
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="p-2 border-b bg-muted/30 flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Content Editor</div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">Click on a highlighted sentence to see suggestions</p>
            <p className="text-sm">No content available for analysis</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex-1 overflow-hidden flex flex-col shadow-lg">
      <div className="p-3 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">Content Analysis</span>
        </div>
        <div className="h-4 w-px bg-border mx-1" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs gap-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            Critical
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
            Improve
          </Badge>
          <Badge variant="outline" className="text-xs gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Good
          </Badge>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="text-xs gap-1 h-8">
          <Wand2 className="h-3 w-3" /> Auto-Fix All
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Analyzed Content</h2>
            <p className="text-sm text-muted-foreground">
              Click on any sentence to view detailed suggestions. Colors indicate SEO quality.
            </p>
          </div>

          {sentences.map((sentence) => {
            const styles = getScoreStyles(sentence.score);
            const isHovered = hoveredSentence === sentence.position;

            return (
              <div
                key={sentence.position}
                className={`
                  relative p-4 rounded-lg ${styles.bg} ${styles.border} 
                  cursor-pointer transition-all duration-200 
                  ${isHovered ? 'shadow-md transform scale-[1.01]' : ''}
                  group
                `}
                onClick={() => handleSentenceClick(sentence)}
                onMouseEnter={() => setHoveredSentence(sentence.position)}
                onMouseLeave={() => setHoveredSentence(null)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {styles.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`text-base leading-relaxed ${styles.text}`}>
                      {sentence.original}
                    </p>
                    
                    {isHovered && sentence.reason && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <p className="text-sm font-medium mb-1">Analysis:</p>
                        <p className="text-sm opacity-90">{sentence.reason}</p>
                        {sentence.suggestion && (
                          <>
                            <p className="text-sm font-medium mt-2 mb-1">Suggestion:</p>
                            <p className="text-sm opacity-90 italic">{sentence.suggestion}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Badge className={styles.badge}>
                      {sentence.score === 'green' ? 'Good' : 
                       sentence.score === 'orange' ? 'Needs Improvement' : 'Critical'}
                    </Badge>
                  </div>
                </div>

                {/* Click indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-muted-foreground">Click for details →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
