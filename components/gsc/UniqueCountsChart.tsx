'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UniqueCountsChartProps {
    data: {
        queryTrend: Array<{ date: string; count: number; clicks: number; impressions: number }>;
        pageTrend: Array<{ date: string; count: number; clicks: number; impressions: number }>;
        topQueriesRanking: Array<{ date: string; top10Count: number; top3Count: number }>;
    };
}

export function UniqueCountsChart({ data }: UniqueCountsChartProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const queryChartData = data.queryTrend.map(d => ({
        date: formatDate(d.date),
        queries: d.count,
    }));

    const pageChartData = data.pageTrend.map(d => ({
        date: formatDate(d.date),
        pages: d.count,
    }));

    const rankingData = data.topQueriesRanking.map(d => ({
        date: formatDate(d.date),
        top3: d.top3Count,
        top10: d.top10Count,
    }));

    // Calculate stats
    const latestQueries = data.queryTrend[data.queryTrend.length - 1]?.count || 0;
    const firstQueries = data.queryTrend[0]?.count || 0;
    const queryGrowth = firstQueries > 0 ? ((latestQueries - firstQueries) / firstQueries * 100).toFixed(1) : '0';

    const latestPages = data.pageTrend[data.pageTrend.length - 1]?.count || 0;
    const firstPages = data.pageTrend[0]?.count || 0;
    const pageGrowth = firstPages > 0 ? ((latestPages - firstPages) / firstPages * 100).toFixed(1) : '0';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Unique Ranking Keywords & Pages</CardTitle>
                <CardDescription>
                    Track the number of unique queries and pages ranking over time
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="queries" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="queries">Queries</TabsTrigger>
                        <TabsTrigger value="pages">Pages</TabsTrigger>
                        <TabsTrigger value="ranking">Top Positions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="queries" className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                                <div className="text-2xl font-bold">{latestQueries.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">Unique queries ranking</div>
                            </div>
                            <div className={`text-lg font-semibold ${Number(queryGrowth) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {Number(queryGrowth) >= 0 ? '+' : ''}{queryGrowth}%
                            </div>
                        </div>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={queryChartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Area 
                                        type="monotone" 
                                        dataKey="queries" 
                                        stroke="#8b5cf6" 
                                        fill="#8b5cf6" 
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </TabsContent>

                    <TabsContent value="pages" className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                                <div className="text-2xl font-bold">{latestPages.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">Unique pages ranking</div>
                            </div>
                            <div className={`text-lg font-semibold ${Number(pageGrowth) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {Number(pageGrowth) >= 0 ? '+' : ''}{pageGrowth}%
                            </div>
                        </div>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={pageChartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Area 
                                        type="monotone" 
                                        dataKey="pages" 
                                        stroke="#10b981" 
                                        fill="#10b981" 
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </TabsContent>

                    <TabsContent value="ranking" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <div className="text-2xl font-bold text-amber-600">
                                    {(rankingData[rankingData.length - 1]?.top3 || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">Top 3 positions</div>
                            </div>
                            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <div className="text-2xl font-bold text-blue-600">
                                    {(rankingData[rankingData.length - 1]?.top10 || 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">Top 10 positions</div>
                            </div>
                        </div>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={rankingData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Area 
                                        type="monotone" 
                                        dataKey="top3" 
                                        stroke="#f59e0b" 
                                        fill="#f59e0b" 
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                        name="Top 3"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="top10" 
                                        stroke="#3b82f6" 
                                        fill="#3b82f6" 
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                        name="Top 10"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}



