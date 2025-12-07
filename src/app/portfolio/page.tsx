'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-9';
import { TrendingUp, Loader2, Menu } from 'lucide-react';
import { CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import VaultSidebar from '@/components/VaultSidebar';

// Chart configuration
const chartConfig = {
  value: {
    label: 'Portfolio Value',
    color: 'var(--color-purple-500)',
  },
} satisfies ChartConfig;

export default function PortfolioPage() {
  const router = useRouter();
  const [tickers, setTickers] = useState<string>('AAPL,MSFT,GOOGL');
  const [period, setPeriod] = useState<string>('1y');
  const [loading, setLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      const tickerArray = tickers.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
      if (tickerArray.length === 0) throw new Error('Please enter at least one ticker.');

      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: tickerArray }),
      });

      if (!res.ok) throw new Error('Failed to fetch data.');

      const data = await res.json();
      setPortfolioData(data.chartData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const currentBalance = portfolioData.length > 0 ? portfolioData[portfolioData.length - 1].value : 0;
  const previousBalance = portfolioData.length > 1 ? portfolioData[portfolioData.length - 2].value : 0;
  const pnl = currentBalance - previousBalance;
  const pnlPercentage = previousBalance > 0 ? (pnl / previousBalance) * 100 : 0;
  const highValue = portfolioData.length > 0 ? Math.max(...portfolioData.map(d => d.value)) : 0;
  const lowValue = portfolioData.length > 0 ? Math.min(...portfolioData.map(d => d.value)) : 0;

  return (
    <div className="w-full max-w-6xl min-h-screen flex items-center justify-center p-6 mx-auto">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-between items-center">
            <div></div>
            <div>
              <h1 className="text-4xl font-bold">Portfolio Performance</h1>
              <p className="text-muted-foreground">Track your stock portfolio over time</p>
            </div>
            <Button variant="outline" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-4 h-4 mr-2" />
              Vault
            </Button>
          </div>
        </div>

        {/* Input Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tickers (comma separated)</label>
              <input
                type="text"
                value={tickers}
                onChange={(e) => setTickers(e.target.value)}
                placeholder="AAPL,MSFT,GOOGL"
                className="w-full p-3 border rounded-md bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full p-3 border rounded-md bg-background"
              >
                <option value="1y">1 Year</option>
                <option value="6mo">6 Months</option>
                <option value="3mo">3 Months</option>
                <option value="1mo">1 Month</option>
              </select>
            </div>
            <Button onClick={() => {
              const tickerArray = tickers.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
              if (tickerArray.length > 0) {
                localStorage.setItem('vaultTickers', JSON.stringify(tickerArray));
                router.push('/vault');
              }
            }} className="w-full">
              Open Vault
            </Button>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </div>
        </Card>

        {/* Results */}
        {portfolioData.length > 0 && (
          <Card>
            <CardContent className="flex flex-col items-stretch gap-5 p-6">
              {/* Header */}
              <div className="mb-5">
                <h2 className="text-base text-muted-foreground font-medium mb-1">Current Portfolio Value</h2>
                <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-3.5">
                  <span className="text-4xl font-bold">${currentBalance.toLocaleString()}</span>
                  <div className={`flex items-center gap-1 ${pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercentage.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>

              <div className="grow">
                {/* Stats Row */}
                <div className="flex items-center justify-between flex-wrap gap-2.5 text-sm mb-2.5">
                  <div className="flex items-center gap-6 text-muted-foreground">
                    <span>High: <span className="text-sky-600 font-medium">{highValue.toLocaleString()}</span></span>
                    <span>Low: <span className="text-yellow-600 font-medium">{lowValue.toLocaleString()}</span></span>
                  </div>
                </div>

                {/* Chart */}
                <ChartContainer
                  config={chartConfig}
                  className="h-96 w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
                >
                  <ComposedChart
                    data={portfolioData}
                    margin={{
                      top: 20,
                      right: 10,
                      left: 5,
                      bottom: 20,
                    }}
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={chartConfig.value.color} stopOpacity={0.1} />
                        <stop offset="100%" stopColor={chartConfig.value.color} stopOpacity={0} />
                      </linearGradient>
                      <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1" fill="var(--input)" fillOpacity="0.3" />
                      </pattern>
                      <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.8)" />
                      </filter>
                      <filter id="lineShadow" x="-100%" y="-100%" width="300%" height="300%">
                        <feDropShadow dx="4" dy="6" stdDeviation="25" floodColor="rgba(59, 130, 246, 0.9)" />
                      </filter>
                    </defs>

                    <rect x="0" y="0" width="100%" height="100%" fill="url(#dotGrid)" style={{ pointerEvents: 'none' }} />

                    <CartesianGrid
                      strokeDasharray="4 8"
                      stroke="var(--input)"
                      strokeOpacity={1}
                      horizontal={true}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: chartConfig.value.color }}
                      tickMargin={15}
                      interval="preserveStartEnd"
                      tickCount={5}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: chartConfig.value.color }}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      tickMargin={15}
                    />

                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                              <div className="text-sm text-muted-foreground mb-1">{data.date}</div>
                              <div className="text-base font-bold">${data.value.toLocaleString()}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ strokeDasharray: '3 3', stroke: 'var(--muted-foreground)', strokeOpacity: 0.5 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={chartConfig.value.color}
                      strokeWidth={2}
                      filter="url(#lineShadow)"
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (payload.value === highValue || payload.value === lowValue) {
                          return (
                            <circle
                              key={`dot-${payload.date}`}
                              cx={cx}
                              cy={cy}
                              r={6}
                              fill={chartConfig.value.color}
                              stroke="white"
                              strokeWidth={2}
                              filter="url(#dotShadow)"
                            />
                          );
                        }
                        return <g key={`dot-${payload.date}`} />;
                      }}
                      activeDot={{
                        r: 6,
                        fill: chartConfig.value.color,
                        stroke: 'white',
                        strokeWidth: 2,
                        filter: 'url(#dotShadow)',
                      }}
                    />
                  </ComposedChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <VaultSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}