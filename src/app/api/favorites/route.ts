import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseClient';
import { getCompanyDocuments } from '@/services/firmenbuchService';

// Helper to authenticate user from headers
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch (error) {
    console.error("Auth helper error:", error);
    return null;
  }
}

/**
 * GET: List all favorites for the authenticated user
 */
export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let docs: any[] = [];
    if (data && data.length > 0) {
      const fnrs = data.map((f: any) => f.company_fn);
      const { data: docsData, error: docsError } = await supabaseAdmin
        .from('tracked_documents')
        .select('fnr, document_name, inserted_at')
        .in('fnr', fnrs);
      
      if (!docsError && docsData) {
        docs = docsData;
      }
    }

    // Map company_fn from DB to fnr and attach tracked documents
    const mapped = (data || []).map((item: any) => {
      const companyDocs = docs.filter((d: any) => d.fnr === item.company_fn);
      return {
        ...item,
        fnr: item.company_fn,
        tracked_documents: companyDocs.map((d: any) => ({ 
          document_name: d.document_name,
          inserted_at: d.inserted_at
        }))
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("GET favorites error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST: Add a new favorite for the authenticated user (max 10)
 */
export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fnr, company_name, status, gericht } = body;

    if (!fnr || !company_name) {
      return NextResponse.json({ error: 'FNR und Firmenname sind erforderlich' }, { status: 400 });
    }

    // 1. Check if user already has 10 favorites
    const { count, error: countError } = await supabaseAdmin
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    if (count !== null && count >= 10) {
      return NextResponse.json({ error: 'Sie können maximal 10 Firmen favorisieren.' }, { status: 400 });
    }

    // 2. Check if already favorited (idempotent check using company_fn column)
    const { data: existingFav, error: checkError } = await supabaseAdmin
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('company_fn', fnr)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingFav) {
      return NextResponse.json({ success: true, message: 'Firma bereits favorisiert', data: existingFav });
    }

    // 3. Query Firmenbuch API for existing documents of this company and pre-populate tracked_documents
    try {
      const docs = await getCompanyDocuments(fnr);
      if (docs.length > 0) {
        const documentsToTrack = docs.map(d => ({
          fnr: fnr,
          document_key: d.key,
          document_name: d.dokumentart,
          published_date: d.eingereicht || null
        }));

        await supabaseAdmin
          .from('tracked_documents')
          .upsert(documentsToTrack, { onConflict: 'document_key' });
      }
    } catch (apiError) {
      console.warn(`[Seeding Warning] Failed to seed tracked documents for FNR ${fnr}:`, apiError);
    }

    // 4. Insert new favorite using company_fn instead of fnr
    const insertObj: any = {
      user_id: userId,
      company_fn: fnr,
      company_name: company_name
    };

    let insertData: any = null;
    let insertError: any = null;

    try {
      const { data, error } = await supabaseAdmin
        .from('favorites')
        .insert({
          ...insertObj,
          status: status || 'aktiv',
          gericht: gericht || ''
        })
        .select()
        .single();
      
      insertData = data;
      insertError = error;
    } catch (e) {
      insertError = e;
    }

    if (insertError) {
      // Code 42703 is Column does not exist in PostgREST/PostgreSQL
      if (insertError.code === '42703') {
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('favorites')
          .insert(insertObj)
          .select()
          .single();
        
        if (fallbackError) throw fallbackError;
        insertData = fallbackData;
      } else {
        throw insertError;
      }
    }

    const mappedData = insertData ? { ...insertData, fnr: insertData.company_fn } : null;
    return NextResponse.json({ success: true, data: mappedData });
  } catch (error: any) {
    console.error("POST favorite error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE: Remove a favorite for the authenticated user
 */
export async function DELETE(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fnr = searchParams.get('fnr');

  if (!fnr) {
    return NextResponse.json({ error: 'FNR ist erforderlich' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('company_fn', fnr);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Firma aus Favoriten entfernt' });
  } catch (error: any) {
    console.error("DELETE favorite error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH: Update favorite settings (e.g. email notifications on/off)
 */
export async function PATCH(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fnr, email_notifications } = body;

    if (!fnr || email_notifications === undefined) {
      return NextResponse.json({ error: 'FNR und email_notifications sind erforderlich' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('favorites')
      .update({ email_notifications })
      .eq('user_id', userId)
      .eq('company_fn', fnr)
      .select()
      .single();

    if (error) throw error;

    const mappedData = data ? { ...data, fnr: data.company_fn } : null;
    return NextResponse.json({ success: true, data: mappedData });
  } catch (error: any) {
    console.error("PATCH favorite error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
