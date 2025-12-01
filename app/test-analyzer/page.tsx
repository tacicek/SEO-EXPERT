'use client';

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Search, AlertTriangle, CheckCircle2, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TestAnalyzerPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [pages, setPages] = useState<string[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [progress, setProgress] = useState(0);
    const [selectedResult, setSelectedResult] = useState<any>(null);

    const fetchSitemap = async () => {
        setLoading(true);
        setPages([]);
        setResults([]);
        setSelectedResult(null);
        try {
            // If it's a sitemap URL
            if (url.includes('sitemap') || url.endsWith('.xml')) {
                const res = await fetch('/api/utils/sitemap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const data = await res.json();
                if (data.urls) {
                    setPages(data.urls);
                } else {
                    throw new Error(data.error || 'No URLs found');
                }
            } else {
                // Just a single page
                setPages([url]);
            }
        } catch (error) {
            console.error(error);
            // Fallback to single page if sitemap fetch fails
            setPages([url]);
        } finally {
            setLoading(false);
        }
    };

    const runAudit = async () => {
        setAnalyzing(true);
        setProgress(0);
        setResults([]);

        let completed = 0;
        const newResults = [];

        for (const pageUrl of pages) {
            try {
                const res = await fetch('/api/technical-analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: pageUrl })
                });
                const data = await res.json();
                newResults.push({ url: pageUrl, ...data, status: res.ok ? 'success' : 'error' });
            } catch (error) {
                newResults.push({ url: pageUrl, status: 'error', error: 'Failed to analyze' });
            }
            completed++;
            setProgress((completed / pages.length) * 100);
            setResults([...newResults]);
        }
        setAnalyzing(false);
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-orange-500';
        return 'text-red-500';
    };

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight">Technical SEO Audit</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Enter your domain or sitemap URL to perform a comprehensive technical analysis of your website.
                    </p>
                </div>

                {/* Input Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Start Audit</CardTitle>
                        <CardDescription>Enter URL (e.g., https://example.com or https://example.com/sitemap.xml)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Input
                                placeholder="https://example.com/sitemap.xml"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={fetchSitemap} disabled={loading || analyzing || !url}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Fetch Pages
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pages Found & Progress */}
                {pages.length > 0 && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Analysis Queue ({pages.length} pages)</CardTitle>
                                {!analyzing && results.length === 0 && (
                                    <Button onClick={runAudit}>Start Analysis</Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {analyzing && (
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Analyzing...</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                            )}

                            {!analyzing && results.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Results List */}
                                    <div className="md:col-span-1 border-r pr-4">
                                        <ScrollArea className="h-[600px]">
                                            <div className="space-y-2">
                                                {results.map((res, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedResult(res)}
                                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedResult === res ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <Badge variant={res.score?.overall >= 90 ? 'default' : 'secondary'} className={res.score?.overall < 70 ? 'bg-red-100 text-red-800 hover:bg-red-100' : ''}>
                                                                {res.score?.overall || 0}
                                                            </Badge>
                                                            {res.issues?.length > 0 && (
                                                                <span className="text-xs text-red-500 flex items-center">
                                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                                    {res.issues.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm truncate font-medium">{res.url}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    {/* Detail View */}
                                    <div className="md:col-span-2">
                                        {selectedResult ? (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-xl font-bold truncate max-w-[400px]">{selectedResult.url}</h2>
                                                    <div className={`text-2xl font-bold ${getScoreColor(selectedResult.score?.overall)}`}>
                                                        Score: {selectedResult.score?.overall}/100
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                                                        <div className="text-2xl font-bold">{selectedResult.content?.word_count || 0}</div>
                                                        <div className="text-xs text-muted-foreground">Words</div>
                                                    </div>
                                                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                                                        <div className="text-2xl font-bold">{selectedResult.links?.internal || 0}</div>
                                                        <div className="text-xs text-muted-foreground">Internal Links</div>
                                                    </div>
                                                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                                                        <div className="text-2xl font-bold">{selectedResult.images?.missing_alt || 0}</div>
                                                        <div className="text-xs text-muted-foreground">Missing Alt</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-lg">Issues & Recommendations</h3>
                                                    {selectedResult.issues?.length === 0 ? (
                                                        <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 rounded-lg">
                                                            <CheckCircle2 className="h-5 w-5" />
                                                            <span>No issues found. This page is technically optimized!</span>
                                                        </div>
                                                    ) : (
                                                        selectedResult.issues?.map((issue: any, idx: number) => (
                                                            <Card key={idx} className="border-l-4 border-l-red-500">
                                                                <CardHeader className="pb-2">
                                                                    <div className="flex items-start justify-between">
                                                                        <CardTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                                                                            <AlertTriangle className="h-4 w-4" />
                                                                            {issue.message}
                                                                        </CardTitle>
                                                                        <Badge variant="outline">{issue.impact}</Badge>
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="space-y-3 text-sm">
                                                                    <div>
                                                                        <span className="font-semibold text-foreground">Why it matters:</span>
                                                                        <p className="text-muted-foreground mt-1">{issue.explanation}</p>
                                                                    </div>
                                                                    <div className="bg-muted p-3 rounded-md">
                                                                        <span className="font-semibold text-primary">How to fix:</span>
                                                                        <p className="mt-1">{issue.fix}</p>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                                Select a page from the list to view details
                                            </div>
                                        )}
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
