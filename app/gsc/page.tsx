'use client';

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/db/supabase";
import { 
    Loader2, BarChart3, Globe, TrendingUp, Download, 
    Search, Calendar, Tag, MousePointerClick, Eye, Hash
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TrendChart, CTRCurveChart, BrandedChart, UniqueCountsChart } from "@/components/gsc";
import { Badge } from "@/components/ui/badge";

export default function GSCPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sites, setSites] = useState<any[]>([]);
    const [selectedSite, setSelectedSite] = useState<string>('');
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [providerToken, setProviderToken] = useState<string | null>(null);
    
    // Date range
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    // Brand terms for analysis
    const [brandTerms, setBrandTerms] = useState<string>('');
    
    // Data states
    const [trendData, setTrendData] = useState<any[]>([]);
    const [ctrCurveData, setCtrCurveData] = useState<any>(null);
    const [brandedData, setBrandedData] = useState<any>(null);
    const [uniqueCountsData, setUniqueCountsData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.provider_token) {
                setProviderToken(session.provider_token);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.provider_token) {
                setProviderToken(session.provider_token);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/webmasters.readonly',
                redirectTo: `${window.location.origin}/gsc`,
            },
        });
    };

    const fetchSites = useCallback(async () => {
        if (!providerToken) return;
        setLoading(true);
        try {
            const res = await fetch('/api/gsc/sites', {
                headers: { 'Authorization': `Bearer ${providerToken}` }
            });
            const data = await res.json();
            if (data.sites) setSites(data.sites);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [providerToken]);

    const fetchAnalytics = useCallback(async () => {
        if (!selectedSite || !providerToken) return;
        setLoading(true);
        try {
            const res = await fetch('/api/gsc/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${providerToken}`
                },
                body: JSON.stringify({
                    siteUrl: selectedSite,
                    startDate,
                    endDate,
                    dimensions: ['query', 'page']
                })
            });
            const data = await res.json();
            if (data.data) setAnalytics(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [selectedSite, providerToken, startDate, endDate]);

    const fetchTrends = useCallback(async () => {
        if (!selectedSite || !providerToken) return;
        try {
            const res = await fetch('/api/gsc/trends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${providerToken}`
                },
                body: JSON.stringify({ siteUrl: selectedSite, startDate, endDate })
            });
            const data = await res.json();
            if (data.data) setTrendData(data.data);
        } catch (error) {
            console.error(error);
        }
    }, [selectedSite, providerToken, startDate, endDate]);

    const fetchCTRCurve = useCallback(async () => {
        if (!selectedSite || !providerToken) return;
        try {
            const terms = brandTerms.split(',').map(t => t.trim()).filter(Boolean);
            const res = await fetch('/api/gsc/ctr-curve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${providerToken}`
                },
                body: JSON.stringify({
                    siteUrl: selectedSite,
                    startDate,
                    endDate,
                    brandTerms: terms.length > 0 ? terms : undefined
                })
            });
            const data = await res.json();
            if (data.data) setCtrCurveData(data.data);
        } catch (error) {
            console.error(error);
        }
    }, [selectedSite, providerToken, startDate, endDate, brandTerms]);

    const fetchBrandedAnalysis = useCallback(async () => {
        if (!selectedSite || !providerToken || !brandTerms) return;
        try {
            const terms = brandTerms.split(',').map(t => t.trim()).filter(Boolean);
            if (terms.length === 0) return;
            
            const res = await fetch('/api/gsc/branded', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${providerToken}`
                },
                body: JSON.stringify({
                    siteUrl: selectedSite,
                    startDate,
                    endDate,
                    brandTerms: terms
                })
            });
            const data = await res.json();
            if (data.data) setBrandedData(data.data);
        } catch (error) {
            console.error(error);
        }
    }, [selectedSite, providerToken, startDate, endDate, brandTerms]);

    const fetchUniqueCounts = useCallback(async () => {
        if (!selectedSite || !providerToken) return;
        try {
            const res = await fetch('/api/gsc/unique-counts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${providerToken}`
                },
                body: JSON.stringify({ siteUrl: selectedSite, startDate, endDate })
            });
            const data = await res.json();
            if (data.data) setUniqueCountsData(data.data);
        } catch (error) {
            console.error(error);
        }
    }, [selectedSite, providerToken, startDate, endDate]);

    const exportToCSV = async () => {
        if (!selectedSite || !providerToken) return;
        try {
            const res = await fetch('/api/gsc/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${providerToken}`
                },
                body: JSON.stringify({
                    siteUrl: selectedSite,
                    startDate,
                    endDate,
                    dimensions: ['QUERY', 'PAGE']
                })
            });
            
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gsc-export-${startDate}-${endDate}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (providerToken) fetchSites();
    }, [providerToken, fetchSites]);

    useEffect(() => {
        if (selectedSite) {
            fetchAnalytics();
            fetchTrends();
            fetchCTRCurve();
            fetchUniqueCounts();
        }
    }, [selectedSite, fetchAnalytics, fetchTrends, fetchCTRCurve, fetchUniqueCounts]);

    useEffect(() => {
        if (selectedSite && brandTerms) {
            fetchBrandedAnalysis();
        }
    }, [brandTerms, fetchBrandedAnalysis]);

    // Calculate summary stats
    const totalClicks = analytics.reduce((sum, row) => sum + row.clicks, 0);
    const totalImpressions = analytics.reduce((sum, row) => sum + row.impressions, 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition = analytics.length > 0 
        ? analytics.reduce((sum, row) => sum + row.position, 0) / analytics.length 
        : 0;

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Google Search Console</h1>
                        <p className="text-muted-foreground">
                            Analyze your site's search performance, CTR curves, and rankings
                        </p>
                    </div>
                    {selectedSite && (
                        <Button onClick={exportToCSV} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    )}
                </div>

                {!session ? (
                    <Card className="max-w-md mx-auto text-center p-8">
                        <CardHeader>
                            <CardTitle>Connect Google Account</CardTitle>
                            <CardDescription>Sign in to access your Search Console data</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleGoogleLogin} className="w-full">
                                <Globe className="mr-2 h-4 w-4" />
                                Sign in with Google
                            </Button>
                        </CardContent>
                    </Card>
                ) : !providerToken ? (
                    <Card className="max-w-md mx-auto text-center p-8 border-orange-200 bg-orange-50">
                        <CardHeader>
                            <CardTitle className="text-orange-700">Re-authentication Required</CardTitle>
                            <CardDescription className="text-orange-600">
                                Please sign out and sign in again with Google.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleGoogleLogin} variant="outline">
                                Reconnect Google
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Controls */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="lg:col-span-2">
                                        <label className="text-sm font-medium mb-2 block">Property</label>
                                        <Select onValueChange={setSelectedSite} value={selectedSite}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a website" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sites.map((site) => (
                                                    <SelectItem key={site.siteUrl} value={site.siteUrl}>
                                                        {site.siteUrl}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Start Date</label>
                                        <Input 
                                            type="date" 
                                            value={startDate} 
                                            onChange={(e) => setStartDate(e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">End Date</label>
                                        <Input 
                                            type="date" 
                                            value={endDate} 
                                            onChange={(e) => setEndDate(e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Brand Terms</label>
                                        <Input 
                                            placeholder="brand, company" 
                                            value={brandTerms}
                                            onChange={(e) => setBrandTerms(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {selectedSite && (
                            <>
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                                    <MousePointerClick className="h-5 w-5 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                                                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-500/10">
                                                    <Eye className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
                                                    <div className="text-sm text-muted-foreground">Impressions</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-amber-500/10">
                                                    <TrendingUp className="h-5 w-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold">{avgCTR.toFixed(2)}%</div>
                                                    <div className="text-sm text-muted-foreground">Avg CTR</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-violet-500/10">
                                                    <Hash className="h-5 w-5 text-violet-500" />
                                                </div>
                                                <div>
                                                    <div className="text-2xl font-bold">{avgPosition.toFixed(1)}</div>
                                                    <div className="text-sm text-muted-foreground">Avg Position</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Main Content Tabs */}
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid w-full grid-cols-5">
                                        <TabsTrigger value="overview">Overview</TabsTrigger>
                                        <TabsTrigger value="trends">Trends</TabsTrigger>
                                        <TabsTrigger value="ctr">CTR Curve</TabsTrigger>
                                        <TabsTrigger value="branded">Branded</TabsTrigger>
                                        <TabsTrigger value="queries">Top Queries</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {trendData.length > 0 && (
                                                <TrendChart data={trendData} title="Clicks Over Time" metric="clicks" />
                                            )}
                                            {uniqueCountsData && (
                                                <UniqueCountsChart data={uniqueCountsData} />
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="trends" className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {trendData.length > 0 && (
                                                <>
                                                    <TrendChart data={trendData} title="Clicks" metric="clicks" />
                                                    <TrendChart data={trendData} title="Impressions" metric="impressions" />
                                                    <TrendChart data={trendData} title="CTR" metric="ctr" />
                                                    <TrendChart data={trendData} title="Position" metric="position" />
                                                </>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="ctr" className="space-y-6">
                                        {ctrCurveData && (
                                            <CTRCurveChart 
                                                data={ctrCurveData} 
                                                showBranded={!!brandTerms && !!ctrCurveData.branded}
                                            />
                                        )}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>CTR by Position Data</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Position</TableHead>
                                                            <TableHead>Clicks</TableHead>
                                                            <TableHead>Impressions</TableHead>
                                                            <TableHead>CTR</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {ctrCurveData?.overall?.slice(0, 10).map((row: any, i: number) => (
                                                            <TableRow key={i}>
                                                                <TableCell>
                                                                    <Badge variant={row.position <= 3 ? "default" : "secondary"}>
                                                                        #{row.position}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell>{row.clicks.toLocaleString()}</TableCell>
                                                                <TableCell>{row.impressions.toLocaleString()}</TableCell>
                                                                <TableCell className="font-medium">{row.ctr.toFixed(2)}%</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="branded" className="space-y-6">
                                        {!brandTerms ? (
                                            <Card>
                                                <CardContent className="py-12 text-center">
                                                    <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                                    <h3 className="text-lg font-medium mb-2">Enter Brand Terms</h3>
                                                    <p className="text-muted-foreground max-w-md mx-auto">
                                                        Add your brand names in the "Brand Terms" field above (comma separated) 
                                                        to analyze branded vs non-branded performance.
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ) : brandedData ? (
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <BrandedChart data={brandedData} metric="clicks" />
                                                <BrandedChart data={brandedData} metric="impressions" />
                                            </div>
                                        ) : (
                                            <div className="flex justify-center py-12">
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="queries">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Top Queries</CardTitle>
                                                <CardDescription>
                                                    Your best performing search queries
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {loading && analytics.length === 0 ? (
                                                    <div className="flex justify-center p-8">
                                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    </div>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Query</TableHead>
                                                                <TableHead>Page</TableHead>
                                                                <TableHead className="text-right">Clicks</TableHead>
                                                                <TableHead className="text-right">Impressions</TableHead>
                                                                <TableHead className="text-right">CTR</TableHead>
                                                                <TableHead className="text-right">Position</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {analytics.slice(0, 25).map((row, i) => (
                                                                <TableRow key={i}>
                                                                    <TableCell className="font-medium max-w-[200px] truncate">
                                                                        {row.keys[0]}
                                                                    </TableCell>
                                                                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                                                        {row.keys[1]?.replace(selectedSite, '/')}
                                                                    </TableCell>
                                                                    <TableCell className="text-right">{row.clicks}</TableCell>
                                                                    <TableCell className="text-right">{row.impressions}</TableCell>
                                                                    <TableCell className="text-right">{(row.ctr * 100).toFixed(2)}%</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Badge variant={row.position <= 3 ? "default" : row.position <= 10 ? "secondary" : "outline"}>
                                                                            {row.position.toFixed(1)}
                                                                        </Badge>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
