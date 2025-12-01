'use client';

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Save, Share2, 
  Loader2, FileText, Link2, ExternalLink, Hash, Type, BarChart3,
  Heading1, Heading2, Heading3, List, Quote
} from "lucide-react";
import Link from "next/link";
import { useAnalysisStore } from "@/lib/store/analysis-store";
import { RichContentEditor } from "@/components/editor/RichContentEditor";
import { SuggestionPanel } from "@/components/editor/SuggestionPanel";
import { EEATReport } from "@/components/reports/EEATReport";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { cn } from "@/lib/utils";

export default function EditorPage() {
  const router = useRouter();
  const { currentAnalysis, selectedSentence, setSelectedSentence } = useAnalysisStore();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    
    if (!currentAnalysis) {
      router.push('/');
    }
  }, [currentAnalysis, router, user, loading]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  if (!currentAnalysis) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No analysis data available</p>
            <Button asChild>
              <Link href="/">Start New Analysis</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { 
    title, 
    url,
    htmlContent,
    rawMainHtml,
    contentElements,
    headings,
    content_summary, 
    sentence_analysis, 
    eeat_scores, 
    statistics, 
    priority_actions,
    links,
    link_analysis 
  } = currentAnalysis;

  // Calculate E-E-A-T average
  const eeatAverage = Math.round(
    (eeat_scores.experience.score + 
     eeat_scores.expertise.score + 
     eeat_scores.authoritativeness.score + 
     eeat_scores.trustworthiness.score) / 4
  );

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Count headings
  const totalHeadings = headings ? 
    (headings.h1?.length || 0) + 
    (headings.h2?.length || 0) + 
    (headings.h3?.length || 0) + 
    (headings.h4?.length || 0) + 
    (headings.h5?.length || 0) + 
    (headings.h6?.length || 0) : 0;

  // Count content element types
  const listCount = contentElements?.filter(e => e.type === 'list').length || 0;
  const paragraphCount = contentElements?.filter(e => e.type === 'paragraph').length || 0;
  const blockquoteCount = contentElements?.filter(e => e.type === 'blockquote').length || 0;

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 h-full">
        {/* Editor Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 via-primary/10 to-background p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="rounded-full">
              <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold truncate max-w-[400px]">{title}</h1>
              {url && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Link2 className="h-3 w-3" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[300px]">
                    {url}
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4 mr-4">
              <div className="text-center">
                <div className={cn("text-2xl font-bold", getScoreColor(content_summary.overall_score))}>
                  {content_summary.overall_score}
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.word_count || 0}</div>
                <div className="text-xs text-muted-foreground">Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{contentElements?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Blocks</div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button size="sm" className="bg-primary">
              <Save className="mr-2 h-4 w-4" /> Save Report
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="structure" className="gap-2">
              <List className="h-4 w-4" />
              Structure
            </TabsTrigger>
            <TabsTrigger value="eeat" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              E-E-A-T
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <Link2 className="h-4 w-4" />
              Links
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Hash className="h-4 w-4" />
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="mt-4">
            <div className="grid grid-cols-12 gap-6">
              {/* Left: Content Editor */}
              <div className="col-span-12 lg:col-span-8">
                <RichContentEditor
                  htmlContent={htmlContent}
                  rawMainHtml={rawMainHtml}
                  contentElements={contentElements}
                  sentences={sentence_analysis}
                  links={links}
                  baseUrl={url}
                  onSentenceClick={setSelectedSentence}
                  statistics={{
                    wordCount: statistics.word_count || 0,
                    characterCount: statistics.character_count || 0,
                    sentenceCount: statistics.total_sentences,
                  }}
                />
              </div>

              {/* Right: Analysis Panel */}
              <div className="col-span-12 lg:col-span-4 space-y-4">
                {/* Score Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Analysis Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-4">
                      <div className="relative h-28 w-28">
                        <svg className="h-28 w-28 transform -rotate-90">
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-muted/20"
                          />
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${(content_summary.overall_score / 100) * 301.59} 301.59`}
                            className={getScoreBg(content_summary.overall_score)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={cn("text-3xl font-bold", getScoreColor(content_summary.overall_score))}>
                            {content_summary.overall_score}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {content_summary.overall_score >= 80 ? 'Excellent' : 
                             content_summary.overall_score >= 60 ? 'Good' : 
                             content_summary.overall_score >= 40 ? 'Fair' : 'Needs Work'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>E-E-A-T Score</span>
                          <span className="font-medium">{eeatAverage}/100</span>
                        </div>
                        <Progress value={eeatAverage} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Content Quality</span>
                          <span className="font-medium">{statistics.green_percentage}%</span>
                        </div>
                        <Progress value={statistics.green_percentage} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Issues Breakdown */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Sentence Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Good</span>
                      </div>
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        {statistics.green_count}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Needs Improvement</span>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                        {statistics.orange_count}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20">
                      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Critical</span>
                      </div>
                      <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200">
                        {statistics.red_count}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Suggestion Panel */}
                <SuggestionPanel sentence={selectedSentence} />

                {/* Priority Actions */}
                {priority_actions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Priority Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {priority_actions.slice(0, 5).map((action, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs flex-shrink-0",
                                action.impact === 'high' && 'border-rose-200 text-rose-700',
                                action.impact === 'medium' && 'border-amber-200 text-amber-700',
                                action.impact === 'low' && 'border-blue-200 text-blue-700'
                              )}
                            >
                              {action.priority}
                            </Badge>
                            <span className="text-muted-foreground">{action.action}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Structure Tab - Shows headings and content structure */}
          <TabsContent value="structure" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Headings Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heading1 className="h-5 w-5 text-purple-500" />
                    Heading Structure
                  </CardTitle>
                  <CardDescription>
                    All headings found in the content ({totalHeadings} total)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {headings?.h1 && headings.h1.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-purple-600">H1</Badge>
                            <span className="text-sm text-muted-foreground">{headings.h1.length} found</span>
                          </div>
                          <ul className="space-y-1">
                            {headings.h1.map((h, i) => (
                              <li key={i} className="text-lg font-bold p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {headings?.h2 && headings.h2.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-indigo-600">H2</Badge>
                            <span className="text-sm text-muted-foreground">{headings.h2.length} found</span>
                          </div>
                          <ul className="space-y-1">
                            {headings.h2.map((h, i) => (
                              <li key={i} className="text-base font-semibold p-2 bg-indigo-50 dark:bg-indigo-950/20 rounded pl-4">
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {headings?.h3 && headings.h3.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-600">H3</Badge>
                            <span className="text-sm text-muted-foreground">{headings.h3.length} found</span>
                          </div>
                          <ul className="space-y-1">
                            {headings.h3.map((h, i) => (
                              <li key={i} className="text-sm font-medium p-2 bg-blue-50 dark:bg-blue-950/20 rounded pl-6">
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {headings?.h4 && headings.h4.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-cyan-600">H4</Badge>
                            <span className="text-sm text-muted-foreground">{headings.h4.length} found</span>
                          </div>
                          <ul className="space-y-1">
                            {headings.h4.map((h, i) => (
                              <li key={i} className="text-sm p-2 bg-cyan-50 dark:bg-cyan-950/20 rounded pl-8">
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {totalHeadings === 0 && (
                        <p className="text-muted-foreground text-center py-8">
                          No headings found in the content
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Content Structure Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5 text-blue-500" />
                    Content Blocks
                  </CardTitle>
                  <CardDescription>
                    Content structure breakdown ({contentElements?.length || 0} blocks)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Block type stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Heading2 className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Headings</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600">{totalHeadings}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Type className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium">Paragraphs</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-600">{paragraphCount}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-center gap-2 mb-1">
                          <List className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Lists</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{listCount}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Quote className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium">Blockquotes</span>
                        </div>
                        <div className="text-2xl font-bold text-amber-600">{blockquoteCount}</div>
                      </div>
                    </div>

                    {/* Content elements list */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3">Content Flow</h4>
                      <ScrollArea className="h-[250px]">
                        <div className="space-y-2">
                          {contentElements?.map((element, index) => (
                            <div 
                              key={index}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded text-sm',
                                element.type === 'heading' && 'bg-purple-50 dark:bg-purple-950/20',
                                element.type === 'paragraph' && 'bg-gray-50 dark:bg-gray-950/20',
                                element.type === 'list' && 'bg-blue-50 dark:bg-blue-950/20',
                                element.type === 'blockquote' && 'bg-amber-50 dark:bg-amber-950/20'
                              )}
                            >
                              <Badge variant="outline" className="text-xs">
                                {element.tag.toUpperCase()}
                              </Badge>
                              <span className="truncate flex-1">
                                {element.text.substring(0, 60)}{element.text.length > 60 ? '...' : ''}
                              </span>
                              {element.children && (
                                <Badge variant="secondary" className="text-xs">
                                  {element.children.length} items
                                </Badge>
                              )}
                            </div>
                          ))}
                          {(!contentElements || contentElements.length === 0) && (
                            <p className="text-muted-foreground text-center py-4">
                              No content blocks found
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* E-E-A-T Tab */}
          <TabsContent value="eeat" className="mt-4">
            <EEATReport scores={eeat_scores} />
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-emerald-500" />
                    Internal Links
                  </CardTitle>
                  <CardDescription>
                    Links pointing to other pages on your site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-emerald-600 mb-4">
                    {link_analysis?.internal_links || 0}
                  </div>
                  {links && links.filter(l => l.type === 'internal').length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <ul className="space-y-2">
                        {links.filter(l => l.type === 'internal').map((link, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/20">
                            <Link2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{link.text}</div>
                              <div className="text-xs text-muted-foreground truncate">{link.href}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">No internal links found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-violet-500" />
                    External Links
                  </CardTitle>
                  <CardDescription>
                    Links pointing to other websites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-violet-600 mb-4">
                    {link_analysis?.external_links || 0}
                  </div>
                  {links && links.filter(l => l.type === 'external').length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <ul className="space-y-2">
                        {links.filter(l => l.type === 'external').map((link, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2 p-2 rounded bg-violet-50 dark:bg-violet-950/20">
                            <ExternalLink className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{link.text}</div>
                              <a 
                                href={link.href} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground truncate block hover:underline"
                              >
                                {link.href}
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">No external links found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-4">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <span>Word Count</span>
                    </div>
                    <span className="text-xl font-bold">{statistics.word_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>Character Count</span>
                    </div>
                    <span className="text-xl font-bold">{statistics.character_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Sentences</span>
                    </div>
                    <span className="text-xl font-bold">{statistics.total_sentences}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-muted-foreground" />
                      <span>Content Blocks</span>
                    </div>
                    <span className="text-xl font-bold">{contentElements?.length || 0}</span>
                  </div>
                  {statistics.readability_score !== undefined && (
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span>Readability Score</span>
                      <span className="text-xl font-bold">{statistics.readability_score}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Link Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                    <span className="text-emerald-700 dark:text-emerald-400">Internal Links</span>
                    <span className="text-xl font-bold text-emerald-600">{link_analysis?.internal_links || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-violet-50 dark:bg-violet-950/20 rounded-lg">
                    <span className="text-violet-700 dark:text-violet-400">External Links</span>
                    <span className="text-xl font-bold text-violet-600">{link_analysis?.external_links || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Total Links</span>
                    <span className="text-xl font-bold">
                      {(link_analysis?.internal_links || 0) + (link_analysis?.external_links || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Unique Domains</span>
                    <span className="text-xl font-bold">{link_analysis?.unique_domains || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Detected Topic</div>
                    <Badge variant="secondary" className="text-sm">
                      {content_summary.detected_topic}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Target Audience</div>
                    <p className="text-sm">{content_summary.target_audience}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expertise Required</div>
                    <Badge 
                      variant="outline"
                      className={cn(
                        content_summary.expertise_required === 'YMYL' && 'border-rose-200 text-rose-700',
                        content_summary.expertise_required === 'high' && 'border-amber-200 text-amber-700',
                        content_summary.expertise_required === 'medium' && 'border-blue-200 text-blue-700',
                        content_summary.expertise_required === 'low' && 'border-emerald-200 text-emerald-700',
                      )}
                    >
                      {content_summary.expertise_required}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expert Verdict</div>
                    <p className="text-sm italic">{content_summary.expert_verdict}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
