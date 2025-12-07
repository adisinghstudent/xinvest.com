'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Twitter, Loader2, Edit, Trash2, Plus, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickers, setTickers] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [error, setError] = useState('');
  const router = useRouter();

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
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndOpenVault = () => {
    if (tickers.length > 0) {
      localStorage.setItem('vaultTickers', JSON.stringify(tickers));
      router.push('/vault');
    }
  };

  const updateTicker = (index: number, value: string) => {
    const newTickers = [...tickers];
    newTickers[index] = value.toUpperCase();
    setTickers(newTickers);
  };

  const deleteTicker = (index: number) => {
    setTickers(tickers.filter((_, i) => i !== index));
  };

  const addTicker = () => {
    setTickers([...tickers, '']);
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
                <span className="font-medium">Edit Your Portfolio Tickers</span>
              </div>
              <div className="space-y-4">
                {tickers.map((ticker, index) => (
                  <div key={index} className="flex items-center gap-4 bg-[#0F0F0F] border border-[#333] rounded-lg p-4 hover:border-[#1D9BF0] transition-all">
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => updateTicker(index, e.target.value)}
                      placeholder="Enter ticker (e.g., AAPL)"
                      className="flex-1 bg-transparent text-white border-none outline-none text-lg"
                    />
                    <button
                      onClick={() => deleteTicker(index)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
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
    </main>
  );
}
