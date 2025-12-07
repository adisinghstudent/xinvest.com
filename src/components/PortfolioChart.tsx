"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface PortfolioChartProps {
    data: { date: string; value: number }[];
}

export function PortfolioChart({ data }: PortfolioChartProps) {
    if (!data || data.length === 0) {
        return <div className="h-[400px] w-full flex items-center justify-center text-gray-500">No data available</div>;
    }

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1D9BF0" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#1D9BF0" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="date"
                        stroke="#555"
                        tick={{ fill: '#888', fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        axisLine={{ stroke: '#333' }}
                    />
                    <YAxis
                        stroke="#555"
                        tick={{ fill: '#888', fontSize: 12 }}
                        tickFormatter={(value) => {
                            if (value >= 1000) {
                                return `$${(value / 1000).toFixed(1)}k`;
                            }
                            return `$${value.toFixed(0)}`;
                        }}
                        axisLine={{ stroke: '#333' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0F0F0F',
                            borderColor: '#1D9BF0',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '12px'
                        }}
                        itemStyle={{ color: '#1D9BF0', fontWeight: 'bold' }}
                        formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                        labelStyle={{ color: '#888', marginBottom: '4px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#1D9BF0"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
