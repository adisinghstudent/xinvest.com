'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/line-charts-9';
import { X, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line } from 'recharts';

interface StockData {
  ticker: string;
  price: number;
  change: number;
  volume: number;
  chartData?: { date: string; value: number }[];
}

interface VaultSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VaultSidebar({ isOpen, onClose }: VaultSidebarProps) {
  const router = useRouter();
  const [vaultTickers, setVaultTickers] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vaultTickers');
      return saved ? JSON.parse(saved) : ['BTC', 'ETH'];
    }
    return ['BTC', 'ETH'];
  });
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [newTicker, setNewTicker] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('vaultTickers', JSON.stringify(vaultTickers));
  }, [vaultTickers]);

  // Fetch realtime data
  const fetchRealtimeData = async () => {
    if (vaultTickers.length === 0) return;
    try {
      const res = await fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: vaultTickers }),
      });
      if (res.ok) {
        const data = await res.json();
        // For sidebar, we don't need chartData here, just prices
        setStockData(data.data.map((item: any) => ({ ...item, chartData: [] })));
      }
    } catch (err) {
      console.error('Failed to fetch realtime data', err);
    }
  };

  // Fetch historical chart data for each stock
  const fetchChartData = async (ticker: string) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7); // last 7 days for small chart

      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'candleSnapshot',
          req: {
            coin: ticker,
            interval: '1h',
            startTime: startDate.getTime(),
            endTime: endDate.getTime(),
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const chartData = data.map((candle: any) => ({
          date: new Date(candle.t).toLocaleDateString(),
          value: parseFloat(candle.c),
        }));
        return chartData;
      }
    } catch (err) {
      console.error(`Failed to fetch chart for ${ticker}`, err);
    }
    return [];
  };

  useEffect(() => {
    if (isOpen) {
      fetchRealtimeData();
      // Fetch charts for all tickers
      vaultTickers.forEach(async (ticker) => {
        const chartData = await fetchChartData(ticker);
        setStockData(prev => prev.map(s => s.ticker === ticker ? { ...s, chartData } : s));
      });
      const interval = setInterval(fetchRealtimeData, 10000); // every 10s
      return () => clearInterval(interval);
    }
  }, [isOpen, vaultTickers]);

  const addTicker = async () => {
    if (newTicker.trim() && !vaultTickers.includes(newTicker.trim().toUpperCase())) {
      const ticker = newTicker.trim().toUpperCase();
      setVaultTickers([...vaultTickers, ticker]);
      setNewTicker('');
      // Fetch chart for new ticker
      const chartData = await fetchChartData(ticker);
      setStockData(prev => prev.map(s => s.ticker === ticker ? { ...s, chartData } : s));
    }
  };

  const removeTicker = (ticker: string) => {
    setVaultTickers(vaultTickers.filter(t => t !== ticker));
    setStockData(stockData.filter(s => s.ticker !== ticker));
  };

  const chartConfig = {
    value: {
      label: 'Price',
      color: 'var(--color-purple-500)',
    },
  } satisfies ChartConfig;

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">Vault</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Add Ticker */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Add ticker (e.g. BTC)"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTicker()}
            className="flex-1 p-2 border rounded-md bg-background"
          />
          <Button onClick={addTicker} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Stocks List */}
        <div className="space-y-4">
          {stockData.map((stock) => (
            <Card key={stock.ticker} className="bg-gray-50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-black">{stock.ticker}</h3>
                    <p className="text-lg font-bold text-black">${stock.price.toFixed(2)}</p>
                    <div className={`flex items-center text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {stock.change.toFixed(2)}%
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeTicker(stock.ticker)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Small Chart */}
                {stock.chartData && stock.chartData.length > 0 && (
                  <ChartContainer
                    config={chartConfig}
                    className="h-20 w-full"
                  >
                    <LineChart
                      data={stock.chartData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={chartConfig.value.color}
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Vault Button */}
        <div className="mt-6">
          <Button onClick={() => { onClose(); router.push('/vault'); }} className="w-full">
            Create Vault
          </Button>
        </div>
      </div>
    </div>
  );
}