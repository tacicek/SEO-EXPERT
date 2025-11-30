'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { useAnalysisStore } from '@/lib/store/analysis-store';
import type { SentenceAnalysis } from '@/lib/types/analysis';

interface ContentEditorProps {
  sentences: SentenceAnalysis[];
  onSentenceClick?: (sentence: SentenceAnalysis) => void;
}

export function ContentEditor({ sentences, onSentenceClick }: ContentEditorProps) {
  const { setSelectedSentence } = useAnalysisStore();

  const getBackgroundColor = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'orange':
        return 'bg-orange-100 dark:bg-orange-900/30';
      case 'red':
        return 'bg-red-100 dark:bg-red-900/30';
      default:
        return '';
    }
  };

  const getUnderlineColor = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green':
        return 'decoration-green-500';
      case 'orange':
        return 'decoration-orange-500';
      case 'red':
        return 'decoration-red-500';
      default:
        return '';
    }
  };

  const handleSentenceClick = (sentence: SentenceAnalysis) => {
    setSelectedSentence(sentence);
    if (onSentenceClick) {
      onSentenceClick(sentence);
    }
  };

  return (
    <Card className="flex-1 overflow-hidden flex flex-col">
      <div className="p-2 border-b bg-muted/30 flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="font-bold">B</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="italic">I</span>
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          H2
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          H3
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          <Wand2 className="h-3 w-3" /> Auto-Fix All
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="font-serif text-lg leading-relaxed space-y-4">
          {sentences.map((sentence) => (
            <span
              key={sentence.position}
              className={`${getBackgroundColor(sentence.score)} px-1 rounded cursor-pointer hover:underline ${getUnderlineColor(sentence.score)} transition-colors`}
              onClick={() => handleSentenceClick(sentence)}
            >
              {sentence.original}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
