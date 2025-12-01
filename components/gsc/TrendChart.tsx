'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendChartProps {
    data: Array<{
        date: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
    }>;
    title?: string;
    metric?: 'clicks' | 'impressions' | 'ctr' | 'position';
}

export function TrendChart({ data, title = "Performance Trend", metric = 'clicks' }: TrendChartProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatValue = (value: number) => {
        if (metric === 'ctr') return (value * 100).toFixed(1) + '%';
        if (metric === 'position') return value.toFixed(1);
        if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
        return value.toString();
    };

    const getColor = () => {
        switch (metric) {
            case 'clicks': return '#10b981';
            case 'impressions': return '#3b82f6';
            case 'ctr': return '#f59e0b';
            case 'position': return '#8b5cf6';
            default: return '#10b981';
        }
    };

    const formattedData = data.map(d => ({
        ...d,
        displayDate: formatDate(d.date),
        displayValue: metric === 'ctr' ? d.ctr * 100 : d[metric],
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                    {metric.charAt(0).toUpperCase() + metric.slice(1)} over time
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                                dataKey="displayDate" 
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis 
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatValue}
                                reversed={metric === 'position'}
                            />
                            <Tooltip 
                                formatter={(value: number) => [formatValue(value), metric]}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="displayValue" 
                                stroke={getColor()}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

