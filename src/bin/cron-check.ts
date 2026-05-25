import { supabaseAdmin } from '../services/supabaseClient';
import { getCompanyDocuments, type DocumentInfo } from '../services/firmenbuchService';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || '');

interface UserNotificationInfo {
  email: string;
  companyName: string;
  fnr: string;
}

export async function runCronCheck(): Promise<void> {
  console.log(`[Cron Job] Starting Firmenbuch update check at ${new Date().toISOString()}`);

  try {
    // 1. Get all distinct FNRs favorited by users
    const { data: favorites, error: favsError } = await supabaseAdmin
      .from('favorites')
      .select('company_fn, company_name, user_id');

    if (favsError) {
      throw new Error(`Failed to fetch favorites: ${favsError.message}`);
    }

    if (!favorites || favorites.length === 0) {
      console.log("[Cron Job] No favorited companies found. Exiting.");
      return;
    }

    // Map favorites by FNR for easy lookup
    const fnrMap = new Map<string, { company_name: string; user_ids: string[] }>();
    favorites.forEach(f => {
      const fnr = (f as any).company_fn;
      if (!fnrMap.has(fnr)) {
        fnrMap.set(fnr, { company_name: f.company_name, user_ids: [] });
      }
      fnrMap.get(fnr)!.user_ids.push(f.user_id);
    });

    const uniqueFnrs = Array.from(fnrMap.keys());
    console.log(`[Cron Job] Checking ${uniqueFnrs.length} unique companies...`);

    // 2. Fetch all currently tracked documents from database for these companies
    const { data: trackedDocs, error: trackedError } = await supabaseAdmin
      .from('tracked_documents')
      .select('document_key')
      .in('fnr', uniqueFnrs);

    if (trackedError) {
      throw new Error(`Failed to fetch tracked documents: ${trackedError.message}`);
    }

    const trackedKeys = new Set((trackedDocs || []).map(d => d.document_key));

    // 3. For each company, fetch the current documents from Firmenbuch API
    let newDocsCount = 0;
    const documentsToInsert: any[] = [];
    const notificationsToSend: { userEmail: string; companyName: string; fnr: string; doc: DocumentInfo }[] = [];

    for (const fnr of uniqueFnrs) {
      const companyInfo = fnrMap.get(fnr)!;
      try {
        const currentDocs = await getCompanyDocuments(fnr);
        
        for (const doc of currentDocs) {
          if (!trackedKeys.has(doc.key)) {
            console.log(`[Cron Job] New document detected! Key: ${doc.key}, Type: ${doc.dokumentart}`);
            newDocsCount++;

            // Track this document in DB
            documentsToInsert.push({
              fnr: fnr,
              document_key: doc.key,
              document_name: doc.dokumentart,
              published_date: doc.eingereicht || null
            });

            // Find all users favoriting this FNR and fetch their profiles
            const userIds = companyInfo.user_ids;
            const { data: profiles, error: profilesError } = await supabaseAdmin
              .from('profiles')
              .select('id, email')
              .in('id', userIds);

            if (profilesError) {
              console.error(`[Cron Job] Failed to load profiles for FNR ${fnr}:`, profilesError);
              continue;
            }

            profiles?.forEach(profile => {
              notificationsToSend.push({
                userEmail: profile.email,
                companyName: companyInfo.company_name,
                fnr: fnr,
                doc: doc
              });
            });
          }
        }
      } catch (apiError) {
        console.error(`[Cron Job] Error querying documents for FNR ${fnr}:`, apiError);
      }
    }

    // 4. Batch insert new documents to database
    if (documentsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('tracked_documents')
        .insert(documentsToInsert);

      if (insertError) {
        console.error("[Cron Job] Failed to insert new tracked documents to DB:", insertError);
      } else {
        console.log(`[Cron Job] Successfully tracked ${documentsToInsert.length} new documents in DB.`);
      }
    }

    // 5. Send notifications via Resend
    if (notificationsToSend.length > 0) {
      console.log(`[Cron Job] Sending ${notificationsToSend.length} email notifications...`);
      const fromEmail = process.env.NOTIFICATION_EMAIL_FROM || 'onboarding@resend.dev';
      const appUrl = process.env.APP_URL || 'https://firmenbuchnotifier.vercel.app';

      for (const notification of notificationsToSend) {
        try {
          const directLink = `${appUrl}?fnr=${encodeURIComponent(notification.fnr)}&doc=${encodeURIComponent(notification.doc.key)}`;
          
          await resend.emails.send({
            from: fromEmail,
            to: notification.userEmail,
            subject: `🔔 Firmenbuch Update: Neue Datei für ${notification.companyName}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
                <h2 style="color: #1877F2; border-bottom: 2px solid #1877F2; padding-bottom: 10px;">Firmenbuch Notifier Update</h2>
                <p>Hallo,</p>
                <p>für das von Ihnen favorisierte Unternehmen <strong>${notification.companyName} (Firmenbuchnummer: ${notification.fnr})</strong> wurde ein neues Dokument hochgeladen:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr style="background-color: #f9f9f9;">
                    <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd; width: 30%;">Dokumenttyp:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${notification.doc.dokumentart}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Aktenzeichen:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${notification.doc.az}</td>
                  </tr>
                  <tr style="background-color: #f9f9f9;">
                    <td style="padding: 10px; font-weight: bold; border: 1px solid #ddd;">Veröffentlichungsdatum:</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${notification.doc.eingereicht}</td>
                  </tr>
                </table>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${directLink}" style="background-color: #1877F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                    📄 Dokument in App öffnen & ansehen
                  </a>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 12px; color: #777; text-align: center;">Diese E-Mail wurde automatisch gesendet. Sie können Ihre Favoriten jederzeit im Web-Dashboard verwalten.</p>
              </div>
            `
          });
          console.log(`[Cron Job] Notification sent successfully to ${notification.userEmail}`);
        } catch (emailError) {
          console.error(`[Cron Job] Failed to send email to ${notification.userEmail}:`, emailError);
        }
      }
    } else {
      console.log("[Cron Job] No new updates detected. No emails sent.");
    }

  } catch (error) {
    console.error("[Cron Job] Critical error in cron-check:", error);
  }
}

// Run immediately if executed directly
if (process.argv[1] && process.argv[1].endsWith('cron-check.ts')) {
  runCronCheck();
}
