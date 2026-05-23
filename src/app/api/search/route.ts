import { NextResponse } from 'next/server';
import { searchCompany } from '@/services/firmenbuchService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.trim() === '') {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const results = await searchCompany(query);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("API search error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
