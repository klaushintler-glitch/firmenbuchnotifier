import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/services/supabaseClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || 'https://firmenbuchnotify.at';
  
  // 1. Get all tracked/favorited FNRs from the database to include them in the sitemap
  let companyUrls: MetadataRoute.Sitemap = [];
  try {
    const { data } = await supabaseAdmin
      .from('favorites')
      .select('company_fn')
      .order('created_at', { ascending: false });
      
    if (data && data.length > 0) {
      // Get unique FNRs to prevent duplicate sitemap entries
      const uniqueFnrs = Array.from(new Set(data.map(item => item.company_fn.replace(/\s+/g, ''))));
      companyUrls = uniqueFnrs.map(fnr => ({
        url: `${baseUrl}/firma/${fnr}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (e) {
    console.warn("[Sitemap Generation] Failed to fetch tracked companies from DB:", e);
  }

  // Root homepage route
  const routes = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...companyUrls
  ];

  return routes;
}
