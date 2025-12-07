import { NextResponse } from 'next/server';
import { YahooFinance } from 'yahoo-finance2';

export async function POST(request: Request) {
    try {
        const { tickers } = await request.json();

        if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
            return NextResponse.json({ error: 'Tickers array is required' }, { status: 400 });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1); // 1 year history

        const yahooFinance = new YahooFinance();

        const tickerDataPromises = tickers.map(async (ticker: string) => {
            try {
                const queryOptions = {
                    period1: startDate,
                    period2: endDate,
                    interval: '1d' as const,
                };
                const data = await yahooFinance.historical(ticker, queryOptions);
                return { ticker, data: data || [] };
            } catch (e) {
                console.error(`Failed to fetch data for ${ticker}`, e);
                return { ticker, data: [] };
            }
        });

        const results = await Promise.all(tickerDataPromises);

        // Aggregate data
        const dateMap = new Map<string, number>();

        results.forEach(({ ticker, data }) => {
            if (data.length === 0) return;

            const startPrice = data[0].close; // close price
            const shares = 1000 / startPrice; // $1000 investment

            data.forEach((quote: any) => {
                const dateStr = quote.date.toISOString().split('T')[0];
                const currentVal = dateMap.get(dateStr) || 0;
                dateMap.set(dateStr, currentVal + (quote.close * shares));
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
