import { NextResponse } from 'next/server';
import { getCompanyDocuments, DocumentInfo } from '@/services/firmenbuchService';

// 2-hour in-memory cache for company documents to minimize API requests
const documentsCache = new Map<string, { data: DocumentInfo[]; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 2; // 2 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fnr = searchParams.get('fnr');

  if (!fnr || fnr.trim() === '') {
    return NextResponse.json({ error: 'FNR is required' }, { status: 400 });
  }

  const cleanFnr = fnr.trim().toLowerCase();
  const cached = documentsCache.get(cleanFnr);

  // 1. If we have a valid non-expired cache, return it immediately
  if (cached && cached.expiry > Date.now()) {
    console.log(`[Cache Hit] Returning cached documents for: "${cleanFnr}"`);
    return NextResponse.json(cached.data);
  }

  try {
    console.log(`[Cache Miss/Expired] Fetching documents from API for: "${cleanFnr}"`);
    const results = await getCompanyDocuments(fnr);
    
    // Update cache
    documentsCache.set(cleanFnr, {
      data: results,
      expiry: Date.now() + CACHE_TTL
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error(`API documents error for FNR ${cleanFnr}:`, error);

    // 2. Resilience: If API fails (e.g., 429 rate limit or network down),
    // but we have cached data (even if expired), serve the stale cache as a fallback!
    if (cached) {
      console.warn(`[Cache Stale Fallback] Serving expired cached documents for FNR: "${cleanFnr}" due to API error.`);
      return NextResponse.json(cached.data);
    }

    const errorMsg = error.message || '';
    if (errorMsg.includes('429')) {
      return NextResponse.json({ 
        error: 'Zu viele Anfragen an das Firmenbuch (Rate-Limit überschritten). Bitte versuchen Sie es in einigen Minuten erneut.' 
      }, { status: 429 });
    }

    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}

