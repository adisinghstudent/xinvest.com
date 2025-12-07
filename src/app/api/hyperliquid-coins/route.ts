import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'assetCtxs',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // data is array of { name: string, ... }
    const coins = data.map((asset: any) => asset.name);

    return NextResponse.json({ coins });
  } catch (error) {
    console.error('Error fetching Hyperliquid coins:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}