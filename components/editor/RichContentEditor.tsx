'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bold, Italic, Underline as UnderlineIcon, Link2, List, ListOrdered,
  Heading1, Heading2, Heading3, Type, Undo, Redo, AlertCircle, 
  CheckCircle2, AlertTriangle, ExternalLink, FileText, Hash
} from 'lucide-react';
import type { SentenceAnalysis } from '@/lib/types/analysis';
import type { ContentElement, ContentLink } from '@/lib/scraper/content-fetcher';
import { cn } from '@/lib/utils';

interface RichContentEditorProps {
  htmlContent: string;
  contentElements?: ContentElement[];
  sentences: SentenceAnalysis[];
  links?: ContentLink[];
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

// Sentence Overlay Component for highlighting analyzed sentences
function SentenceOverlay({
  sentences,
  content,
  onSentenceClick,
}: {
  sentences: SentenceAnalysis[];
  content: string;
  onSentenceClick?: (sentence: SentenceAnalysis) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getScoreColor = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green': return 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900/30';
      case 'orange': return 'bg-amber-100 border-amber-400 dark:bg-amber-900/30';
      case 'red': return 'bg-rose-100 border-rose-400 dark:bg-rose-900/30';
    }
  };

  const getScoreBadge = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green': return { label: 'Good', icon: CheckCircle2, color: 'text-emerald-600' };
      case 'orange': return { label: 'Improve', icon: AlertTriangle, color: 'text-amber-600' };
      case 'red': return { label: 'Critical', icon: AlertCircle, color: 'text-rose-600' };
    }
  };

  return (
    <div className="space-y-2 p-4">
      {sentences.map((sentence, index) => {
        const scoreInfo = getScoreBadge(sentence.score);
        const Icon = scoreInfo.icon;
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={sentence.position}
            className={cn(
              'relative p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200',
              getScoreColor(sentence.score),
              isHovered && 'shadow-md scale-[1.01]'
            )}
            onClick={() => onSentenceClick?.(sentence)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('h-4 w-4 mt-1 flex-shrink-0', scoreInfo.color)} />
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatSentenceWithLinks(sentence.original) }}
                />
                {isHovered && sentence.reason && (
                  <div className="mt-2 pt-2 border-t border-current/20 text-xs">
                    <p className="font-medium mb-1">💡 {sentence.reason}</p>
                    {sentence.suggestion && (
                      <p className="text-muted-foreground italic">✨ {sentence.suggestion}</p>
                    )}
                  </div>
                )}
              </div>
              <Badge 
                variant="outline" 
                className={cn('flex-shrink-0 text-xs', scoreInfo.color)}
              >
                {scoreInfo.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper to format sentence with link styling
function formatSentenceWithLinks(text: string): string {
  // This is a simplified version - in production you'd want to match actual links
  return text
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="link-external">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

export function RichContentEditor({
  htmlContent,
  contentElements,
  sentences,
  links,
  baseUrl,
  onSentenceClick,
  onContentChange,
  statistics,
}: RichContentEditorProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'analyze'>('analyze');
  const [wordCount, setWordCount] = useState(statistics?.wordCount || 0);
  const [charCount, setCharCount] = useState(statistics?.characterCount || 0);

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
    content: htmlContent,
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

  // Update editor content when htmlContent changes
  useEffect(() => {
    if (editor && htmlContent && editor.getHTML() !== htmlContent) {
      editor.commands.setContent(htmlContent);
    }
  }, [editor, htmlContent]);

  // Calculate initial stats
  useEffect(() => {
    if (statistics) {
      setWordCount(statistics.wordCount);
      setCharCount(statistics.characterCount);
    }
  }, [statistics]);

  // Count links by type
  const internalLinkCount = links?.filter(l => l.type === 'internal').length || 0;
  const externalLinkCount = links?.filter(l => l.type === 'external').length || 0;

  return (
    <Card className="flex-1 overflow-hidden flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-3 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-medium">Content Editor</span>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="gap-1">
              <Hash className="h-3 w-3" />
              {wordCount} words
            </Badge>
            <Badge variant="outline" className="gap-1">
              {charCount} chars
            </Badge>
            <Badge variant="outline" className="gap-1 text-blue-600">
              <Link2 className="h-3 w-3" />
              {internalLinkCount} internal
            </Badge>
            <Badge variant="outline" className="gap-1 text-violet-600">
              <ExternalLink className="h-3 w-3" />
              {externalLinkCount} external
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'analyze' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('analyze')}
          >
            Analysis View
          </Button>
          <Button
            variant={viewMode === 'edit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('edit')}
          >
            Edit Mode
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span>Good</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span>Needs Improvement</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-rose-500" />
          <span>Critical</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1">
          <span className="underline text-blue-600 decoration-blue-600">Internal Link</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="underline text-violet-600 decoration-violet-600">External Link</span>
        </div>
      </div>

      {/* Toolbar (Edit Mode Only) */}
      {viewMode === 'edit' && <EditorToolbar editor={editor} />}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'edit' ? (
          <div className="editor-container">
            <EditorContent editor={editor} />
          </div>
        ) : (
          <SentenceOverlay
            sentences={sentences}
            content={htmlContent}
            onSentenceClick={onSentenceClick}
          />
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{sentences.length} sentences analyzed</span>
          <span>•</span>
          <span className="text-emerald-600">{sentences.filter(s => s.score === 'green').length} good</span>
          <span className="text-amber-600">{sentences.filter(s => s.score === 'orange').length} improve</span>
          <span className="text-rose-600">{sentences.filter(s => s.score === 'red').length} critical</span>
        </div>
        <div>
          {viewMode === 'edit' ? 'Editing mode - Changes will be re-analyzed' : 'Click on sentences for details'}
        </div>
      </div>

      {/* Custom styles for links */}
      <style jsx global>{`
        .editor-container .link-internal {
          color: #2563eb;
          text-decoration: underline;
          text-decoration-color: #2563eb;
        }
        .editor-container .link-external {
          color: #7c3aed;
          text-decoration: underline;
          text-decoration-color: #7c3aed;
        }
        .editor-container .link-external::after {
          content: '↗';
          font-size: 0.7em;
          margin-left: 2px;
        }
        .editor-container a[href] {
          cursor: pointer;
        }
        .ProseMirror {
          min-height: 400px;
        }
        .ProseMirror p {
          margin-bottom: 1em;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        .ProseMirror h1 { font-size: 1.875rem; }
        .ProseMirror h2 { font-size: 1.5rem; }
        .ProseMirror h3 { font-size: 1.25rem; }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
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

