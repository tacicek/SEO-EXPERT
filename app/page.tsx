'use client';

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Globe, Zap, Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { useAnalyzeContent } from "@/lib/hooks/use-analysis";
import { useAnalysisStore } from "@/lib/store/analysis-store";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import Link from "next/link";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { mutate: analyzeContent, isPending } = useAnalyzeContent();
  const { setCurrentAnalysis, setIsAnalyzing } = useAnalysisStore();

  const handleAnalyze = () => {
    if (!url.trim()) return;

    // Check if user is logged in
    if (!user) {
      // Redirect to login with return URL
      sessionStorage.setItem('returnUrl', '/');
      sessionStorage.setItem('pendingAnalysisUrl', url.trim());
      router.push('/auth/login');
      return;
    }

    setIsAnalyzing(true);

    analyzeContent(
      { url: url.trim() },
      {
        onSuccess: (response) => {
          if (response.data) {
            setCurrentAnalysis(response.data);
            setIsAnalyzing(false);
            router.push('/editor');
          }
        },
        onError: (error) => {
          console.error('Analysis error:', error);
          setIsAnalyzing(false);
          alert(`Analysis failed: ${error.message}`);
        },
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPending) {
      handleAnalyze();
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        {/* Hero Section */}
        <section className="py-12 flex flex-col items-center text-center gap-6">
          <Badge variant="secondary" className="px-4 py-1 text-sm">
            Seomind - AI-Powered SEO Expert
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
            Transform Your Content into <span className="text-primary">Expert Authority</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Analyze your content with the depth of a 15-year SEO strategist.
            Get sentence-level feedback based on E-E-A-T principles, not just keyword counts.
          </p>

          <div className="w-full max-w-2xl mt-4 p-2 bg-card border rounded-xl shadow-sm flex gap-2">
            <Input
              placeholder="Enter URL to analyze (e.g., https://example.com/blog-post)"
              className="h-12 border-0 bg-transparent focus-visible:ring-0 text-lg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isPending}
            />
            <Button
              size="lg"
              className="h-12 px-8"
              onClick={handleAnalyze}
              disabled={isPending || !url.trim()}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {!authLoading && !user && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg flex items-center gap-3 max-w-2xl">
              <Lock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Sign in required to analyze content.{' '}
                <Link href="/auth/login" className="font-medium underline hover:no-underline">
                  Login
                </Link>{' '}
                or{' '}
                <Link href="/auth/register" className="font-medium underline hover:no-underline">
                  create an account
                </Link>{' '}
                to get started.
              </p>
            </div>
          )}

          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Instant Analysis</span>
            <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> E-E-A-T Focused</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Actionable Insights</span>
          </div>
        </section>

        {/* Technical SEO Section */}
        <section className="py-8">
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">🔧 Technical SEO Analyzer</CardTitle>
                  <CardDescription className="text-base">
                    Comprehensive on-page SEO analysis for any URL
                  </CardDescription>
                </div>
                <Link href="/test-analyzer">
                  <Button size="lg" variant="default">
                    Try Analyzer <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📊</span>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Meta Tags Analysis</div>
                    <div className="text-sm text-muted-foreground">Title, description, OG tags, canonical</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Content Quality</div>
                    <div className="text-sm text-muted-foreground">Headings, images, schema markup</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">⚡</span>
                  </div>
                  <div>
                    <div className="font-medium mb-1">Performance</div>
                    <div className="text-sm text-muted-foreground">URL structure, mobile-friendly</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Features Section */}
        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>1. Enter URL</CardTitle>
                <CardDescription>
                  Paste the URL of any article or blog post you want to analyze
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>2. AI Analysis</CardTitle>
                <CardDescription>
                  Our AI analyzes each sentence based on E-E-A-T principles and expert knowledge
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>3. Get Insights</CardTitle>
                <CardDescription>
                  Receive color-coded sentence feedback and actionable recommendations
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8">
          <div className="grid gap-4 md:grid-cols-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">30s</div>
              <div className="text-sm text-muted-foreground">Avg. Analysis Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">E-E-A-T</div>
              <div className="text-sm text-muted-foreground">Google Standards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Articles Analyzed</div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
