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
    
    // Decode base64 to binary buffer
    const buffer = Buffer.from(doc.content, 'base64');
    
    // Return standard response with attachment headers
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': doc.contentType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.filename)}"`,
        'Content-Length': buffer.length.toString(),
      }
    });
  } catch (error: any) {
    console.error("API download error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
