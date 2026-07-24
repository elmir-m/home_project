// -------- Manifest aplikacija (registar) --------
// Čist modul bez server-side importa da ga mogu koristiti i klijentske komponente
// (sidebar) i server komponente (dashboard, /apps). NOVA APLIKACIJA se doda ovdje
// i automatski se pojavi u navigaciji, dashboardu i registru — bez diranja ostalih.
export type AppManifest = {
  slug: string;
  name: string;
  icon: string;
  href: string;
  description: string;
  emits: string[]; // event tipovi koje objavljuje
  capabilities: string[]; // dijeljene sposobnosti koje koristi
};

export const BUILTIN_APPS: AppManifest[] = [
  { slug: "tasks", name: "Zadaci", icon: "✅", href: "/tasks", description: "Zadaci s rokom, prioritetom i zaduženjem.", emits: ["task.created", "task.completed"], capabilities: ["members", "reminders"] },
  { slug: "kanban", name: "Kanban", icon: "📋", href: "/kanban", description: "Tabla nad istim zadacima.", emits: [], capabilities: ["tasks"] },
  { slug: "calendar", name: "Kalendar", icon: "📅", href: "/calendar", description: "Događaji + zadaci + računi po datumu.", emits: ["event.created"], capabilities: ["tasks", "finance"] },
  { slug: "notes", name: "Bilješke", icon: "📝", href: "/notes", description: "Bilješke, tagovi, dnevnik, veze.", emits: ["note.created"], capabilities: ["links"] },
  { slug: "finance", name: "Finansije", icon: "💰", href: "/finance", description: "Troškovi, prihodi, računi, podjela.", emits: ["bill.created", "transaction.created"], capabilities: ["members", "calendar"] },
  { slug: "reminders", name: "Podsjetnici", icon: "🔔", href: "/reminders", description: "Jednokratni i ponavljajući, email.", emits: ["reminder.created"], capabilities: ["email", "members"] },
  { slug: "life", name: "Life admin", icon: "🗂️", href: "/life", description: "Evidencija, kontakti, liste.", emits: ["record.created"], capabilities: ["reminders"] },
  { slug: "shopping", name: "Kupovina", icon: "🛒", href: "/shopping", description: "Zajednička lista za kupovinu — nova aplikacija na platformi.", emits: ["shopping.added"], capabilities: ["members", "reminders"] },
];
