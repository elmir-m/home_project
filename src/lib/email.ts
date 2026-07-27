import { Resend } from "resend";

// Verifikovan domen (emurgic.info) — Resend šalje bilo kome.
const BRAND = "Moj dom";
const FROM = `${BRAND} <noreply@emurgic.info>`;
const ACCENT = "#4f46e5";

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

type Cta = { href: string; label: string };

// Brendirani, responsivni HTML okvir (table-based zbog email klijenata).
export function emailLayout(opts: {
  heading: string;
  contentHtml: string;
  cta?: Cta;
  preview?: string;
}) {
  const { heading, contentHtml, cta, preview } = opts;
  return `<!doctype html>
<html lang="bs">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f5f7;">
  ${preview ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:520px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e7ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:${ACCENT};padding:22px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">🏠 ${BRAND}</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#18181b;">${heading}</h1>
          <div style="color:#3f3f46;font-size:15px;line-height:1.6;">${contentHtml}</div>
          ${
            cta
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;"><tr><td style="border-radius:10px;background:${ACCENT};">
                  <a href="${cta.href}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">${cta.label}</a>
                </td></tr></table>
                <p style="margin:8px 0 0;font-size:12px;color:#a1a1aa;">Ako dugme ne radi, kopiraj: <a href="${cta.href}" style="color:${ACCENT};">${cta.href}</a></p>`
              : ""
          }
        </td></tr>
        <tr><td style="padding:16px 28px;background:#fafafa;border-top:1px solid #eee;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">Automatska poruka — <b style="color:#71717a;">${BRAND}</b>, zajednički kućni sistem.<br/>Postavke obavijesti možeš promijeniti u aplikaciji.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Jednostavan email: naslov + tekst (+ opcioni CTA button).
export function basicEmail(
  title: string,
  body: string,
  opts?: { cta?: Cta; preview?: string },
) {
  return emailLayout({
    heading: title,
    contentHtml: `<p style="margin:0;">${body}</p>`,
    cta: opts?.cta,
    preview: opts?.preview,
  });
}

// Sekcija s listom (za digest): naslov + stavke.
export function emailSection(title: string, items: string[]): string {
  if (!items.length) return "";
  return `<h3 style="margin:20px 0 8px;font-size:14px;font-weight:700;color:#18181b;">${title}</h3>
    <ul style="margin:0;padding-left:18px;color:#3f3f46;font-size:14px;line-height:1.7;">
      ${items.map((i) => `<li>${i}</li>`).join("")}
    </ul>`;
}
