'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bold, Italic, Underline as UnderlineIcon, Link2, List, ListOrdered,
  Heading1, Heading2, Heading3, Heading4, Type, Undo, Redo, AlertCircle, 
  CheckCircle2, AlertTriangle, ExternalLink, FileText, Hash, Eye, Edit3,
  ChevronDown, ChevronRight
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

// Structured Content Viewer - Shows content with element types clearly labeled
function StructuredContentViewer({
  contentElements,
  htmlContent,
  rawMainHtml,
  sentences,
  onSentenceClick,
}: {
  contentElements?: ContentElementInfo[];
  htmlContent?: string;
  rawMainHtml?: string;
  sentences: SentenceAnalysis[];
  onSentenceClick?: (sentence: SentenceAnalysis) => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const getElementIcon = (type: string, tag: string) => {
    if (type === 'heading') {
      const level = parseInt(tag.charAt(1)) || 2;
      switch (level) {
        case 1: return <Heading1 className="h-4 w-4" />;
        case 2: return <Heading2 className="h-4 w-4" />;
        case 3: return <Heading3 className="h-4 w-4" />;
        default: return <Heading4 className="h-4 w-4" />;
      }
    }
    if (type === 'list') return <List className="h-4 w-4" />;
    return <Type className="h-4 w-4" />;
  };

  const getElementBadge = (type: string, tag: string) => {
    if (type === 'heading') return { label: tag.toUpperCase(), color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
    if (type === 'list') return { label: tag.toUpperCase(), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
    if (type === 'blockquote') return { label: 'QUOTE', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'P', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' };
  };

  // If we have contentElements, render them structured
  if (contentElements && contentElements.length > 0) {
    return (
      <div className="space-y-3 p-4">
        {contentElements.map((element, index) => {
          const badge = getElementBadge(element.type, element.tag);
          const hasChildren = element.children && element.children.length > 0;
          const isExpanded = expandedItems.has(index);

          return (
            <div
              key={index}
              className={cn(
                'rounded-lg border transition-all',
                element.type === 'heading' && 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20',
                element.type === 'list' && 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20',
                element.type === 'blockquote' && 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
                element.type === 'paragraph' && 'border-gray-200 dark:border-gray-800'
              )}
            >
              {/* Element Header */}
              <div 
                className={cn(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer',
                  hasChildren && 'hover:bg-black/5 dark:hover:bg-white/5'
                )}
                onClick={() => hasChildren && toggleExpand(index)}
              >
                {hasChildren && (
                  isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                {getElementIcon(element.type, element.tag)}
                <Badge variant="outline" className={cn('text-xs', badge.color)}>
                  {badge.label}
                </Badge>
                {element.type === 'list' && element.children && (
                  <span className="text-xs text-muted-foreground">
                    {element.children.length} items
                  </span>
                )}
              </div>

              {/* Element Content */}
              <div className="px-4 pb-3">
                {element.type === 'heading' && (
                  <div 
                    className={cn(
                      'font-bold',
                      element.level === 1 && 'text-2xl',
                      element.level === 2 && 'text-xl',
                      element.level === 3 && 'text-lg',
                      element.level === 4 && 'text-base',
                    )}
                    dangerouslySetInnerHTML={{ __html: element.html }}
                  />
                )}

                {element.type === 'paragraph' && (
                  <div 
                    className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: element.html }}
                  />
                )}

                {element.type === 'blockquote' && (
                  <blockquote 
                    className="border-l-4 border-amber-400 pl-4 italic text-sm"
                    dangerouslySetInnerHTML={{ __html: element.html }}
                  />
                )}

                {element.type === 'list' && element.children && isExpanded && (
                  <ul className={cn(
                    'mt-2 space-y-1 text-sm',
                    element.tag === 'ol' ? 'list-decimal' : 'list-disc',
                    'pl-5'
                  )}>
                    {element.children.map((child, childIndex) => (
                      <li 
                        key={childIndex}
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: child.html }}
                      />
                    ))}
                  </ul>
                )}

                {element.type === 'list' && element.children && !isExpanded && (
                  <div className="text-sm text-muted-foreground truncate">
                    {element.children.slice(0, 2).map(c => c.text).join(' • ')}
                    {element.children.length > 2 && ' ...'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: render raw HTML if available
  if (rawMainHtml) {
    return (
      <div 
        className="p-4 prose prose-sm max-w-none dark:prose-invert structured-content"
        dangerouslySetInnerHTML={{ __html: rawMainHtml }}
      />
    );
  }

  // Fallback: render processed HTML content
  if (htmlContent) {
    return (
      <div 
        className="p-4 prose prose-sm max-w-none dark:prose-invert structured-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // Last fallback: render sentences
  return (
    <div className="p-4 space-y-4">
      {sentences.map((sentence, index) => (
        <p key={index} className="text-sm">{sentence.original}</p>
      ))}
    </div>
  );
}

// Sentence Analysis Viewer - Shows each sentence with its score
function SentenceAnalysisViewer({
  sentences,
  onSentenceClick,
}: {
  sentences: SentenceAnalysis[];
  onSentenceClick?: (sentence: SentenceAnalysis) => void;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getScoreColor = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green': return 'bg-emerald-100 border-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-700';
      case 'orange': return 'bg-amber-100 border-amber-400 dark:bg-amber-900/30 dark:border-amber-700';
      case 'red': return 'bg-rose-100 border-rose-400 dark:bg-rose-900/30 dark:border-rose-700';
    }
  };

  const getScoreBadge = (score: 'green' | 'orange' | 'red') => {
    switch (score) {
      case 'green': return { label: 'Good', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' };
      case 'orange': return { label: 'Improve', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' };
      case 'red': return { label: 'Critical', icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400' };
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
                <p className="text-sm leading-relaxed">{sentence.original}</p>
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
  const [viewMode, setViewMode] = useState<'content' | 'analysis' | 'edit'>('content');
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

  // Count links by type
  const internalLinkCount = links?.filter(l => l.type === 'internal').length || 0;
  const externalLinkCount = links?.filter(l => l.type === 'external').length || 0;

  // Count content elements
  const headingCount = contentElements?.filter(e => e.type === 'heading').length || 0;
  const listCount = contentElements?.filter(e => e.type === 'list').length || 0;
  const paragraphCount = contentElements?.filter(e => e.type === 'paragraph').length || 0;

  return (
    <Card className="flex-1 overflow-hidden flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-3 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-medium">Content Editor</span>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Hash className="h-3 w-3" />
              {wordCount} words
            </Badge>
            <Badge variant="outline" className="gap-1">
              {charCount} chars
            </Badge>
            {headingCount > 0 && (
              <Badge variant="outline" className="gap-1 text-purple-600">
                <Heading2 className="h-3 w-3" />
                {headingCount} headings
              </Badge>
            )}
            {listCount > 0 && (
              <Badge variant="outline" className="gap-1 text-blue-600">
                <List className="h-3 w-3" />
                {listCount} lists
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 text-emerald-600">
              <Link2 className="h-3 w-3" />
              {internalLinkCount} internal
            </Badge>
            <Badge variant="outline" className="gap-1 text-violet-600">
              <ExternalLink className="h-3 w-3" />
              {externalLinkCount} external
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'content' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('content')}
            className="gap-1"
          >
            <Eye className="h-3 w-3" />
            Content
          </Button>
          <Button
            variant={viewMode === 'analysis' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('analysis')}
            className="gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
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

      {/* Legend */}
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-4 text-xs flex-wrap">
        <span className="text-muted-foreground">Legend:</span>
        {viewMode === 'analysis' && (
          <>
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
          </>
        )}
        {viewMode === 'content' && (
          <>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs px-1">H1-H6</Badge>
              <span>Heading</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs px-1">UL/OL</Badge>
              <span>List</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="bg-gray-100 text-gray-800 text-xs px-1">P</Badge>
              <span>Paragraph</span>
            </div>
          </>
        )}
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1">
          <span className="underline text-emerald-600 decoration-emerald-600">Internal Link</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="underline text-violet-600 decoration-violet-600">External Link</span>
        </div>
      </div>

      {/* Toolbar (Edit Mode Only) */}
      {viewMode === 'edit' && <EditorToolbar editor={editor} />}

      {/* Content Area */}
      <ScrollArea className="flex-1">
        {viewMode === 'edit' ? (
          <div className="editor-container">
            <EditorContent editor={editor} />
          </div>
        ) : viewMode === 'analysis' ? (
          <SentenceAnalysisViewer
            sentences={sentences}
            onSentenceClick={onSentenceClick}
          />
        ) : (
          <StructuredContentViewer
            contentElements={contentElements}
            htmlContent={htmlContent}
            rawMainHtml={rawMainHtml}
            sentences={sentences}
            onSentenceClick={onSentenceClick}
          />
        )}
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{contentElements?.length || 0} content blocks</span>
          <span>•</span>
          <span>{sentences.length} sentences analyzed</span>
          <span>•</span>
          <span className="text-emerald-600">{sentences.filter(s => s.score === 'green').length} good</span>
          <span className="text-amber-600">{sentences.filter(s => s.score === 'orange').length} improve</span>
          <span className="text-rose-600">{sentences.filter(s => s.score === 'red').length} critical</span>
        </div>
        <div>
          {viewMode === 'edit' ? 'Editing mode - Changes will be re-analyzed' : 
           viewMode === 'analysis' ? 'Click on sentences for details' : 
           'Viewing structured content'}
        </div>
      </div>

      {/* Custom styles for links and content */}
      <style jsx global>{`
        .editor-container .link-internal,
        .structured-content .link-internal,
        .structured-content a[data-link-type="internal"] {
          color: #059669;
          text-decoration: underline;
          text-decoration-color: #059669;
        }
        .editor-container .link-external,
        .structured-content .link-external,
        .structured-content a[data-link-type="external"] {
          color: #7c3aed;
          text-decoration: underline;
          text-decoration-color: #7c3aed;
        }
        .editor-container .link-external::after,
        .structured-content .link-external::after,
        .structured-content a[data-link-type="external"]::after {
          content: '↗';
          font-size: 0.7em;
          margin-left: 2px;
        }
        .editor-container a[href],
        .structured-content a[href] {
          cursor: pointer;
        }
        .ProseMirror {
          min-height: 400px;
        }
        .ProseMirror p {
          margin-bottom: 1em;
        }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 {
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
        .ProseMirror blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
        }
        .structured-content h1, .structured-content h2, .structured-content h3, 
        .structured-content h4, .structured-content h5, .structured-content h6 {
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .structured-content h1 { font-size: 1.875rem; }
        .structured-content h2 { font-size: 1.5rem; }
        .structured-content h3 { font-size: 1.25rem; }
        .structured-content h4 { font-size: 1.125rem; }
        .structured-content ul, .structured-content ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        .structured-content li {
          margin-bottom: 0.25em;
        }
        .structured-content p {
          margin-bottom: 1em;
        }
      `}</style>
    </Card>
  );
}
