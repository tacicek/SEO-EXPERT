'use client';

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Save, Share2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAnalysisStore } from "@/lib/store/analysis-store";
import { ContentEditor } from "@/components/editor/ContentEditor";
import { SuggestionPanel } from "@/components/editor/SuggestionPanel";
import { EEATReport } from "@/components/reports/EEATReport";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/providers/auth-provider";

export default function EditorPage() {
  const router = useRouter();
  const { currentAnalysis, selectedSentence } = useAnalysisStore();
  const { user, loading } = useAuth();

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

  if (!user) {
    return null;
  }

  if (!currentAnalysis) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No analysis data available</p>
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { title, content_summary, sentence_analysis, eeat_scores, statistics, priority_actions } = currentAnalysis;

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Editor Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-background p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild className="rounded-full">
              <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span>Auto-saved</span>
                </div>
                <span>•</span>
                <Badge variant="secondary" className="text-xs">Draft</Badge>
                <span>•</span>
                <span>{statistics.total_sentences} sentences analyzed</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button size="sm" className="bg-primary">
              <Save className="mr-2 h-4 w-4" /> Save Report
            </Button>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
          {/* Left Panel: Content Editor */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4 overflow-hidden">
            <ContentEditor sentences={sentence_analysis} />
            <SuggestionPanel sentence={selectedSentence} />
          </div>

          {/* Right Panel: Analysis Summary */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-8 border-primary/20">
                    <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent" 
                         style={{ transform: `rotate(${(content_summary.overall_score / 100) * 360}deg)` }} />
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-bold">{content_summary.overall_score}</span>
                      <span className="text-xs text-muted-foreground">
                        {content_summary.overall_score >= 80 ? 'Excellent' : 
                         content_summary.overall_score >= 60 ? 'Good' : 
                         content_summary.overall_score >= 40 ? 'Fair' : 'Needs Work'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>E-E-A-T Score</span>
                      <span className="font-medium">
                        {Math.round((eeat_scores.experience.score + eeat_scores.expertise.score + 
                                    eeat_scores.authoritativeness.score + eeat_scores.trustworthiness.score) / 4)}/100
                      </span>
                    </div>
                    <Progress value={Math.round((eeat_scores.experience.score + eeat_scores.expertise.score + 
                                                 eeat_scores.authoritativeness.score + eeat_scores.trustworthiness.score) / 4)} 
                             className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Content Quality</span>
                      <span className="font-medium">{statistics.green_percentage}%</span>
                    </div>
                    <Progress value={statistics.green_percentage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Issues Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    <span className="font-medium">Critical Issues</span>
                  </div>
                  <Badge variant="destructive">{statistics.red_count}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Improvements</span>
                  </div>
                  <Badge variant="secondary" className="bg-orange-200 text-orange-800 hover:bg-orange-300">
                    {statistics.orange_count}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Good Sentences</span>
                  </div>
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    {statistics.green_count}
                  </Badge>
                </div>

                {priority_actions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Priority Actions</h4>
                    <ul className="space-y-2 text-sm">
                      {priority_actions.slice(0, 3).map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Badge variant="outline" className="text-xs">{action.priority}</Badge>
                          <span className="text-muted-foreground">{action.action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Tabs for Additional Reports */}
        <div className="mt-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="eeat">E-E-A-T Report</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expert Verdict</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{content_summary.expert_verdict}</p>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{statistics.word_count}</div>
                      <div className="text-xs text-muted-foreground">Words</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{statistics.total_sentences}</div>
                      <div className="text-xs text-muted-foreground">Sentences</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{content_summary.detected_topic}</div>
                      <div className="text-xs text-muted-foreground">Topic</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="eeat" className="mt-4">
              <EEATReport scores={eeat_scores} />
            </TabsContent>
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Sentences:</span>
                      <span className="font-medium">{statistics.total_sentences}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Word Count:</span>
                      <span className="font-medium">{statistics.word_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Green Sentences:</span>
                      <span className="font-medium text-green-600">{statistics.green_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Orange Sentences:</span>
                      <span className="font-medium text-orange-600">{statistics.orange_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Red Sentences:</span>
                      <span className="font-medium text-red-600">{statistics.red_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
