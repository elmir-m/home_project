import { Resend } from "resend";

// Free tier Resend: šalje sa onboarding@resend.dev i (bez verifikovanog domena)
// samo na email adresu vlasnika naloga. Za slanje svima -> verifikuj domen u Resendu.
const FROM = "Home OS <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY nije postavljen — preskačem email.");
    return { skipped: true };
  }
  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) {
    console.error("Resend greška:", error);
    return { error };
  }
  return { data };
}

export function basicEmail(title: string, body: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="margin:0 0 8px">${title}</h2>
    <p style="color:#444;font-size:15px;line-height:1.5">${body}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#999;font-size:12px">Home OS · automatska poruka</p>
  </div>`;
}
