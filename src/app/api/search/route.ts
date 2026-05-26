import { NextResponse } from 'next/server';
import { searchCompany, Company } from '@/services/firmenbuchService';
import { supabaseAdmin } from '@/services/supabaseClient';

const FNR_REGEX = /^\d{1,6}\s*[a-zA-Z]$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.trim() === '') {
    return NextResponse.json([], { status: 200 });
  }

  const trimmedQuery = query.trim();

  try {
    let results: Company[] = [];
    try {
      results = await searchCompany(trimmedQuery);
    } catch (e) {
      console.warn("Search company via API failed:", e);
    }

    // If no results are found and query looks like an FNR, try to construct a fallback company
    if (results.length === 0 && FNR_REGEX.test(trimmedQuery)) {
      const cleanFnr = trimmedQuery.replace(/\s+/g, '');
      
      // Look up if any user has favorited this company to get the correct name
      let companyName = `Firma (${cleanFnr})`;
      try {
        const { data } = await supabaseAdmin
          .from('favorites')
          .select('company_name')
          .eq('company_fn', cleanFnr)
          .limit(1)
          .maybeSingle();

        if (data && data.company_name) {
          companyName = data.company_name;
        }
      } catch (dbErr) {
        console.warn("Database lookup for FNR failed:", dbErr);
      }

      results = [{
        fnr: cleanFnr,
        name: companyName,
        sitz: 'Österreich',
        rechtsform: {
          code: 'Firma',
          text: 'Firmenbuch-Eintrag'
        },
        status: 'aktiv',
        gericht: 'Handelsgericht Wien'
      }];
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("API search error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
