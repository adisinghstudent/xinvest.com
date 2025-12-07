import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Calculate portfolio PnL for different time periods
async function calculatePortfolioPnL(tickers: string[], weights: { [key: string]: number }, timeRange: '1D' | '30D' | 'ALL') {
    try {
        // Fetch historical data for each ticker
        const promises = tickers.map(async (ticker) => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ticker-history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ticker,
                        timeRange: timeRange === '1D' ? '1M' : timeRange === '30D' ? '3M' : '1Y'
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    return { ticker, chartData: data.chartData || [] };
                }
                return { ticker, chartData: [] };
            } catch (e) {
                return { ticker, chartData: [] };
            }
        });

        const results = await Promise.all(promises);

        // Calculate weighted PnL
        let totalPnL = 0;
        let validTickers = 0;

        results.forEach(({ ticker, chartData }) => {
            if (chartData.length < 2) return;

            const weight = weights[ticker] || 0;
            if (weight === 0) return;

            // Get the appropriate time range
            let startIndex = 0;
            if (timeRange === '1D') {
                // Last 2 data points (today vs yesterday)
                startIndex = Math.max(0, chartData.length - 2);
            } else if (timeRange === '30D') {
                // Approximately 30 days ago (assuming daily data)
                startIndex = Math.max(0, chartData.length - 30);
            }
            // For 'ALL', use startIndex = 0

            const startPrice = chartData[startIndex].value;
            const endPrice = chartData[chartData.length - 1].value;

            const tickerPnL = ((endPrice - startPrice) / startPrice) * 100;
            totalPnL += tickerPnL * (weight / 100);
            validTickers++;
        });

        return validTickers > 0 ? totalPnL : 0;
    } catch (error) {
        console.error('Error calculating PnL:', error);
        return 0;
    }
}

export async function POST(request: Request) {
    try {
        const { vaultId } = await request.json();

        if (!vaultId) {
            return NextResponse.json({ error: 'Vault ID required' }, { status: 400 });
        }

        // Get vault data
        const { data: vault, error: vaultError } = await supabase
            .from('vaults')
            .select('*')
            .eq('id', vaultId)
            .single();

        if (vaultError || !vault) {
            return NextResponse.json({ error: 'Vault not found' }, { status: 404 });
        }

        // Calculate PnL for different time periods
        const [pnl24h, pnl30d, pnlAllTime] = await Promise.all([
            calculatePortfolioPnL(vault.tickers, vault.weights, '1D'),
            calculatePortfolioPnL(vault.tickers, vault.weights, '30D'),
            calculatePortfolioPnL(vault.tickers, vault.weights, 'ALL'),
        ]);

        // Update vault with calculated PnL
        const { error: updateError } = await supabase
            .from('vaults')
            .update({
                pnl_24h: pnl24h,
                pnl_30d: pnl30d,
                pnl_all_time: pnlAllTime,
                updated_at: new Date().toISOString(),
            })
            .eq('id', vaultId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update PnL' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            pnl: {
                pnl_24h: pnl24h,
                pnl_30d: pnl30d,
                pnl_all_time: pnlAllTime,
            },
        });
    } catch (error: any) {
        console.error('Error in update-pnl route:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
