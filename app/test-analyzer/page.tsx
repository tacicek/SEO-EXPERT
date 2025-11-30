'use client';

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Search, AlertTriangle } from "lucide-react";

export default function TestAnalyzerPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/technical-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setResult(data);
        } catch (error: any) {
            setResult({
                status: 'error',
                message: 'Analysis Failed',
                details: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight">Technical SEO Analyzer</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Deep dive into your site's technical performance. Analyze meta tags, headings, schema markup, and more.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Run a Technical Audit</CardTitle>
                        <CardDescription>Enter a URL to check for technical SEO issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAnalyze} className="flex gap-4">
                            <Input
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                className="flex-1"
                            />
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Analyze
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {result && result.status === 'error' && (
                    <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/10">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                                <AlertTriangle className="h-5 w-5" />
                                <CardTitle className="text-lg">Error</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">{result.message}</p>
                            <p className="text-sm text-muted-foreground mt-2">{result.details}</p>
                        </CardContent>
                    </Card>
                )}

                {result && !result.status && (
                    <div className="space-y-6">
                        {/* Score Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Overall Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-primary">{result.score.overall}/100</div>
                            </CardContent>
                        </Card>

                        {/* Issues List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Issues Found</CardTitle>
                                <CardDescription>Prioritized list of technical issues</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {result.issues.length === 0 ? (
                                    <p className="text-green-600">No issues found! Great job.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {result.issues.map((issue: any, index: number) => (
                                            <li key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                                                {issue.impact === 'high' ? (
                                                    <div className="h-2 w-2 mt-2 rounded-full bg-red-500 shrink-0" />
                                                ) : issue.impact === 'medium' ? (
                                                    <div className="h-2 w-2 mt-2 rounded-full bg-orange-500 shrink-0" />
                                                ) : (
                                                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{issue.message}</p>
                                                    <span className="text-xs uppercase text-muted-foreground">{issue.impact} impact</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* Meta Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Meta Tags</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-1">Title</div>
                                        <div className="font-medium break-words">{result.meta.title.value || <span className="text-red-500">Missing</span>}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{result.meta.title.length} chars</div>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-1">Description</div>
                                        <div className="font-medium break-words">{result.meta.description.value || <span className="text-red-500">Missing</span>}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{result.meta.description.length} chars</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
