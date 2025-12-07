'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Twitter, Loader2, Edit, Trash2, Plus, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, signInWithGoogle, saveVault, getCurrentUser, getPublicLeaderboard } from '@/lib/supabase';
import { Toast } from '@/components/Toast';

// Leaderboard Row Component with Real-Time PnL
function LeaderboardRow({ entry, rank }: { entry: any; rank: number }) {
  const [pnl, setPnl] = useState({ pnl_24h: 0, pnl_30d: 0, pnl_all_time: 0 });
  const [calculating, setCalculating] = useState(true);

  useEffect(() => {
    calculateRealTimePnL();
  }, [entry]);

  const calculateRealTimePnL = async () => {
    try {
      if (!entry.tickers || !entry.weights) {
        setPnl({ pnl_24h: 0, pnl_30d: 0, pnl_all_time: 0 });
        setCalculating(false);
        return;
      }

      const tickers = Array.isArray(entry.tickers) ? entry.tickers : [];
      const weights = entry.weights || {};

      // Fetch data for all tickers
      const tickerDataPromises = tickers.map(async (ticker: string) => {
        try {
          const res = await fetch('/api/ticker-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker, timeRange: '1Y' }),
          });
          if (res.ok) {
            const data = await res.json();
            return { ticker, chartData: data.chartData || [] };
          }
          return { ticker, chartData: [] };
        } catch {
          return { ticker, chartData: [] };
        }
      });

      const tickerData = await Promise.all(tickerDataPromises);

      // Calculate PnL for each timeframe
      const calculate = (daysAgo: number) => {
        let totalPnL = 0;
        let validTickers = 0;

        tickerData.forEach(({ ticker, chartData }) => {
          if (chartData.length < 2) return;

          const weight = weights[ticker] || 0;
          if (weight === 0) return;

          let startIndex = 0;
          if (daysAgo === 1) {
            startIndex = Math.max(0, chartData.length - 2);
          } else if (daysAgo === 30) {
            startIndex = Math.max(0, chartData.length - 30);
          }

          const startPrice = chartData[startIndex].value;
          const endPrice = chartData[chartData.length - 1].value;

          const tickerPnL = ((endPrice - startPrice) / startPrice) * 100;
          totalPnL += tickerPnL * (weight / 100);
          validTickers++;
        });

        return validTickers > 0 ? totalPnL : 0;
      };

      setPnl({
        pnl_24h: calculate(1),
        pnl_30d: calculate(30),
        pnl_all_time: calculate(365),
      });
    } catch (error) {
      console.error('Error calculating PnL:', error);
      setPnl({ pnl_24h: 0, pnl_30d: 0, pnl_all_time: 0 });
    } finally {
      setCalculating(false);
    }
  };

  const formatPnL = (value: number) => {
    const formatted = value.toFixed(2);
    return value >= 0 ? `+${formatted}` : formatted;
  };

  return (
    <tr className="border-b border-[#333] hover:bg-[#1D9BF0]/5 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-mono text-sm">#{rank}</span>
          {entry.twitter_handle ? (
            <Link
              href={`/vault?id=${entry.id}`}
              className="text-[#1D9BF0] hover:underline font-medium flex items-center gap-1"
            >
              @{entry.twitter_handle.replace('@', '')}
            </Link>
          ) : (
            <span className="text-gray-400 font-medium">Anonymous</span>
          )}
        </div>
      </td>
      <td className={`p-4 text-right font-semibold ${calculating ? 'text-gray-500' : pnl.pnl_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {calculating ? '...' : `${formatPnL(pnl.pnl_24h)}%`}
      </td>
      <td className={`p-4 text-right font-semibold ${calculating ? 'text-gray-500' : pnl.pnl_30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {calculating ? '...' : `${formatPnL(pnl.pnl_30d)}%`}
      </td>
      <td className={`p-4 text-right font-bold text-lg ${calculating ? 'text-gray-500' : pnl.pnl_all_time >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {calculating ? '...' : `${formatPnL(pnl.pnl_all_time)}%`}
      </td>
    </tr>
  );
}

export default function Home() {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [tickers, setTickers] = useState<string[]>([]);
  const [portfolioWeights, setPortfolioWeights] = useState<{ [ticker: string]: number }>({});
  const [reasoning, setReasoning] = useState<string>('');
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const router = useRouter();


  useEffect(() => {
    // Check auth state
    getCurrentUser().then(setUser);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);


  useEffect(() => {
    // Only fetch leaderboard on homepage
    // Don't load saved tickers - let user start fresh
    (async () => {
      const { data } = await getPublicLeaderboard();
      if (data) setLeaderboard(data);
    })();
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle) return;

    setLoading(true);
    setError('');
    setTickers([]);
    setReasoning('');

    try {
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });

      if (!analyzeRes.ok) throw new Error('Failed to analyze tweets');
      const analyzeData = await analyzeRes.json();

      if (analyzeData.error) throw new Error(analyzeData.error);

      setTickers(analyzeData.tickers || []);
      setReasoning(analyzeData.reasoning || 'No reasoning provided.');

      // Save and set portfolio weights if available
      if (analyzeData.portfolio && Array.isArray(analyzeData.portfolio)) {
        const weights: { [ticker: string]: number } = {};
        analyzeData.portfolio.forEach((item: any) => {
          weights[item.ticker] = item.weight;
        });
        setPortfolioWeights(weights);
        localStorage.setItem('vaultWeights', JSON.stringify(weights));
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndOpenVault = async () => {
    // Require Twitter handle to be analyzed first
    if (!handle || tickers.length === 0) {
      setError('Please analyze a Twitter account first');
      return;
    }

    try {
      // Save to localStorage (no auth required to view vault)
      localStorage.setItem('vaultTickers', JSON.stringify(tickers));
      localStorage.setItem('vaultWeights', JSON.stringify(portfolioWeights));
      localStorage.setItem('vaultHandle', handle);
      localStorage.setItem('vaultReasoning', reasoning);

      // Navigate to vault
      router.push('/vault');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  const updateTicker = (index: number, value: string) => {
    const oldTicker = tickers[index];
    const newTickers = [...tickers];
    newTickers[index] = value.toUpperCase();
    setTickers(newTickers);

    // Update weight key if ticker changed
    if (oldTicker && oldTicker !== value.toUpperCase()) {
      const newWeights = { ...portfolioWeights };
      if (newWeights[oldTicker]) {
        newWeights[value.toUpperCase()] = newWeights[oldTicker];
        delete newWeights[oldTicker];
        setPortfolioWeights(newWeights);
      }
    }
  };

  const updateWeight = (ticker: string, weight: number) => {
    const newWeights = { ...portfolioWeights };
    newWeights[ticker] = Math.max(0, Math.min(100, weight)); // Clamp between 0-100
    setPortfolioWeights(newWeights);
  };

  const deleteTicker = (index: number) => {
    const tickerToDelete = tickers[index];
    setTickers(tickers.filter((_, i) => i !== index));

    // Remove weight for deleted ticker
    if (tickerToDelete) {
      const newWeights = { ...portfolioWeights };
      delete newWeights[tickerToDelete];
      setPortfolioWeights(newWeights);
    }
  };

  const addTicker = () => {
    setTickers([...tickers, '']);
    // New tickers get equal weight by default
    const equalWeight = 100 / (tickers.length + 1);
    const newWeights = { ...portfolioWeights };
    setPortfolioWeights(newWeights);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-24 bg-black text-white selection:bg-[#1D9BF0] selection:text-white">
      <div className="w-full max-w-4xl space-y-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            X Invest
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Analyze any X (Twitter) account and generate a personalized stock portfolio
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <form onSubmit={handleAnalyze} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-500 text-lg">@</span>
            </div>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="elonmusk"
              className="w-full bg-[#0F0F0F] border border-[#333] text-white text-lg rounded-full py-4 pl-10 pr-14 focus:outline-none focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0] transition-all placeholder:text-gray-600"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !handle}
              className="absolute right-2 top-2 bottom-2 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white rounded-full px-6 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </form>
          {error && (
            <p className="text-red-500 text-center mt-4">{error}</p>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-400 space-y-2"
          >
            <p>Grok is analyzing tweets...</p>
            <div className="h-1 w-64 bg-[#333] rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-[#1D9BF0] w-1/3 animate-progress"></div>
            </div>
          </motion.div>
        )}

        {/* Public Leaderboard */}
        {!loading && tickers.length === 0 && leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">🏆 Public Leaderboard</h2>
              <p className="text-gray-400">Top performing shared vaults (real-time data)</p>
            </div>

            <div className="bg-[#0F0F0F] border border-[#333] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-black/50 border-b border-[#333]">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">User</th>
                    <th className="text-right p-4 text-gray-400 font-medium">24h</th>
                    <th className="text-right p-4 text-gray-400 font-medium">30d</th>
                    <th className="text-right p-4 text-gray-400 font-medium">All Time</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <LeaderboardRow key={entry.id || index} entry={entry} rank={index + 1} />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Ticker Editor */}
        {tickers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Reasoning */}
            {reasoning && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-[#1D9BF0]">
                  <Twitter className="w-5 h-5" />
                  <span className="font-medium">Grok's Analysis {handle && `for @${handle}`}</span>
                </div>
                <div className="bg-[#0F0F0F] border border-[#333] rounded-lg p-4 text-center">
                  <p className="text-gray-300">{reasoning}</p>
                </div>
              </div>
            )}

            {/* Editable Tickers */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 text-[#1D9BF0]">
                <Edit className="w-5 h-5" />
                <span className="font-medium">Edit Your Portfolio Tickers & Weights</span>
              </div>
              <div className="space-y-4">
                {tickers.map((ticker, index) => (
                  <div key={index} className="flex items-center gap-3 bg-[#0F0F0F] border border-[#333] rounded-lg p-4 hover:border-[#1D9BF0] transition-all">
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => updateTicker(index, e.target.value)}
                      placeholder="Enter ticker (e.g., AAPL)"
                      className="flex-1 bg-transparent text-white border-none outline-none text-lg"
                    />
                    {ticker && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={portfolioWeights[ticker] || 0}
                          onChange={(e) => updateWeight(ticker, parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-20 bg-[#1D9BF0]/10 border border-[#1D9BF0]/30 text-[#1D9BF0] rounded-lg px-3 py-2 text-center font-semibold focus:outline-none focus:border-[#1D9BF0]"
                        />
                        <span className="text-[#1D9BF0] font-semibold">%</span>
                      </div>
                    )}
                    <button
                      onClick={() => deleteTicker(index)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                {/* Total Weight Indicator */}
                {tickers.length > 0 && Object.keys(portfolioWeights).length > 0 && (
                  <div className="flex items-center justify-between bg-[#0F0F0F] border border-[#333] rounded-lg p-4">
                    <span className="text-gray-400">Total Portfolio Weight:</span>
                    {(() => {
                      const totalWeight = Object.values(portfolioWeights).reduce((sum, w) => sum + w, 0);
                      const isValid = Math.abs(totalWeight - 100) < 1;
                      const isClose = Math.abs(totalWeight - 100) < 5;
                      return (
                        <span className={`text-lg font-bold ${isValid ? 'text-green-400' : isClose ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                          {totalWeight.toFixed(1)}%
                        </span>
                      );
                    })()}
                  </div>
                )}

                <button
                  onClick={addTicker}
                  className="w-full bg-[#0F0F0F] border border-[#333] rounded-lg p-4 text-[#1D9BF0] hover:bg-[#1D9BF0] hover:text-black transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Ticker
                </button>
              </div>
              <button
                onClick={handleSaveAndOpenVault}
                disabled={loading || tickers.length === 0}
                className="w-full bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white rounded-lg py-4 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Open Vault
              </button>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-gray-500 text-sm"
        >
          <p>Powered by Grok AI & Yahoo Finance</p>
        </motion.div>
      </div>

      {/* Toast Notifications */}
      {error && <Toast message={error} onClose={() => setError('')} />}
    </main>
  );
}
