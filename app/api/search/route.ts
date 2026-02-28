import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

const TAVILY_KEYS = [
  "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",
  "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",
  "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",
  "49e71a1c496ef356aef771e707d8658febee5aab"
];

// Simple rotation based on timestamp
const getApiKey = () => {
  const index = Math.floor(Date.now() / 1000) % TAVILY_KEYS.length;
  return TAVILY_KEYS[index];
};

export async function POST(req: Request) {
  try {
    const { query, userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getFirebaseDb();
    const userStatsRef = doc(db, 'userStats', userId);
    const userStatsSnap = await getDoc(userStatsRef);
    
    const today = new Date().toISOString().split('T')[0];
    let stats = userStatsSnap.exists() ? userStatsSnap.data() : { lastResetDate: today, webSearchCount: 0 };

    // Reset count if it's a new day
    if (stats.lastResetDate !== today) {
      stats = { lastResetDate: today, webSearchCount: 0 };
      await setDoc(userStatsRef, stats);
    }

    // Check limit
    if (stats.webSearchCount >= 50) {
      return NextResponse.json({ 
        error: 'Daily limit reached', 
        message: 'You have used all 50 web searches for today. Please try again tomorrow! 🏔️' 
      }, { status: 429 });
    }

    const apiKey = getApiKey();

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Tavily Search failed');
    }

    const data = await response.json();

    // Increment count on success
    await updateDoc(userStatsRef, {
      webSearchCount: increment(1)
    });

    return NextResponse.json({
      ...data,
      remainingCredits: 50 - (stats.webSearchCount + 1)
    });
  } catch (error: any) {
    console.error('Tavily Search Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
