import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Calculate portfolio PnL for different time periods
async function calculatePortfolioPnL(tickers: string[], weights: { [key: string]: number }, timeRange: '1D' | '30D' | 'ALL') {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xinvest-com.vercel.app';

        // Fetch historical data for each ticker
        const promises = tickers.map(async (ticker) => {
            try {
                const res = await fetch(`${baseUrl}/api/ticker-history`, {
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
                console.error(`Error fetching ${ticker}:`, e);
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

export async function GET(request: Request) {
    try {
        // Verify cron secret (optional security)
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Starting PnL update for all public vaults...');

        // Get all public vaults
        const { data: vaults, error: vaultsError } = await supabase
            .from('vaults')
            .select('*')
            .eq('is_public', true);

        if (vaultsError) {
            console.error('Error fetching vaults:', vaultsError);
            return NextResponse.json({ error: 'Failed to fetch vaults' }, { status: 500 });
        }

        if (!vaults || vaults.length === 0) {
            return NextResponse.json({ message: 'No public vaults to update', updated: 0 });
        }

        console.log(`Found ${vaults.length} public vaults to update`);

        // Update PnL for each vault
        const updates = await Promise.all(
            vaults.map(async (vault) => {
                try {
                    console.log(`Updating vault ${vault.id} (${vault.twitter_handle || 'Anonymous'})...`);

                    const [pnl24h, pnl30d, pnlAllTime] = await Promise.all([
                        calculatePortfolioPnL(vault.tickers, vault.weights, '1D'),
                        calculatePortfolioPnL(vault.tickers, vault.weights, '30D'),
                        calculatePortfolioPnL(vault.tickers, vault.weights, 'ALL'),
                    ]);

                    const { error: updateError } = await supabase
                        .from('vaults')
                        .update({
                            pnl_24h: Number(pnl24h.toFixed(2)),
                            pnl_30d: Number(pnl30d.toFixed(2)),
                            pnl_all_time: Number(pnlAllTime.toFixed(2)),
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', vault.id);

                    if (updateError) {
                        console.error(`Error updating vault ${vault.id}:`, updateError);
                        return { id: vault.id, success: false, error: updateError.message };
                    }

                    console.log(`✅ Updated vault ${vault.id}: 24h=${pnl24h.toFixed(2)}%, 30d=${pnl30d.toFixed(2)}%, all=${pnlAllTime.toFixed(2)}%`);
                    return { id: vault.id, success: true };
                } catch (error: any) {
                    console.error(`Error processing vault ${vault.id}:`, error);
                    return { id: vault.id, success: false, error: error.message };
                }
            })
        );

        const successful = updates.filter((u) => u.success).length;
        const failed = updates.filter((u) => !u.success).length;

        console.log(`PnL update complete: ${successful} successful, ${failed} failed`);

        return NextResponse.json({
            message: 'PnL update complete',
            total: vaults.length,
            successful,
            failed,
            updates,
        });
    } catch (error: any) {
        console.error('Error in cron-update-pnl route:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
