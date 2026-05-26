import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabaseClient';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY || '');
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-fallback-secret';

// Helper to generate a secure encrypted token containing the email and expiration
function generateResetToken(email: string): string {
  const expiry = Date.now() + 3600 * 1000; // 1 hour expiration
  const payload = JSON.stringify({ email, expiry });
  const iv = crypto.randomBytes(16);
  // scryptSync needs a 32-byte key size for aes-256-cbc
  const key = crypto.scryptSync(SECRET, 'salt-reset', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Helper to decrypt and verify the token, returns the email if valid
function verifyResetToken(token: string): string | null {
  try {
    const [ivHex, encrypted] = token.split(':');
    if (!ivHex || !encrypted) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(SECRET, 'salt-reset', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const { email, expiry } = JSON.parse(decrypted);
    if (Date.now() > expiry) return null; // Token expired
    return email;
  } catch (e) {
    return null; // Invalid token structure or signature
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. ACTION: REQUEST RESET LINK
    if (action === 'request') {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: 'E-Mail-Adresse ist erforderlich' }, { status: 400 });
      }

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (profileError || !profile) {
        // For security, do not disclose if the email exists or not. 
        // Just return success so attackers can't enumerate users.
        return NextResponse.json({ success: true, message: 'Falls die E-Mail-Adresse registriert ist, wurde ein Link gesendet.' });
      }

      const token = generateResetToken(email.trim().toLowerCase());
      const host = request.headers.get('host') || 'firmenbuchnotifier.vercel.app';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const resetLink = `${protocol}://${host}/?reset_token=${encodeURIComponent(token)}`;

      const fromEmail = process.env.NOTIFICATION_EMAIL_FROM || 'onboarding@resend.dev';

      // Send the email via Resend
      const { error: mailError } = await resend.emails.send({
        from: `Firmenbuch Notifier <${fromEmail}>`,
        to: [email.trim().toLowerCase()],
        subject: 'Passwort zurücksetzen - Firmenbuch Notifier',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #1877F2; margin-top: 0;">Passwort zurücksetzen</h2>
            <p style="color: #4a5568; line-height: 1.6;">Sie haben angefordert, das Passwort für Ihr Konto beim Firmenbuch Notifier zurückzusetzen.</p>
            <p style="color: #4a5568; line-height: 1.6;">Klicken Sie auf den folgenden Button, um Ihr Passwort zu ändern. Dieser Link ist für <strong>1 Stunde</strong> gültig:</p>
            <div style="margin: 24px 0; text-align: center;">
              <a href="${resetLink}" style="background-color: #1877F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: bold; display: inline-block;">Passwort zurücksetzen</a>
            </div>
            <p style="color: #718096; font-size: 12px;">Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail einfach ignorieren.</p>
            <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
            <p style="color: #a0aec0; font-size: 11px; text-align: center;">Firmenbuch Notifier &copy; 2026</p>
          </div>
        `
      });

      if (mailError) {
        console.error("Resend mail error:", mailError);
        return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Falls die E-Mail-Adresse registriert ist, wurde ein Link gesendet.' });
    }

    // 2. ACTION: CONFIRM RESET PASSWORD
    if (action === 'confirm') {
      const { token, password } = body;
      if (!token || !password) {
        return NextResponse.json({ error: 'Token und Passwort sind erforderlich' }, { status: 400 });
      }
      if (password.length < 6) {
        return NextResponse.json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein' }, { status: 400 });
      }

      const email = verifyResetToken(token);
      if (!email) {
        return NextResponse.json({ error: 'Der Passwort-Link ist ungültig oder abgelaufen.' }, { status: 400 });
      }

      // Fetch profile id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Benutzerprofil wurde nicht gefunden.' }, { status: 400 });
      }

      // Update password using admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.id,
        { password }
      );

      if (updateError) {
        console.error("Admin password update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      // Automatically sign in the user by generating a session if needed,
      // but for security it's best to have them log in manually with their new password.
      return NextResponse.json({ success: true, message: 'Ihr Passwort wurde erfolgreich aktualisiert. Bitte melden Sie sich mit dem neuen Passwort an.' });
    }

    return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
