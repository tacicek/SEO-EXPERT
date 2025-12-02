'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CTRCurveChartProps {
    data: {
        overall: Array<{ position: number; ctr: number; clicks: number; impressions: number }>;
        branded?: Array<{ position: number; ctr: number; clicks: number; impressions: number }>;
        nonBranded?: Array<{ position: number; ctr: number; clicks: number; impressions: number }>;
    };
    showBranded?: boolean;
}

export function CTRCurveChart({ data, showBranded = false }: CTRCurveChartProps) {
    // Merge data for stacked view
    const chartData = data.overall.slice(0, 10).map((item) => {
        const brandedItem = data.branded?.find(b => b.position === item.position);
        const nonBrandedItem = data.nonBranded?.find(n => n.position === item.position);
        
        return {
            position: `#${item.position}`,
            posNum: item.position,
            overallCTR: item.ctr,
            brandedCTR: brandedItem?.ctr || 0,
            nonBrandedCTR: nonBrandedItem?.ctr || 0,
        };
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Organic CTR Curve</CardTitle>
                <CardDescription>
                    Click-through rate by ranking position (Top 10)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={chartData} 
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                            <XAxis 
                                type="number"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value.toFixed(0)}%`}
                                domain={[0, 'auto']}
                            />
                            <YAxis 
                                type="category"
                                dataKey="position"
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                width={40}
                            />
                            <Tooltip 
                                formatter={(value: number) => [`${value.toFixed(2)}%`, 'CTR']}
                                labelFormatter={(label) => `Position ${label}`}
                            />
                            <Legend />
                            
                            {showBranded && data.branded && data.nonBranded ? (
                                <>
                                    <Bar 
                                        dataKey="brandedCTR" 
                                        fill="#10b981" 
                                        name="Branded"
                                        radius={[0, 4, 4, 0]}
                                    />
                                    <Bar 
                                        dataKey="nonBrandedCTR" 
                                        fill="#3b82f6" 
                                        name="Non-Branded"
                                        radius={[0, 4, 4, 0]}
                                    />
                                </>
                            ) : (
                                <Bar 
                                    dataKey="overallCTR" 
                                    fill="#8b5cf6" 
                                    name="CTR %"
                                    radius={[0, 4, 4, 0]}
                                    label={{ position: 'right', formatter: (v: number) => `${v.toFixed(1)}%`, fontSize: 11 }}
                                />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}



