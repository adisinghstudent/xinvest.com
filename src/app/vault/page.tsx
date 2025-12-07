'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Calendar, RefreshCw, ArrowLeft } from 'lucide-react';
import { PortfolioChart } from '@/components/PortfolioChart';
import Link from 'next/link';

export default function VaultPage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [tickerData, setTickerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('1Y');

  useEffect(() => {
    const saved = localStorage.getItem('vaultTickers');
    if (saved) {
      try {
        const parsedTickers = JSON.parse(saved);
        if (Array.isArray(parsedTickers) && parsedTickers.length > 0) {
          setTickers(parsedTickers);
        }
      } catch (e) {
        console.error('Error parsing saved tickers:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (tickers.length > 0) {
      fetchTickerData();
    }
  }, [tickers, timeRange]);

  const fetchTickerData = async () => {
    setLoading(true);
    setError('');
    try {
      const promises = tickers.map(async (ticker) => {
        try {
          const res = await fetch('/api/ticker-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker, timeRange }),
          });
          if (res.ok) {
            const data = await res.json();
            return { ticker, chartData: data.chartData || [], error: null };
          } else {
            return { ticker, chartData: [], error: 'Failed to fetch data' };
          }
        } catch (e) {
          return { ticker, chartData: [], error: 'Network error' };
        }
      });

      const results = await Promise.all(promises);
      setTickerData(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPerformance = (data: any[]) => {
    if (!data || data.length < 2) return null;
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = ((lastValue - firstValue) / firstValue) * 100;
    return {
      change: change.toFixed(2),
      isPositive: change >= 0,
      firstValue,
      lastValue
    };
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8 selection:bg-[#1D9BF0] selection:text-white">
      <div className="w-full max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="bg-[#0F0F0F] border border-[#333] hover:border-[#1D9BF0] text-white rounded-lg px-4 py-2 font-medium transition-all flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </Link>
              <div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                  Vault
                </h1>
                <p className="text-gray-400 text-lg mt-2">
                  Track your portfolio performance powered by Yahoo Finance
                </p>
              </div>
            </div>
            <button
              onClick={fetchTickerData}
              disabled={loading}
              className="bg-[#0F0F0F] border border-[#333] hover:border-[#1D9BF0] text-white rounded-lg px-6 py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2">
              {(['1M', '3M', '6M', '1Y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${timeRange === range
                      ? 'bg-[#1D9BF0] text-white'
                      : 'bg-[#0F0F0F] border border-[#333] text-gray-400 hover:border-[#1D9BF0] hover:text-white'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-400 space-y-4 py-12"
          >
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#1D9BF0]" />
            <p className="text-lg">Loading stock data from Yahoo Finance...</p>
            <div className="h-1 w-64 bg-[#333] rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-[#1D9BF0] w-1/3 animate-progress"></div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-center"
          >
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Tickers Grid */}
        {!loading && tickerData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {tickerData.map((ticker, index) => {
              const performance = getPerformance(ticker.chartData);

              return (
                <motion.div
                  key={ticker.ticker}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#0F0F0F] border border-[#333] rounded-xl p-6 hover:border-[#1D9BF0] transition-all"
                >
                  {/* Ticker Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        {ticker.ticker}
                        <TrendingUp className="w-5 h-5 text-[#1D9BF0]" />
                      </h3>
                      {performance && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-400">
                            ${performance.lastValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className={`text-lg font-semibold ${performance.isPositive ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {performance.isPositive ? '+' : ''}{performance.change}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart */}
                  {ticker.chartData.length > 0 ? (
                    <PortfolioChart data={ticker.chartData} />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <p className="text-gray-500">No data available for {ticker.ticker}</p>
                        {ticker.error && (
                          <p className="text-sm text-red-400">{ticker.error}</p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && tickerData.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 space-y-4"
          >
            <TrendingUp className="w-16 h-16 mx-auto text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-400">No stocks in your vault</h2>
            <p className="text-gray-500">Go back home to add some tickers</p>
            <Link href="/">
              <button className="mt-4 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white rounded-lg px-6 py-3 font-medium transition-colors">
                Add Tickers
              </button>
            </Link>
          </motion.div>
        )}

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-sm py-8 border-t border-[#333]"
        >
          <p>Data provided by Yahoo Finance API v2 • No API key required</p>
          <p className="mt-2">Tracking {tickers.length} {tickers.length === 1 ? 'stock' : 'stocks'}</p>
        </motion.div>
      </div>
    </main>
  );
}