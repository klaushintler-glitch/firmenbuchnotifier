import { NextResponse } from 'next/server';
import { getCompanyDocuments } from '@/services/firmenbuchService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fnr = searchParams.get('fnr');

  if (!fnr || fnr.trim() === '') {
    return NextResponse.json({ error: 'FNR is required' }, { status: 400 });
  }

  try {
    const results = await getCompanyDocuments(fnr);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("API documents error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
