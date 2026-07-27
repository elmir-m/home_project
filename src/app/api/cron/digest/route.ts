import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailLayout, emailSection } from "@/lib/email";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  if (req.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const section = emailSection;

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const freq = req.nextUrl.searchParams.get("freq") ?? "daily";
  if (freq !== "daily" && freq !== "weekly") {
    return NextResponse.json({ error: "freq must be daily|weekly" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const windowDays = freq === "weekly" ? 7 : 1;
  const today = ymd(now);
  const end = ymd(new Date(now.getTime() + windowDays * 86400000));
  const endISO = new Date(now.getTime() + windowDays * 86400000).toISOString();

  // Korisnici koji su uključili ovaj digest.
  const { data: prefs } = await supabase
    .from("notification_prefs")
    .select("user_id")
    .eq("digest", freq);

  let sent = 0;
  const results: unknown[] = [];

  for (const pref of prefs ?? []) {
    const uid = pref.user_id as string;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", uid)
      .single();
    if (!profile?.email) continue;

    const { data: memberships } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", uid);
    const hids = (memberships ?? []).map((m) => m.household_id);
    if (!hids.length) continue;

    const [{ data: tasks }, { data: bills }, { data: events }, { data: reminders }] =
      await Promise.all([
        supabase
          .from("tasks")
          .select("title, due_date")
          .in("household_id", hids)
          .neq("status", "done")
          .lte("due_date", end)
          .order("due_date", { ascending: true }),
        supabase
          .from("bills")
          .select("name, amount, due_date")
          .in("household_id", hids)
          .gte("due_date", today)
          .lte("due_date", end)
          .order("due_date", { ascending: true }),
        supabase
          .from("calendar_events")
          .select("title, event_date")
          .in("household_id", hids)
          .gte("event_date", today)
          .lte("event_date", end)
          .order("event_date", { ascending: true }),
        supabase
          .from("reminders")
          .select("title, remind_at")
          .in("household_id", hids)
          .eq("status", "pending")
          .lte("remind_at", endISO)
          .order("remind_at", { ascending: true }),
      ]);

    const body =
      section(
        "✅ Zadaci (dospjeli / uskoro)",
        (tasks ?? []).map(
          (t) => `${t.title}${t.due_date ? ` — ${t.due_date}` : ""}`,
        ),
      ) +
      section(
        "💳 Računi",
        (bills ?? []).map((b) => `${b.name} — ${b.amount} KM — ${b.due_date}`),
      ) +
      section(
        "📅 Događaji",
        (events ?? []).map((e) => `${e.title} — ${e.event_date}`),
      ) +
      section(
        "🔔 Podsjetnici",
        (reminders ?? []).map((r) => r.title),
      );

    if (!body) {
      results.push({ to: profile.email, skipped: "ništa za prikaz" });
      continue;
    }

    const label = freq === "weekly" ? "Sedmični" : "Dnevni";
    const html = emailLayout({
      heading: `${label} pregled`,
      contentHtml: `<p style="margin:0 0 4px;">Pozdrav ${profile.display_name ?? ""}, evo šta te čeka:</p>${body}`,
      preview: `${label} pregled — šta te čeka`,
    });

    const res = await sendEmail({
      to: profile.email,
      subject: `${label} pregled — Moj dom`,
      html,
    });
    results.push({ to: profile.email, ...res });
    sent++;
  }

  return NextResponse.json({ ok: true, freq, sent, results });
}
