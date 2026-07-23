import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, basicEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

type Reminder = {
  id: string;
  household_id: string;
  title: string;
  remind_at: string;
  recurrence: string;
  target_user_id: string | null;
  last_fired_at: string | null;
};

// Sljedeće javljanje za ponavljajuće podsjetnike.
function nextOccurrence(fromISO: string, recurrence: string): string | null {
  const d = new Date(fromISO);
  switch (recurrence) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return d.toISOString();
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true; // Vercel Cron
  if (req.nextUrl.searchParams.get("secret") === secret) return true; // ručno / eksterni cron
  return false;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowISO = new Date().toISOString();

  const { data, error } = await supabase
    .from("reminders")
    .select(
      "id, household_id, title, remind_at, recurrence, target_user_id, last_fired_at",
    )
    .eq("status", "pending")
    .eq("notify_email", true)
    .lte("remind_at", nowISO);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const due = ((data as Reminder[]) ?? []).filter(
    (r) => !r.last_fired_at || r.last_fired_at < r.remind_at,
  );

  let fired = 0;
  const results: unknown[] = [];

  for (const r of due) {
    // Odredi primaoce (ciljani član ili cijelo domaćinstvo).
    let emails: string[] = [];
    if (r.target_user_id) {
      const { data: p } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", r.target_user_id)
        .single();
      if (p?.email) emails = [p.email];
    } else {
      const { data: m } = await supabase
        .from("household_members")
        .select("profiles(email)")
        .eq("household_id", r.household_id);
      const rows =
        (m as unknown as { profiles: { email: string | null } | null }[]) ?? [];
      emails = rows
        .map((x) => x.profiles?.email)
        .filter((e): e is string => !!e);
    }

    if (emails.length > 0) {
      const res = await sendEmail({
        to: emails,
        subject: `🔔 Podsjetnik: ${r.title}`,
        html: basicEmail("Podsjetnik", r.title),
      });
      results.push({ to: emails, ...res });
    } else {
      results.push({ warning: "nema email adrese", reminder: r.id });
    }

    // Ažuriraj podsjetnik: ponavljajući -> pomjeri, jednokratni -> gotov.
    const next = nextOccurrence(r.remind_at, r.recurrence);
    if (next) {
      await supabase
        .from("reminders")
        .update({ remind_at: next, last_fired_at: nowISO })
        .eq("id", r.id);
    } else {
      await supabase
        .from("reminders")
        .update({ status: "done", last_fired_at: nowISO })
        .eq("id", r.id);
    }
    fired++;
  }

  return NextResponse.json({ ok: true, checked: due.length, fired, results });
}
