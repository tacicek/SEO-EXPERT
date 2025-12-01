'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface BrandedChartProps {
    data: {
        branded: { clicks: number; impressions: number; ctr: number; position: number; queryCount: number };
        nonBranded: { clicks: number; impressions: number; ctr: number; position: number; queryCount: number };
        trend: Array<{
            date: string;
            branded: { clicks: number; impressions: number };
            nonBranded: { clicks: number; impressions: number };
        }>;
    };
    metric?: 'clicks' | 'impressions';
}

export function BrandedChart({ data, metric = 'clicks' }: BrandedChartProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatValue = (value: number) => {
        if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
        return value.toString();
    };

    const chartData = data.trend.map(d => ({
        date: formatDate(d.date),
        branded: d.branded[metric],
        nonBranded: d.nonBranded[metric],
    }));

    const totalBranded = metric === 'clicks' ? data.branded.clicks : data.branded.impressions;
    const totalNonBranded = metric === 'clicks' ? data.nonBranded.clicks : data.nonBranded.impressions;
    const total = totalBranded + totalNonBranded;
    const brandedPercent = total > 0 ? ((totalBranded / total) * 100).toFixed(1) : '0';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Branded vs Non-Branded {metric.charAt(0).toUpperCase() + metric.slice(1)}</CardTitle>
                <CardDescription>
                    {brandedPercent}% of {metric} come from branded queries
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-sm text-muted-foreground">Branded</div>
                        <div className="text-2xl font-bold text-emerald-600">
                            {formatValue(totalBranded)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {data.branded.queryCount.toLocaleString()} queries
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="text-sm text-muted-foreground">Non-Branded</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {formatValue(totalNonBranded)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {data.nonBranded.queryCount.toLocaleString()} queries
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis 
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatValue}
                            />
                            <Tooltip 
                                formatter={(value: number) => [formatValue(value), '']}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="branded" 
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                name="Branded"
                            />
                            <Line 
                                type="monotone" 
                                dataKey="nonBranded" 
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                                name="Non-Branded"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

