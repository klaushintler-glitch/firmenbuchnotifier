import { NextResponse } from 'next/server';
import { downloadDocument } from '@/services/firmenbuchService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key || key.trim() === '') {
    return NextResponse.json({ error: 'Document key is required' }, { status: 400 });
  }

  try {
    const doc = await downloadDocument(key);
    const isXml = doc.extension === 'xml' || doc.contentType?.includes('xml');
    let responseBody: string | Uint8Array;
    
    if (isXml) {
      // Decode base64 to UTF-8 string for XML files to prevent Next.js/Vercel serialization bugs
      responseBody = Buffer.from(doc.content, 'base64').toString('utf8');
    } else {
      // Keep binary Uint8Array for PDF and other binary formats to satisfy TypeScript BodyInit type
      responseBody = new Uint8Array(Buffer.from(doc.content, 'base64'));
    }
    
    // RFC 6266 compliant filename encoding
    const safeFilename = doc.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const encodedFilename = encodeURIComponent(doc.filename);
    const byteLength = typeof responseBody === 'string' 
      ? Buffer.byteLength(responseBody, 'utf8') 
      : responseBody.byteLength;

    return new Response(responseBody as any, {
      status: 200,
      headers: {
        'Content-Type': doc.contentType || (isXml ? 'application/xml' : 'application/pdf'),
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': byteLength.toString(),
      }
    });
  } catch (error: any) {
    console.error("API download error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
