'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Heading3, Heading4, Type, Undo, Redo, AlertCircle, 
  CheckCircle2, AlertTriangle, ExternalLink, FileText, Hash, Eye, Edit3,
  Link2, Lightbulb, BookOpen, X
} from 'lucide-react';
import type { SentenceAnalysis, ContentElementInfo, ContentLinkInfo } from '@/lib/types/analysis';
import { cn } from '@/lib/utils';

interface RichContentEditorProps {
  htmlContent?: string;
  rawMainHtml?: string;
  contentElements?: ContentElementInfo[];
  sentences: SentenceAnalysis[];
  links?: ContentLinkInfo[];
  baseUrl?: string;
  onSentenceClick?: (sentence: SentenceAnalysis) => void;
  onContentChange?: (content: string) => void;
  statistics?: {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
  };
}

// Custom Link Extension with styling
const CustomLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-link-type': {
        default: 'internal',
        parseHTML: element => element.getAttribute('data-link-type'),
        renderHTML: attributes => {
          return { 'data-link-type': attributes['data-link-type'] };
        },
      },
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          const linkType = attributes['data-link-type'] || 'internal';
          return { 
            class: `editor-link link-${linkType}` 
          };
        },
      },
    };
  },
});

// Toolbar Button Component
function ToolbarButton({ 
  onClick, 
  isActive, 
  disabled, 
  children, 
  title 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean; 
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <Button
      type="button"
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn('h-8 w-8 p-0', isActive && 'bg-primary/20')}
      title={title}
    >
      {children}
    </Button>
  );
}

// Editor Toolbar Component
function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        isActive={editor.isActive('heading', { level: 4 })}
        title="Heading 4"
      >
        <Heading4 className="h-4 w-4" />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
        title="Paragraph"
      >
        <Type className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

// Score colors and icons
function getScoreInfo(score: 'green' | 'orange' | 'red') {
  switch (score) {
    case 'green':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-l-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
        icon: CheckCircle2,
        label: 'Good',
        description: 'Quality content - Expert perspective, adds value',
      };
    case 'orange':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-l-amber-500',
        text: 'text-amber-700 dark:text-amber-400',
        icon: AlertTriangle,
        label: 'Improve',
        description: 'Could be better - More specific, add sources',
      };
    case 'red':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        border: 'border-l-rose-500',
        text: 'text-rose-700 dark:text-rose-400',
        icon: AlertCircle,
        label: 'Critical',
        description: 'Needs urgent fix - Weak or problematic content',
      };
  }
}

// Sentence Detail Panel - Shows when a sentence is selected
function SentenceDetailPanel({
  sentence,
  onClose,
}: {
  sentence: SentenceAnalysis;
  onClose: () => void;
}) {
  const scoreInfo = getScoreInfo(sentence.score);
  const Icon = scoreInfo.icon;

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg',
      'bg-white dark:bg-gray-900',
      'animate-in slide-in-from-bottom-5 duration-300'
    )}>
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-full', scoreInfo.bg)}>
              <Icon className={cn('h-5 w-5', scoreInfo.text)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  sentence.score === 'green' && 'bg-emerald-500',
                  sentence.score === 'orange' && 'bg-amber-500',
                  sentence.score === 'red' && 'bg-rose-500',
                )}>
                  {scoreInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Sentence #{sentence.position}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{scoreInfo.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Left: Original & Suggested */}
          <div className="space-y-3">
            {/* Original Sentence */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Original
              </div>
              <div className={cn(
                'p-3 rounded-lg border-l-4',
                scoreInfo.bg,
                scoreInfo.border
              )}>
                <p className="text-sm">{sentence.original}</p>
              </div>
            </div>

            {/* Suggested Sentence */}
            {sentence.suggestion && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Lightbulb className="h-4 w-4 text-emerald-500" />
                  Suggested Improvement
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500">
                  <p className="text-sm">{sentence.suggestion}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Reason & Expert Note */}
          <div className="space-y-3">
            {/* Reason */}
            {sentence.reason && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  Why This Score?
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500">
                  <p className="text-sm">{sentence.reason}</p>
                </div>
              </div>
            )}

            {/* Expert Note */}
            {sentence.expert_note && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  Expert Note
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border-l-4 border-l-purple-500">
                  <p className="text-sm italic">{sentence.expert_note}</p>
                </div>
              </div>
            )}

            {/* Criteria Scores */}
            {sentence.criteria_scores && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  E-E-A-T Criteria Scores
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(sentence.criteria_scores).map(([key, value]) => (
                    <div key={key} className="text-center p-2 rounded bg-muted/50">
                      <div className={cn(
                        'text-lg font-bold',
                        value >= 7 && 'text-emerald-600',
                        value >= 4 && value < 7 && 'text-amber-600',
                        value < 4 && 'text-rose-600'
                      )}>
                        {value}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Color-Coded Sentence Component
function ColorCodedSentence({
  sentence,
  isSelected,
  onClick,
}: {
  sentence: SentenceAnalysis;
  isSelected: boolean;
  onClick: () => void;
}) {
  const scoreInfo = getScoreInfo(sentence.score);
  const Icon = scoreInfo.icon;

  return (
    <div
      className={cn(
        'group relative p-3 rounded-lg cursor-pointer transition-all duration-200',
        'border-l-4',
        scoreInfo.bg,
        scoreInfo.border,
        isSelected && 'ring-2 ring-primary ring-offset-2',
        'hover:shadow-md hover:scale-[1.01]'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-4 w-4 mt-1 flex-shrink-0', scoreInfo.text)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">{sentence.original}</p>
          
          {/* Quick preview on hover */}
          <div className="mt-2 pt-2 border-t border-current/10 opacity-0 group-hover:opacity-100 transition-opacity">
            {sentence.reason && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                💡 {sentence.reason}
              </p>
            )}
            {sentence.suggestion && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 line-clamp-1">
                ✨ Click to see suggestion
              </p>
            )}
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn('flex-shrink-0 text-xs', scoreInfo.text)}
        >
          {scoreInfo.label}
        </Badge>
      </div>
    </div>
  );
}

// Main Content Analysis View - PRD compliant sentence-level analysis
function ContentAnalysisView({
  sentences,
  contentElements,
  selectedSentence,
  onSentenceSelect,
}: {
  sentences: SentenceAnalysis[];
  contentElements?: ContentElementInfo[];
  selectedSentence: SentenceAnalysis | null;
  onSentenceSelect: (sentence: SentenceAnalysis | null) => void;
}) {
  // Match sentences to content elements for structural display
  const contentWithAnalysis = useMemo(() => {
    if (!contentElements || contentElements.length === 0) {
      // No structure, just show sentences
      return null;
    }

    // Try to match sentences to content elements by text similarity
    const matchedElements = contentElements.map(element => {
      const matchedSentences = sentences.filter(s => {
        const elementText = element.text.toLowerCase();
        const sentenceText = s.original.toLowerCase();
        return elementText.includes(sentenceText) || sentenceText.includes(elementText.substring(0, 50));
      });
      
      return {
        element,
        sentences: matchedSentences,
        worstScore: matchedSentences.length > 0 
          ? matchedSentences.reduce((worst, s) => {
              if (s.score === 'red') return 'red';
              if (s.score === 'orange' && worst !== 'red') return 'orange';
              return worst;
            }, 'green' as 'green' | 'orange' | 'red')
          : null,
      };
    });

    return matchedElements;
  }, [contentElements, sentences]);

  return (
    <div className="p-4 space-y-3">
      {/* If we have content structure, show it with sentence analysis */}
      {contentWithAnalysis && contentWithAnalysis.length > 0 ? (
        contentWithAnalysis.map((item, index) => {
          const { element, sentences: matchedSentences, worstScore } = item;
          const scoreInfo = worstScore ? getScoreInfo(worstScore) : null;

          return (
            <div
              key={index}
              className={cn(
                'rounded-lg border transition-all',
                scoreInfo ? [scoreInfo.bg, `border-l-4`, scoreInfo.border] : 'border-gray-200 dark:border-gray-800'
              )}
            >
              {/* Element Header with type badge */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-current/10">
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs',
                    element.type === 'heading' && 'bg-purple-100 text-purple-800 dark:bg-purple-900/30',
                    element.type === 'list' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30',
                    element.type === 'paragraph' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30',
                    element.type === 'blockquote' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30'
                  )}
                >
                  {element.tag.toUpperCase()}
                </Badge>
                {worstScore && (
                  <Badge className={cn(
                    'text-xs',
                    worstScore === 'green' && 'bg-emerald-500',
                    worstScore === 'orange' && 'bg-amber-500',
                    worstScore === 'red' && 'bg-rose-500',
                  )}>
                    {scoreInfo?.label}
                  </Badge>
                )}
                {matchedSentences.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {matchedSentences.length} sentence(s) analyzed
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-3">
                {element.type === 'heading' && (
                  <div 
                    className={cn(
                      'font-bold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded p-1 -m-1',
                      element.level === 1 && 'text-2xl',
                      element.level === 2 && 'text-xl',
                      element.level === 3 && 'text-lg',
                      element.level === 4 && 'text-base',
                    )}
                    onClick={() => matchedSentences[0] && onSentenceSelect(matchedSentences[0])}
                  >
                    {element.text}
                  </div>
                )}

                {element.type === 'paragraph' && (
                  <div 
                    className="text-sm leading-relaxed cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded p-1 -m-1"
                    onClick={() => matchedSentences[0] && onSentenceSelect(matchedSentences[0])}
                    dangerouslySetInnerHTML={{ __html: element.html }}
                  />
                )}

                {element.type === 'list' && element.children && (
                  <ul className={cn(
                    'space-y-1 text-sm',
                    element.tag === 'ol' ? 'list-decimal' : 'list-disc',
                    'pl-5'
                  )}>
                    {element.children.map((child, childIndex) => (
                      <li 
                        key={childIndex}
                        className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded px-1"
                        dangerouslySetInnerHTML={{ __html: child.html }}
                      />
                    ))}
                  </ul>
                )}

                {element.type === 'blockquote' && (
                  <blockquote 
                    className="border-l-4 border-amber-400 pl-4 italic text-sm cursor-pointer"
                    onClick={() => matchedSentences[0] && onSentenceSelect(matchedSentences[0])}
                    dangerouslySetInnerHTML={{ __html: element.html }}
                  />
                )}
              </div>
            </div>
          );
        })
      ) : (
        // Fallback: Show all sentences with color coding (PRD style)
        sentences.map((sentence) => (
          <ColorCodedSentence
            key={sentence.position}
            sentence={sentence}
            isSelected={selectedSentence?.position === sentence.position}
            onClick={() => onSentenceSelect(
              selectedSentence?.position === sentence.position ? null : sentence
            )}
          />
        ))
      )}
    </div>
  );
}

export function RichContentEditor({
  htmlContent,
  rawMainHtml,
  contentElements,
  sentences,
  links,
  baseUrl,
  onSentenceClick,
  onContentChange,
  statistics,
}: RichContentEditorProps) {
  const [viewMode, setViewMode] = useState<'analysis' | 'edit'>('analysis');
  const [selectedSentence, setSelectedSentence] = useState<SentenceAnalysis | null>(null);
  const [wordCount, setWordCount] = useState(statistics?.wordCount || 0);
  const [charCount, setCharCount] = useState(statistics?.characterCount || 0);

  // Determine the best content to use for editor
  const editorContent = rawMainHtml || htmlContent || sentences.map(s => `<p>${s.original}</p>`).join('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      CustomLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),
      Underline,
    ],
    content: editorContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.split(/\s+/).filter(w => w.length > 0).length;
      const chars = text.replace(/\s/g, '').length;
      setWordCount(words);
      setCharCount(chars);
      onContentChange?.(editor.getHTML());
    },
  });

  // Handle sentence selection
  const handleSentenceSelect = (sentence: SentenceAnalysis | null) => {
    setSelectedSentence(sentence);
    if (sentence) {
      onSentenceClick?.(sentence);
    }
  };

  // Update editor content when htmlContent changes
  useEffect(() => {
    if (editor && editorContent && viewMode === 'edit') {
      const currentContent = editor.getHTML();
      if (currentContent !== editorContent) {
        editor.commands.setContent(editorContent);
      }
    }
  }, [editor, editorContent, viewMode]);

  // Calculate initial stats
  useEffect(() => {
    if (statistics) {
      setWordCount(statistics.wordCount);
      setCharCount(statistics.characterCount);
    }
  }, [statistics]);

  // Count by score
  const greenCount = sentences.filter(s => s.score === 'green').length;
  const orangeCount = sentences.filter(s => s.score === 'orange').length;
  const redCount = sentences.filter(s => s.score === 'red').length;

  // Count links by type
  const internalLinkCount = links?.filter(l => l.type === 'internal').length || 0;
  const externalLinkCount = links?.filter(l => l.type === 'external').length || 0;

  return (
    <Card className="flex-1 overflow-hidden flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-3 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-medium">Content Analysis</span>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Hash className="h-3 w-3" />
              {wordCount} words
            </Badge>
            <Badge variant="outline" className="gap-1">
              {charCount} chars
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'analysis' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('analysis')}
            className="gap-1"
          >
            <Eye className="h-3 w-3" />
            Analysis
          </Button>
          <Button
            variant={viewMode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('edit')}
            className="gap-1"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </Button>
        </div>
      </div>

      {/* Score Summary Bar */}
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-4 text-xs">
        <span className="text-muted-foreground font-medium">Analysis:</span>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span className="text-emerald-600 font-medium">{greenCount} Good</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span className="text-amber-600 font-medium">{orangeCount} Improve</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-rose-500" />
          <span className="text-rose-600 font-medium">{redCount} Critical</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1">
          <Link2 className="h-3 w-3 text-emerald-500" />
          <span>{internalLinkCount} internal</span>
        </div>
        <div className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3 text-violet-500" />
          <span>{externalLinkCount} external</span>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b bg-muted/20 flex items-center gap-4 text-xs flex-wrap">
        <span className="text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Good - Expert quality</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Improve - Could be better</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-rose-500" />
          <span>Critical - Needs urgent fix</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground italic">Click any sentence to see details & suggestions</span>
      </div>

      {/* Toolbar (Edit Mode Only) */}
      {viewMode === 'edit' && <EditorToolbar editor={editor} />}

      {/* Content Area */}
      <ScrollArea className="flex-1">
        {viewMode === 'edit' ? (
          <div className="editor-container">
            <EditorContent editor={editor} />
          </div>
        ) : (
          <ContentAnalysisView
            sentences={sentences}
            contentElements={contentElements}
            selectedSentence={selectedSentence}
            onSentenceSelect={handleSentenceSelect}
          />
        )}
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{sentences.length} sentences analyzed</span>
          <span>•</span>
          <span>{contentElements?.length || 0} content blocks</span>
        </div>
        <div>
          {viewMode === 'edit' ? 'Editing mode - Changes will be re-analyzed' : 'Click sentences for detailed analysis'}
        </div>
      </div>

      {/* Sentence Detail Panel - Fixed at bottom */}
      {selectedSentence && viewMode === 'analysis' && (
        <SentenceDetailPanel
          sentence={selectedSentence}
          onClose={() => setSelectedSentence(null)}
        />
      )}

      {/* Custom styles */}
      <style jsx global>{`
        .editor-container .link-internal,
        .link-internal {
          color: #059669;
          text-decoration: underline;
          text-decoration-color: #059669;
        }
        .editor-container .link-external,
        .link-external {
          color: #7c3aed;
          text-decoration: underline;
          text-decoration-color: #7c3aed;
        }
        .editor-container .link-external::after,
        .link-external::after {
          content: '↗';
          font-size: 0.7em;
          margin-left: 2px;
        }
        .ProseMirror {
          min-height: 400px;
        }
        .ProseMirror p {
          margin-bottom: 1em;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        .ProseMirror h1 { font-size: 1.875rem; }
        .ProseMirror h2 { font-size: 1.5rem; }
        .ProseMirror h3 { font-size: 1.25rem; }
        .ProseMirror h4 { font-size: 1.125rem; }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        .ProseMirror li {
          margin-bottom: 0.25em;
        }
        .ProseMirror strong {
          font-weight: 700;
        }
        .ProseMirror em {
          font-style: italic;
        }
        .ProseMirror u {
          text-decoration: underline;
        }
      `}</style>
    </Card>
  );
}
