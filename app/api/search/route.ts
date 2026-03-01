import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: "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",
        query,
        search_depth: 'basic',
        max_results: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Search failed');
    }

    const data = await response.json();

    return NextResponse.json({ results: data.results || [] });

  } catch (error: any) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
