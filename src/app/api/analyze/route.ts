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
                    content: `You are an expert financial advisor. Quickly analyze the following last 3 tweets from a user and identify the top 5 stocks they are talking about or related to.
          Return ONLY a JSON object with:
          - "tickers": an array of up to 5 string tickers (e.g., ["AAPL", "TSLA", ...])
          - "reasoning": a string explaining the analysis.
          Do not include markdown formatting or additional explanations outside the JSON.`
                },
                {
                    role: 'user',
                    content: `Here are the last 3 tweets from @${handle}:\n\n${tweets.join('\n---\n')}`
                }
            ],
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        let result;
        try {
            // Clean up potential markdown code blocks if Grok adds them
            const cleanContent = content?.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanContent || '{"tickers": [], "reasoning": "Fallback: Unable to analyze tweets."}');
        } catch (e) {
            console.error('Failed to parse Grok response:', content);
            // Fallback if parsing fails
            result = {
                tickers: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'TSLA'],
                reasoning: 'Fallback: Parsing error occurred. Using default diversified portfolio.'
            };
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
        const tweetsRes = await fetch(`https://api.twitter.com/2/users/${userId}/tweets?max_results=20&tweet.fields=text,created_at`, {
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
