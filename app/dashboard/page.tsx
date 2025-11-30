'use client';

import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/lib/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRecentAnalyses, getSites, getUserStats, type Analysis, type Site, type DashboardStats } from "@/lib/api/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowRight, BarChart3, Globe, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
            return;
        }

        if (user) {
            const fetchData = async () => {
                try {
                    const [analysesData, sitesData, statsData] = await Promise.all([
                        getRecentAnalyses(user.id),
                        getSites(user.id),
                        getUserStats(user.id)
                    ]);
                    setAnalyses(analysesData);
                    setSites(sitesData);
                    setStats(statsData);
                } catch (error) {
                    console.error('Failed to fetch dashboard data:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }
    }, [user, authLoading, router]);

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
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back, {user.user_metadata.full_name || user.email}</p>
                    </div>
                    <Button asChild>
                        <Link href="/">
                            <Plus className="mr-2 h-4 w-4" /> New Analysis
                        </Link>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
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
                            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
                            <div className="text-xs font-bold text-muted-foreground">
                                {stats?.creditsUsed}/{stats?.creditsTotal}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Progress value={((stats?.creditsUsed || 0) / (stats?.creditsTotal || 100)) * 100} className="h-2 mb-2" />
                            <p className="text-xs text-muted-foreground">
                                {stats?.creditsTotal ? stats.creditsTotal - stats.creditsUsed : 0} credits remaining
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Recent Analyses */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Recent Analyses</CardTitle>
                            <CardDescription>Your latest content evaluations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analyses.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No analyses yet. Start your first analysis!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {analyses.map((analysis) => (
                                        <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex flex-col gap-1">
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
                                                    <div className="text-lg font-bold">
                                                        {analysis.overall_score || 0}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">Score</div>
                                                </div>
                                                <Button variant="ghost" size="icon" asChild>
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
                                    <p className="text-muted-foreground mb-4">No sites connected yet.</p>
                                    <Button variant="outline" size="sm">
                                        <Globe className="mr-2 h-4 w-4" /> Connect Site
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {sites.map((site) => (
                                        <div key={site.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                    <Globe className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{site.name}</div>
                                                    <div className="text-xs text-muted-foreground">{site.domain}</div>
                                                </div>
                                            </div>
                                            <Badge variant="secondary">Active</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
