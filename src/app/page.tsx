"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Twitter, Loader2 } from "lucide-react";


export default function Home() {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "analyzing" | "done">("idle");
  const [tickers, setTickers] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState<string>("");
  const [tweets, setTweets] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle) return;

    setLoading(true);
    setError("");
    setStep("analyzing");
    setTickers([]);
    setReasoning("");
    setTweets([]);

    try {
      // 1. Analyze Tweets
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });

      if (!analyzeRes.ok) throw new Error("Failed to analyze tweets");
      const analyzeData = await analyzeRes.json();

      if (analyzeData.error) throw new Error(analyzeData.error);

      setTickers(analyzeData.tickers);
      setReasoning(analyzeData.reasoning || "No reasoning provided.");
      setTweets(analyzeData.tweets || []);
      setStep("done");

    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStep("idle");
    } finally {
      setLoading(false);
    }
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
            Let Grok analyze your X (Twitter) personality and build your perfect stock portfolio.
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
              className="w-full bg-[#16181C] border border-[#333] text-white text-lg rounded-full py-4 pl-10 pr-14 focus:outline-none focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0] transition-all placeholder:text-gray-600"
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
            <p>Grok is reading the last 20 tweets...</p>
            <div className="h-1 w-64 bg-[#333] rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-[#1D9BF0] w-1/3 animate-progress"></div>
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Tweets Section */}
            <div className="bg-[#16181C] border border-[#333] rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Tweets Analyzed</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {tweets.map((tweet, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#0F0F0F] p-4 rounded-lg"
                  >
                    <p className="text-gray-300">{tweet}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tickers Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-2 text-[#1D9BF0]">
                <Twitter className="w-5 h-5" />
                <span className="font-medium">Grok's Picks for @{handle}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {tickers.map((ticker, i) => (
                  <motion.div
                    key={ticker}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-[#16181C] border border-[#333] rounded-xl p-4 text-center hover:border-[#1D9BF0] transition-colors cursor-default"
                  >
                    <span className="text-xl font-bold block">{ticker}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-[#16181C] border border-[#333] rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 text-[#1D9BF0]">🤖</span>
                Grok's Analysis
              </h2>
              <p className="text-gray-300 leading-relaxed">{reasoning}</p>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
