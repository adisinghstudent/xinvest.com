import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI client for Grok (xAI)
// Note: You need to set XAI_API_KEY in your .env.local file
const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY || 'dummy-key',
    baseURL: 'https://api.x.ai/v1',
});

// Twitter API bearer token
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || 'dummy-token';

// Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: Request) {
    try {
        const { handle } = await request.json();

        if (!handle) {
            return NextResponse.json({ error: 'Handle is required' }, { status: 400 });
        }

        // Check if analysis already exists in Supabase
        const { data: existingAnalysis } = await supabase
            .from('analyses')
            .select('*')
            .eq('handle', handle)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (existingAnalysis) {
            console.log(`Using cached analysis for @${handle}`);
            return NextResponse.json({
                tickers: existingAnalysis.tickers,
                reasoning: existingAnalysis.reasoning,
                tweets: existingAnalysis.tweets,
                cached: true,
            });
        }

        // 1. Fetch last 20 tweets using Twitter API
        const tweets = await fetchTweetsFromAPI(handle);

        // 2. Analyze with Grok
        const completion = await client.chat.completions.create({
            model: 'grok-code-fast-1',
            messages: [
                {
                    role: 'system',
                    content: `You are a creative financial advisor and stock picker. Your job is to ALWAYS recommend exactly 10 stocks based on a user's personality, interests, and tweet content, WITH PORTFOLIO WEIGHTS.

IMPORTANT RULES:
1. You MUST return exactly 10 stock tickers with weights, no matter what
2. If tweets mention stocks directly, give those higher weights based on sentiment/conviction
3. If tweets don't mention stocks, infer from their interests and assign weights based on relevance
4. Weights should reflect: sentiment strength, frequency of mentions, conviction level, and relevance to their interests
5. ALL weights MUST sum to exactly 100 (representing 100% of portfolio)
6. Higher weights (15-20%) for stocks they're most bullish on or most relevant to their interests
7. Lower weights (5-8%) for diversification picks
8. Return ONLY valid US stock tickers (e.g., AAPL, TSLA, NVDA, etc.)

Return ONLY a JSON object with:
- "portfolio": an array of EXACTLY 10 objects, each with:
  - "ticker": string (e.g., "AAPL")
  - "weight": number (percentage, e.g., 15 for 15%)
- "reasoning": a 2-3 sentence string explaining the portfolio allocation strategy

Example format:
{
  "portfolio": [
    {"ticker": "AAPL", "weight": 20},
    {"ticker": "TSLA", "weight": 15},
    ...
  ],
  "reasoning": "Allocated higher weights to AI and tech stocks based on strong bullish sentiment in tweets."
}

CRITICAL: Weights MUST sum to 100. Do not include markdown formatting.`
                },
                {
                    role: 'user',
                    content: `Analyze these tweets from @${handle} and create a weighted portfolio of 10 stocks:\n\n${tweets.join('\n---\n')}`
                }
            ],
            temperature: 0.8,
        });

        const content = completion.choices[0].message.content;
        let result: any;
        try {
            // Clean up potential markdown code blocks if Grok adds them
            const cleanContent = content?.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanContent || '{}');

            // Validate that we have portfolio data
            if (!result.portfolio || !Array.isArray(result.portfolio) || result.portfolio.length === 0) {
                throw new Error('No portfolio in response');
            }

            // Validate weights sum to 100 (allow small rounding errors)
            const totalWeight = result.portfolio.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
            if (Math.abs(totalWeight - 100) > 1) {
                console.warn(`Weights sum to ${totalWeight}, normalizing to 100`);
                // Normalize weights to sum to 100
                result.portfolio = result.portfolio.map((item: any) => ({
                    ...item,
                    weight: (item.weight / totalWeight) * 100
                }));
            }

            // Extract tickers for backward compatibility
            result.tickers = result.portfolio.map((item: any) => item.ticker);
        } catch (e) {
            console.error('Failed to parse Grok response, trying again with simpler prompt:', content);

            // Make a second attempt with a more forceful prompt
            const retryCompletion = await client.chat.completions.create({
                model: 'grok-code-fast-1',
                messages: [
                    {
                        role: 'system',
                        content: `You MUST pick exactly 10 US stock tickers with weights (summing to 100). Return ONLY this format:
{"portfolio": [{"ticker": "AAPL", "weight": 15}, ...], "reasoning": "Brief explanation"}`
                    },
                    {
                        role: 'user',
                        content: `User @${handle} tweets: ${tweets.slice(0, 3).join(' | ')}. Create weighted portfolio.`
                    }
                ],
                temperature: 0.9,
            });

            try {
                const retryContent = retryCompletion.choices[0].message.content;
                const cleanRetry = retryContent?.replace(/```json/g, '').replace(/```/g, '').trim();
                result = JSON.parse(cleanRetry || '{}');

                // If still no portfolio, create equal weights
                if (!result.portfolio || !Array.isArray(result.portfolio) || result.portfolio.length === 0) {
                    throw new Error('Still no portfolio');
                }

                result.tickers = result.portfolio.map((item: any) => item.ticker);
            } catch (retryError) {
                console.error('Retry also failed, using emergency AI generation');
                // Last resort: Ask AI for tickers and assign equal weights
                const emergencyCompletion = await client.chat.completions.create({
                    model: 'grok-code-fast-1',
                    messages: [
                        {
                            role: 'user',
                            content: `Give me 10 popular US stock tickers as a JSON array. Format: ["AAPL", "MSFT", ...]`
                        }
                    ],
                    temperature: 0.5,
                });

                const emergencyContent = emergencyCompletion.choices[0].message.content;
                const tickersArray = JSON.parse(emergencyContent?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]');

                // Create equal-weighted portfolio
                result = {
                    portfolio: tickersArray.map((ticker: string) => ({
                        ticker,
                        weight: 10 // Equal weight: 100% / 10 stocks
                    })),
                    tickers: tickersArray,
                    reasoning: `Generated a diversified equal-weighted portfolio based on current market trends.`
                };
            }
        }

        // Store/Update in Supabase
        try {
            const { error } = await supabase
                .from('analyses')
                .upsert(
                    {
                        handle,
                        tweets,
                        tickers: result.tickers,
                        reasoning: result.reasoning,
                    },
                    { onConflict: 'handle' }
                );
            if (error) throw error;
            console.log(`Stored/Updated analysis for @${handle} in Supabase`);
        } catch (dbError) {
            console.error('Error storing in Supabase:', dbError);
            // Continue anyway, don't fail the response
        }

        // Log AI reasoning and picks
        console.log(`AI Reasoning for @${handle}:`, result.reasoning);
        console.log('Selected Tickers:', result.tickers);
        console.log('Tweets analyzed:', tweets);

        // Include tweets in response
        result.tweets = tweets;

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error in analyze route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function fetchTweetsFromAPI(handle: string): Promise<string[]> {
    try {
        // First, get user ID from username
        const userRes = await fetch(`https://api.twitter.com/2/users/by/username/${handle}`, {
            headers: {
                'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            },
        });

        if (!userRes.ok) {
            console.error('Failed to get user ID:', userRes.status, await userRes.text());
            return [];
        }

        const userData = await userRes.json();
        const userId = userData.data?.id;
        if (!userId) {
            console.error('User not found or invalid response:', userData);
            return [];
        }

        // Now, get tweets
        const tweetsRes = await fetch(`https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=text,created_at`, {
            headers: {
                'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
            },
        });

        if (!tweetsRes.ok) {
            console.error('Failed to get tweets:', tweetsRes.status, await tweetsRes.text());
            return [];
        }

        const tweetsData = await tweetsRes.json();
        const tweets = tweetsData.data?.map((tweet: any) => tweet.text) || [];

        console.log(`Fetched ${tweets.length} tweets for @${handle}`);
        return tweets;

    } catch (error) {
        console.error('Error fetching tweets from API:', error);
        return [];
    }
}
