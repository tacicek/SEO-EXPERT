'use client';

import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/lib/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getRecentAnalyses, getSites, getUserStats, type Analysis, type Site, type DashboardStats } from "@/lib/api/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Plus, ArrowRight, BarChart3, Globe, FileText, 
  Search, RefreshCw, AlertTriangle, CheckCircle2,
  Heading, Image, Link2, Code, BookOpen, Zap
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TechnicalScoreCard, 
  IssuesOverview, 
  CategoryBreakdown, 
  QuickWins, 
  SiteHealthGauge,
  ScoreTrend 
} from "@/components/dashboard";
import type { TechnicalSEOAnalysis, DashboardTechnicalData } from "@/lib/types/technical-seo";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Technical SEO states
  const [urlToAnalyze, setUrlToAnalyze] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [technicalData, setTechnicalData] = useState<DashboardTechnicalData | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<TechnicalSEOAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      const [analysesData, sitesData, statsData] = await Promise.all([
        getRecentAnalyses(user.id),
        getSites(user.id),
        getUserStats(user.id)
      ]);
      setAnalyses(analysesData);
      setSites(sitesData);
      setStats(statsData);

      // Fetch technical dashboard data
      const techResponse = await fetch('/api/dashboard/technical');
      if (techResponse.ok) {
        const techData = await techResponse.json();
        if (techData.success && techData.data) {
          // Transform data for dashboard
          setTechnicalData({
            site_health: {
              overall_score: techData.data.stats.avg_score || 0,
              meta_score: 0,
              headings_score: 0,
              images_score: 0,
              schema_score: 0,
              content_score: 0,
              url_score: 0,
              total_issues: techData.data.stats.total_issues || 0,
              high_issues: techData.data.stats.high_priority_issues || 0,
              medium_issues: 0,
              low_issues: 0,
              last_analyzed: techData.data.recentAnalyses?.[0]?.created_at || null,
            },
            issues_by_category: techData.data.issuesByCategory || {
              meta: 0, headings: 0, images: 0, url: 0, schema: 0, content: 0
            },
            recent_issues: [],
            score_trend: techData.data.scoreTrend || [],
            quick_wins: [],
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router, fetchDashboardData]);

  // Run technical analysis
  const runTechnicalAnalysis = async () => {
    if (!urlToAnalyze) return;
    
    setAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const response = await fetch('/api/dashboard/technical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToAnalyze }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      setLastAnalysis(data.data.analysis);
      setTechnicalData(data.data.dashboard);
      setUrlToAnalyze('');
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Technical analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) return null;

  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user.user_metadata.full_name || user.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchDashboardData}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button asChild>
              <Link href="/">
                <Plus className="mr-2 h-4 w-4" /> New Analysis
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick URL Analysis */}
        <Card className="border-2 border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Quick Technical SEO Analysis
            </CardTitle>
            <CardDescription>
              Enter a URL to get instant technical SEO insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="https://example.com"
                value={urlToAnalyze}
                onChange={(e) => setUrlToAnalyze(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && runTechnicalAnalysis()}
              />
              <Button 
                onClick={runTechnicalAnalysis} 
                disabled={analyzing || !urlToAnalyze}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            {analysisError && (
              <p className="mt-2 text-sm text-rose-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {analysisError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAnalyses || 0}</div>
              <p className="text-xs text-muted-foreground">Lifetime content checks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageScore || 0}%</div>
              <p className="text-xs text-muted-foreground">Across all content</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{technicalData?.site_health.total_issues || 0}</div>
              <p className="text-xs text-muted-foreground">
                {technicalData?.site_health.high_issues || 0} critical
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits</CardTitle>
              <div className="text-xs font-bold text-muted-foreground">
                {stats?.creditsUsed}/{stats?.creditsTotal}
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={((stats?.creditsUsed || 0) / (stats?.creditsTotal || 100)) * 100} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground">
                {stats?.creditsTotal ? stats.creditsTotal - stats.creditsUsed : 0} remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Technical SEO Section */}
        {(technicalData || lastAnalysis) && (
          <>
            <div className="flex items-center gap-2 mt-4">
              <h2 className="text-xl font-semibold">Technical SEO Overview</h2>
              <Badge variant="secondary">Python Backend</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Site Health Gauge */}
              <SiteHealthGauge 
                score={technicalData?.site_health.overall_score || lastAnalysis?.score.overall || 0}
                lastAnalyzed={technicalData?.site_health.last_analyzed || lastAnalysis?.analyzed_at}
              />

              {/* Issues Overview */}
              <IssuesOverview 
                high={technicalData?.site_health.high_issues || 0}
                medium={technicalData?.site_health.medium_issues || 0}
                low={technicalData?.site_health.low_issues || 0}
                total={technicalData?.site_health.total_issues || 0}
              />

              {/* Score Trend */}
              <ScoreTrend data={technicalData?.score_trend || []} />
            </div>

            {/* Score Cards Grid */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <TechnicalScoreCard 
                title="Meta Tags"
                score={lastAnalysis?.score.meta || technicalData?.site_health.meta_score || 0}
                icon={<FileText className="h-4 w-4" />}
                description="Title, description"
              />
              <TechnicalScoreCard 
                title="Headings"
                score={lastAnalysis?.score.headings || technicalData?.site_health.headings_score || 0}
                icon={<Heading className="h-4 w-4" />}
                description="H1-H6 structure"
              />
              <TechnicalScoreCard 
                title="Images"
                score={lastAnalysis?.score.images || technicalData?.site_health.images_score || 0}
                icon={<Image className="h-4 w-4" />}
                description="Alt text, optimization"
              />
              <TechnicalScoreCard 
                title="URL"
                score={lastAnalysis?.score.url || technicalData?.site_health.url_score || 0}
                icon={<Link2 className="h-4 w-4" />}
                description="URL structure"
              />
              <TechnicalScoreCard 
                title="Schema"
                score={lastAnalysis?.score.schema || technicalData?.site_health.schema_score || 0}
                icon={<Code className="h-4 w-4" />}
                description="Structured data"
              />
              <TechnicalScoreCard 
                title="Content"
                score={lastAnalysis?.score.content_quality || technicalData?.site_health.content_score || 0}
                icon={<BookOpen className="h-4 w-4" />}
                description="Readability"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Category Breakdown */}
              <CategoryBreakdown 
                meta={technicalData?.issues_by_category.meta || 0}
                headings={technicalData?.issues_by_category.headings || 0}
                images={technicalData?.issues_by_category.images || 0}
                url={technicalData?.issues_by_category.url || 0}
                schema={technicalData?.issues_by_category.schema || 0}
                content={technicalData?.issues_by_category.content || 0}
              />

              {/* Quick Wins */}
              <QuickWins wins={technicalData?.quick_wins || []} />
            </div>
          </>
        )}

        {/* Content & Sites Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
          {/* Recent Analyses */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Content Analyses</CardTitle>
              <CardDescription>Your latest content evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analyses yet.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/">Start your first analysis</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div 
                      key={analysis.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="font-medium truncate max-w-[300px]">
                          {analysis.title || analysis.url}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{analysis.url}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={cn(
                            "text-lg font-bold",
                            (analysis.overall_score || 0) >= 80 && "text-emerald-500",
                            (analysis.overall_score || 0) >= 60 && (analysis.overall_score || 0) < 80 && "text-amber-500",
                            (analysis.overall_score || 0) < 60 && "text-rose-500"
                          )}>
                            {analysis.overall_score || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          asChild
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Link href={`/editor?id=${analysis.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Sites */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Connected Sites</CardTitle>
              <CardDescription>Manage your web properties</CardDescription>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No sites connected yet.</p>
                  <Button variant="outline" size="sm">
                    <Globe className="mr-2 h-4 w-4" /> Connect Site
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sites.map((site) => (
                    <div 
                      key={site.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{site.name}</div>
                          <div className="text-xs text-muted-foreground">{site.domain}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Last Analysis Details */}
        {lastAnalysis && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Latest Analysis Details
              </CardTitle>
              <CardDescription>
                {lastAnalysis.url} • Analyzed {new Date(lastAnalysis.analyzed_at).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Meta Info */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Meta Tags
                  </h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-muted-foreground">Title:</span>
                      <p className="truncate">{lastAnalysis.meta?.title?.value || 'Missing'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Description:</span>
                      <p className="truncate">{lastAnalysis.meta?.description?.value || 'Missing'}</p>
                    </div>
                  </div>
                </div>

                {/* Content Quality */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Content Quality
                  </h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Word Count:</span>
                      <span>{lastAnalysis.content_quality?.word_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Readability:</span>
                      <span>{lastAnalysis.content_quality?.readability_level || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Flesch Score:</span>
                      <span>{lastAnalysis.content_quality?.flesch_reading_ease || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Schema */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Code className="h-4 w-4" /> Structured Data
                  </h4>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Has Schema:</span>
                      <Badge variant={lastAnalysis.schema_markup?.has_schema ? "default" : "destructive"}>
                        {lastAnalysis.schema_markup?.has_schema ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Types Found:</span>
                      <span>{lastAnalysis.schema_markup?.schema_types?.join(', ') || 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {lastAnalysis.recommendations && lastAnalysis.recommendations.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3">Top Recommendations</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {lastAnalysis.recommendations.slice(0, 4).map((rec, i) => (
                      <div 
                        key={i}
                        className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm"
                      >
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
