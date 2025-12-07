'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Calendar, RefreshCw, ArrowLeft, Share2 } from 'lucide-react';
import { PortfolioChart } from '@/components/PortfolioChart';
import Link from 'next/link';
import { supabase, saveVault, getCurrentUser, toggleVaultPublic, signInWithGoogle } from '@/lib/supabase';
import { Toast } from '@/components/Toast';

export default function VaultPage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [portfolioWeights, setPortfolioWeights] = useState<{ [ticker: string]: number }>({});
  const [tickerData, setTickerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('1Y');
  const [isPublic, setIsPublic] = useState(false);
  const [vaultId, setVaultId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('vaultTickers');
    const savedWeights = localStorage.getItem('vaultWeights');
    const savedHandle = localStorage.getItem('vaultHandle');
    const savedReasoning = localStorage.getItem('vaultReasoning');
    const savedVaultId = localStorage.getItem('currentVaultId');

    if (savedVaultId) {
      setVaultId(savedVaultId);
    }

    if (saved) {
      try {
        const parsedTickers = JSON.parse(saved);
        if (Array.isArray(parsedTickers) && parsedTickers.length > 0) {
          setTickers(parsedTickers);
        }

        // Load weights if available
        if (savedWeights) {
          const parsedWeights = JSON.parse(savedWeights);
          setPortfolioWeights(parsedWeights);
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

  // Check for pending share action after login
  useEffect(() => {
    const checkPendingShare = async () => {
      const pendingShare = localStorage.getItem('pendingShare');
      if (pendingShare === 'true') {
        const user = await getCurrentUser();
        if (user) {
          console.log('Found pending share action, resuming...');
          localStorage.removeItem('pendingShare');

          // Manually load data from localStorage to ensure we have it
          const savedTickers = JSON.parse(localStorage.getItem('vaultTickers') || '[]');
          const savedWeights = JSON.parse(localStorage.getItem('vaultWeights') || '{}');

          handleShareVault(savedTickers, savedWeights);
        }
      }
    };

    // Small delay to ensure auth state is ready
    const timer = setTimeout(checkPendingShare, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleShareVault = async (explicitTickers?: string[], explicitWeights?: { [key: string]: number }) => {
    try {
      console.log('Starting handleShareVault...');

      // Use explicit data if provided, otherwise use state
      const tickersToSave = explicitTickers || tickers;
      const weightsToSave = explicitWeights || portfolioWeights;

      // Check if user is authenticated
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        console.log('User not authenticated, redirecting to login...');
        // Set pending flag
        localStorage.setItem('pendingShare', 'true');

        // Trigger Google OAuth
        const { error: authError } = await signInWithGoogle();
        if (authError) {
          console.error('Auth error:', authError);
          setError('Please sign in to share your vault');
          return;
        }
        // OAuth will redirect, vault will be saved on return
        return;
      }

      const savedHandle = localStorage.getItem('vaultHandle');
      const savedReasoning = localStorage.getItem('vaultReasoning');

      // Toggle public state
      const newPublicState = !isPublic;
      let currentVaultId = vaultId;

      if (vaultId) {
        // Update existing vault's public status
        const { error } = await toggleVaultPublic(vaultId, newPublicState);

        if (error) {
          console.error('Error sharing vault:', error);
          setError('Failed to update sharing settings');
          return;
        }
      } else {
        // Create new vault with public status
        console.log('Creating new vault with data:', {
          twitter_handle: savedHandle,
          tickers: tickersToSave,
          weights: weightsToSave,
          is_public: newPublicState
        });

        const { data, error } = await saveVault({
          twitter_handle: savedHandle || undefined,
          tickers: tickersToSave,
          weights: weightsToSave,
          reasoning: savedReasoning || undefined,
          is_public: newPublicState,
        });

        if (error) {
          console.error('Error creating vault:', error);
          setError(`Failed to create vault: ${error.message}`);
          return;
        }

        console.log('Vault created successfully:', data);

        if (data) {
          currentVaultId = data.id;
          setVaultId(data.id);
          localStorage.setItem('currentVaultId', data.id);
        }
      }

      // If making public, calculate and update PnL
      if (newPublicState && currentVaultId) {
        try {
          console.log(`Calculating PnL for vault ${currentVaultId}...`);
          const pnlRes = await fetch('/api/update-pnl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vaultId: currentVaultId }),
          });

          if (pnlRes.ok) {
            const pnlData = await pnlRes.json();
            console.log('PnL calculated successfully:', pnlData.pnl);
          } else {
            const errorText = await pnlRes.text();
            console.warn('Failed to calculate PnL:', errorText);
          }
        } catch (pnlError) {
          console.error('Error calculating PnL:', pnlError);
          // Don't fail the whole operation if PnL calculation fails
        }
      }

      setIsPublic(newPublicState);
      alert(newPublicState ? '✅ Vault is now public! Calculating performance...' : '❌ Vault is now private.');
    } catch (err: any) {
      setError(err.message || 'Failed to share vault');
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

  // Calculate overall portfolio performance using WEIGHTED averaging
  const getOverallPortfolioData = () => {
    if (!tickerData || tickerData.length === 0) return null;

    // Filter out tickers with no data
    const validTickers = tickerData.filter(t => t.chartData && t.chartData.length > 0);
    if (validTickers.length === 0) return null;

    // Check if we have weights, otherwise use equal weights
    const hasWeights = Object.keys(portfolioWeights).length > 0;
    const equalWeight = 100 / validTickers.length;

    // Get all unique dates across all tickers
    const allDates = new Set<string>();
    validTickers.forEach(ticker => {
      ticker.chartData.forEach((point: any) => {
        allDates.add(point.date);
      });
    });

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    // For each date, calculate the WEIGHTED average value across all tickers
    const portfolioData = sortedDates.map(date => {
      let weightedSum = 0;
      let totalWeight = 0;

      validTickers.forEach(ticker => {
        const dataPoint = ticker.chartData.find((p: any) => p.date === date);
        if (dataPoint) {
          // Use AI-generated weight or equal weight
          const weight = hasWeights ? (portfolioWeights[ticker.ticker] || equalWeight) : equalWeight;
          weightedSum += dataPoint.value * (weight / 100);
          totalWeight += weight;
        }
      });

      return {
        date,
        value: totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0
      };
    }).filter(point => point.value > 0);

    return portfolioData;
  };

  const overallPortfolioData = getOverallPortfolioData();
  const overallPerformance = overallPortfolioData ? getPerformance(overallPortfolioData) : null;

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleShareVault()}
                className={`border rounded-lg px-6 py-3 font-medium transition-all flex items-center gap-2 ${isPublic
                  ? 'bg-[#1D9BF0] border-[#1D9BF0] text-white hover:bg-[#1A8CD8]'
                  : 'bg-[#0F0F0F] border-[#333] text-white hover:border-[#1D9BF0]'
                  }`}
              >
                <Share2 className="w-5 h-5" />
                {isPublic ? 'Public' : 'Share Vault'}
              </button>
              <button
                onClick={fetchTickerData}
                disabled={loading}
                className="bg-[#0F0F0F] border border-[#333] hover:border-[#1D9BF0] text-white rounded-lg px-6 py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
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

        {/* Overall Portfolio Performance */}
        {!loading && overallPortfolioData && overallPerformance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1D9BF0]/10 to-[#0F0F0F] border-2 border-[#1D9BF0] rounded-2xl p-8"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">Portfolio ETF</h2>
                    <span className="bg-[#1D9BF0]/20 text-[#1D9BF0] px-3 py-1 rounded-full text-sm font-medium">
                      {tickers.length} Stocks
                    </span>
                  </div>
                  <p className="text-gray-400">Average performance across all holdings</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Average Price</p>
                  <p className="text-2xl font-bold text-white">
                    ${overallPerformance.lastValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xl font-semibold mt-1 ${overallPerformance.isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {overallPerformance.isPositive ? '+' : ''}{overallPerformance.change}%
                  </p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-black/30 rounded-xl p-4">
                <PortfolioChart data={overallPortfolioData} />
              </div>
            </div>
          </motion.div>
        )}

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

        {/* Individual Stocks Section Header */}
        {!loading && tickerData.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-t border-[#333] pt-8"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Individual Holdings</h2>
            <p className="text-gray-400">Detailed performance for each stock</p>
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
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          {ticker.ticker}
                          <TrendingUp className="w-5 h-5 text-[#1D9BF0]" />
                        </h3>
                        {portfolioWeights[ticker.ticker] && (
                          <span className="bg-[#1D9BF0]/20 text-[#1D9BF0] px-2 py-1 rounded-md text-xs font-semibold">
                            {portfolioWeights[ticker.ticker].toFixed(1)}%
                          </span>
                        )}
                      </div>
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

      {/* Toast Notifications */}
      {error && <Toast message={error} onClose={() => setError('')} />}
    </main>
  );
}