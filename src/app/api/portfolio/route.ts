import { NextResponse } from 'next/server';
const yahooFinance = require('yahoo-finance2').default;

export async function POST(request: Request) {
    try {
        const { tickers } = await request.json();

        if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
            return NextResponse.json({ error: 'Tickers array is required' }, { status: 400 });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1); // 1 year history

        const period1 = startDate.toISOString().split('T')[0];
        const period2 = endDate.toISOString().split('T')[0];

        const portfolioData: Record<string, number> = {};
        const tickerDataPromises = tickers.map(async (ticker: string) => {
            try {
                const result = await yahooFinance.historical(ticker, {
                    period1,
                    period2,
                    interval: '1d',
                });
                return { ticker, data: result };
            } catch (e) {
                console.error(`Failed to fetch data for ${ticker}`, e);
                return { ticker, data: [] };
            }
        });

        const results = await Promise.all(tickerDataPromises);

        // Aggregate data
        // We want a list of { date: 'YYYY-MM-DD', value: number }
        // We'll normalize to percentage growth or total value assuming $1000 invested in each at start.

        // First, map dates to total value
        const dateMap = new Map<string, number>();

        // Initialize with 0
        // We need to find the common dates.
        // A simple approach: Iterate through all results, add to map.

        results.forEach(({ ticker, data }) => {
            if (data.length === 0) return;

            const startPrice = data[0].close;
            const shares = 1000 / startPrice; // $1000 investment

            data.forEach((day: any) => {
                const dateStr = day.date.toISOString().split('T')[0];
                const currentVal = dateMap.get(dateStr) || 0;
                dateMap.set(dateStr, currentVal + (day.close * shares));
            });
        });

        // Convert map to array and sort
        const chartData = Array.from(dateMap.entries())
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({ chartData });

    } catch (error) {
        console.error('Error in portfolio route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
