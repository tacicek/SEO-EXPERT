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

        // Simulate analysis for now since the Python service is not connected
        setTimeout(() => {
            setLoading(false);
            setResult({
                status: 'warning',
                message: 'The Technical SEO Microservice is currently disconnected.',
                details: 'This feature requires the Python FastAPI service to be running and connected. We are working on integrating it fully.'
            });
        }, 1500);
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

                {result && (
                    <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/10">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                                <AlertTriangle className="h-5 w-5" />
                                <CardTitle className="text-lg">Service Status</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium">{result.message}</p>
                            <p className="text-sm text-muted-foreground mt-2">{result.details}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
