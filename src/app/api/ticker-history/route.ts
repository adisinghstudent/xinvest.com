import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function POST(request: Request) {
    try {
        const { ticker, timeRange = '1Y' } = await request.json();

        console.log('Fetching data for ticker:', ticker, 'timeRange:', timeRange);

        if (!ticker || typeof ticker !== 'string') {
            return NextResponse.json({ error: 'Ticker string is required' }, { status: 400 });
        }

        const endDate = new Date();
        const startDate = new Date();

        // Set start date based on time range
        switch (timeRange) {
            case '1M':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case '3M':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case '6M':
                startDate.setMonth(endDate.getMonth() - 6);
                break;
            case '1Y':
            default:
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
        }

        console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString());

        const queryOptions = {
            period1: startDate,
            period2: endDate,
            interval: '1d' as const,
        };

        console.log('Calling Yahoo Finance API...');
        const data: any = await yahooFinance.historical(ticker, queryOptions);
        console.log('Received data points:', data?.length || 0);

        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log('No data returned for ticker:', ticker);
            return NextResponse.json({ chartData: [] });
        }

        const chartData = data.map((quote: any) => ({
            date: quote.date.toISOString().split('T')[0],
            value: quote.close
        }));

        console.log('Successfully processed', chartData.length, 'data points for', ticker);
        return NextResponse.json({ chartData });

    } catch (error: any) {
        console.error('Error in ticker-history route for ticker:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);

        return NextResponse.json({
            error: 'Failed to fetch ticker data',
            message: error?.message || 'Unknown error',
            chartData: []
        }, { status: 500 });
    }
}