'use client';

import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/db/supabase";
import { Loader2, BarChart3, Globe, Lock } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function GSCPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sites, setSites] = useState<any[]>([]);
    const [selectedSite, setSelectedSite] = useState<string>('');
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [providerToken, setProviderToken] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.provider_token) {
                setProviderToken(session.provider_token);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
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

    const fetchSites = async () => {
        if (!providerToken) return;
        setLoading(true);
        try {
            const res = await fetch('/api/gsc/sites', {
                headers: {
                    'Authorization': `Bearer ${providerToken}`
                }
            });
            const data = await res.json();
            if (data.sites) {
                setSites(data.sites);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        if (!selectedSite || !providerToken) return;
        setLoading(true);
        try {
            // Last 30 days
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
            if (data.data) {
                setAnalytics(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (providerToken) {
            fetchSites();
        }
    }, [providerToken]);

    useEffect(() => {
        if (selectedSite) {
            fetchAnalytics();
        }
    }, [selectedSite]);

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight">Google Search Console Integration</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Connect your Google account to view your site's performance, index status, and more.
                    </p>
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
                                We need fresh permissions to access Search Console. Please sign out and sign in again with Google.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleGoogleLogin} variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
                                Reconnect Google
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Property</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select onValueChange={setSelectedSite} value={selectedSite}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a website" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sites.map((site) => (
                                            <SelectItem key={site.siteUrl} value={site.siteUrl}>
                                                {site.siteUrl} ({site.permissionLevel})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {selectedSite && (
                            <div className="grid grid-cols-1 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Top Queries (Last 30 Days)</CardTitle>
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
                                                        <TableHead>Clicks</TableHead>
                                                        <TableHead>Impressions</TableHead>
                                                        <TableHead>CTR</TableHead>
                                                        <TableHead>Position</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {analytics.slice(0, 10).map((row, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell className="font-medium">{row.keys[0]}</TableCell>
                                                            <TableCell>{row.clicks}</TableCell>
                                                            <TableCell>{row.impressions}</TableCell>
                                                            <TableCell>{(row.ctr * 100).toFixed(2)}%</TableCell>
                                                            <TableCell>{row.position.toFixed(1)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
