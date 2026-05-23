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

    // Map company_fn from DB to fnr for frontend compatibility
    const mapped = (data || []).map((item: any) => ({
      ...item,
      fnr: item.company_fn
    }));

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
    const { fnr, company_name } = body;

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
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .insert({
        user_id: userId,
        company_fn: fnr,
        company_name
      })
      .select()
      .single();

    if (error) throw error;

    const mappedData = data ? { ...data, fnr: data.company_fn } : null;
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
