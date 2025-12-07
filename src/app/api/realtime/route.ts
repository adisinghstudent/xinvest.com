import { NextResponse } from 'next/server';
import { YahooFinance } from 'yahoo-finance2';

export async function POST(request: Request) {
    try {
        const { tickers } = await request.json();

        if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
            return NextResponse.json({ error: 'Tickers array is required' }, { status: 400 });
        }

        const yahooFinance = new YahooFinance();

        const tickerDataPromises = tickers.map(async (ticker: string) => {
            try {
                const quote = await yahooFinance.quote(ticker);
                return {
                    ticker,
                    price: quote.regularMarketPrice || 0,
                    change: quote.regularMarketChangePercent || 0,
                    volume: quote.regularMarketVolume || 0
                };
            } catch (e) {
                console.error(`Failed to fetch realtime data for ${ticker}`, e);
                return { ticker, price: 0, change: 0, volume: 0 };
            }
        });

        const results = await Promise.all(tickerDataPromises);

        return NextResponse.json({ data: results });

    } catch (error) {
        console.error('Error in realtime route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}