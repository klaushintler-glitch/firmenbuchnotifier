import { NextResponse } from 'next/server';
import { runCronCheck } from '@/bin/cron-check';

// Export GET handler to trigger the Firmenbuch check
export async function GET(request: Request) {
  // Validate Vercel Cron Secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runCronCheck();
    return NextResponse.json({ 
      success: true, 
      message: 'Firmenbuch update checker completed successfully' 
    });
  } catch (error: any) {
    console.error('[Cron API Route] Error running cron check:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
