'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PortfolioChart } from '@/components/PortfolioChart';
import Link from 'next/link';



export default function VaultPage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [tickerData, setTickerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('vaultTickers');
    if (saved) {
      setTickers(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (tickers.length > 0) {
      fetchTickerData();
    }
  }, [tickers]);

  const fetchTickerData = async () => {
    setLoading(true);
    setError('');
    try {
      const promises = tickers.map(async (ticker) => {
        try {
          const res = await fetch('/api/ticker-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker }),
          });
          if (res.ok) {
            const data = await res.json();
            return { ticker, chartData: data.chartData || [] };
          } else {
            return { ticker, chartData: [] };
          }
        } catch (e) {
          return { ticker, chartData: [] };
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



  return (
    <div className="w-full max-w-6xl min-h-screen flex items-center justify-center p-6 mx-auto">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Link href="/portfolio">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portfolio
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold">Vault</h1>
            <p className="text-muted-foreground">Your selected tickers over time</p>
          </div>
          <div></div>
        </div>

        {/* Tickers Charts */}
        {tickerData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tickerData.map((ticker) => (
              <Card key={ticker.ticker} className="bg-white">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-center">{ticker.ticker}</h3>
                  {ticker.chartData.length > 0 ? (
                    <PortfolioChart data={ticker.chartData} />
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-500">
                      No data available for {ticker.ticker}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p>Loading ticker data...</p>
          </div>
        )}

        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}