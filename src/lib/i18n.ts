// Lokalizacija — dijeljeni rječnik (client i server). Bez server importa.

export type Locale = "bs" | "en";
export const DEFAULT_LOCALE: Locale = "bs";
export const LOCALES: { code: Locale; label: string }[] = [
  { code: "bs", label: "Bosanski" },
  { code: "en", label: "English" },
];

// BCP-47 oznaka za Intl (datumi, brojevi).
export function localeTag(locale: Locale): string {
  return locale === "en" ? "en-US" : "bs-BA";
}

type Dict = Record<string, string>;

const bs: Dict = {
  // Navigacija
  "nav.dashboard": "Danas",
  "group.admin": "Administracija",
  "group.settings": "Postavke",
  "nav.members": "Članovi",
  "nav.apps": "Aplikacije",
  "nav.automations": "Automatizacije",
  "nav.profile": "Moj profil",
  "nav.settings": "Postavke",
  // Nazivi aplikacija
  "app.tasks": "Zadaci",
  "app.kanban": "Kanban",
  "app.calendar": "Kalendar",
  "app.notes": "Bilješke",
  "app.finance": "Finansije",
  "app.reminders": "Podsjetnici",
  "app.life": "Kućna evidencija",
  "app.shopping": "Kupovina",
  "app.chat": "Chat",
  // Gornja traka
  "topbar.search": "Traži kroz sve…",
  "topbar.menu": "Meni",
  "topbar.myProfile": "Moj profil",
  "topbar.notifications": "Notifikacije",
  "topbar.help": "Vodič / pomoć",
  "topbar.logout": "Odjava",
  "role.owner": "vlasnik",
  "role.member": "član",
  "notif.empty": "Nemaš notifikacija.",
  "notif.accept": "Prihvati",
  "notif.decline": "Odbij",
  "notif.remove": "Ukloni",
  "time.now": "upravo sad",
  "time.min": "prije {n} min",
  "time.hour": "prije {n} h",
  "qc.button": "Brzi upis",
  "qc.type.task": "Zadatak",
  "qc.type.note": "Bilješka",
  "qc.type.reminder": "Podsjetnik",
  "qc.placeholder": "Upiši i pritisni Enter…",
  "qc.hint.reminder": "Podsjetnik se postavlja za 1h (uredi u modulu).",
  "qc.hint.default": "Kreira se odmah u odabranom modulu.",
  "qc.add": "Dodaj",
  // Zajedničko
  "common.save": "Sačuvaj",
  "common.saving": "Čuvam…",
  "common.close": "Zatvori",
  // Postavke
  "settings.title": "Postavke",
  "settings.loggedAs": "Prijavljen kao {email}. Ove postavke vrijede samo za tebe.",
  "appearance.title": "Izgled",
  "appearance.fontSize": "Veličina slova",
  "font.sm": "Mala",
  "font.md": "Srednja",
  "font.lg": "Velika",
  "appearance.accent": "Akcentna boja",
  "appearance.note": "Vezano za tvoj nalog — vrijedi na svim uređajima. Primjenjuje se odmah.",
  "language.title": "Jezik",
  "language.note": "Jezik aplikacije za tvoj nalog.",
  "notif.title": "Email obavijesti",
  "notif.reminders": "Podsjetnici",
  "notif.reminders.desc": "Kada podsjetnik dospije.",
  "notif.tasks": "Zadaci",
  "notif.tasks.desc": "Kada ti je zadatak dodijeljen.",
  "notif.bills": "Računi",
  "notif.bills.desc": "Kada račun uskoro dospijeva.",
  "notif.shared": "Dijeljenje",
  "notif.shared.desc": "Kada je nešto podijeljeno s tobom.",
  "notif.digest": "Sažetak (digest)",
  "notif.digest.desc": "Povremeni email s pregledom onoga što slijedi.",
  "digest.none": "Isključeno",
  "digest.daily": "Dnevni",
  "digest.weekly": "Sedmični",
  "settings.emailFooter":
    "Emailove šaljemo s verifikovanog domena (emurgic.info) — stižu svim članovima.",
  // Onboarding domaćinstva
  "ob.welcome": "Dobrodošao/la{name}! 👋",
  "ob.subtitle":
    "Da bi počeo/la, izaberi jedno: napravi svoje domaćinstvo ili se pridruži postojećem.",
  "ob.create.title": "Napravi svoje domaćinstvo",
  "ob.create.desc":
    "Postaješ vlasnik. Kasnije možeš pozvati ukućane da ti se pridruže.",
  "ob.create.nameLabel": "Naziv domaćinstva",
  "ob.create.placeholder": "npr. Porodica Murgić",
  "ob.create.btn": "Napravi domaćinstvo",
  "ob.create.pending": "Kreiram…",
  "ob.join.title": "Pridruži se postojećem",
  "ob.join.desc":
    "Ako neko od ukućana već ima domaćinstvo, neka te pozove na tvoj email:",
  "ob.join.bell":
    "Kad pozivnica stigne, vidjet ćeš je na zvonu gore desno i moći je prihvatiti jednim klikom.",
  // Help vodič
  "help.back": "Nazad",
  "help.next": "Dalje",
  "help.finish": "Završi",
  "help.skip": "Preskoči vodič",
  "help.s1.t": "Dobrodošao u „Moj dom“",
  "help.s1.b":
    "Ovo je zajednički sistem za cijelo domaćinstvo — zadaci, kalendar, finansije, podsjetnici, chat i još mnogo toga, sve na jednom mjestu i dijeljeno među ukućanima.",
  "help.s2.t": "Danas",
  "help.s2.b":
    "Početni ekran ti pokazuje šta te čeka danas: dospjele zadatke, događaje, račune i podsjetnike na jednom pogledu.",
  "help.s3.t": "Zadaci i Kanban",
  "help.s3.b":
    "Dodaj zadatke s rokom, prioritetom i zaduženom osobom. Ista lista se vidi i kao Kanban tabla za lakše praćenje.",
  "help.s4.t": "Kalendar",
  "help.s4.b":
    "Događaji, zadaci s rokom i računi se automatski pojavljuju po danima. Klik na dan ili događaj za dodavanje/uređivanje.",
  "help.s5.t": "Finansije",
  "help.s5.b":
    "Prati troškove i prihode, računi s rokovima i budžeti s napretkom. Dospjeli računi te podsjete i emailom.",
  "help.s6.t": "Podsjetnici i Kućna evidencija",
  "help.s6.b":
    "Postavi jednokratne ili ponavljajuće podsjetnike (stižu i mejlom), te čuvaj dokumente, garancije i kontakte.",
  "help.s7.t": "Chat",
  "help.s7.b":
    "Dopisuj se s ukućanima u realnom vremenu — poruke stižu odmah svima u domaćinstvu.",
  "help.s8.t": "Članovi",
  "help.s8.b":
    "Pozovi ukućane u domaćinstvo (na njihov email). Kao vlasnik možeš i birati koje aplikacije ko vidi.",
  "help.s9.t": "Postavke po tvojoj mjeri",
  "help.s9.b":
    "U Postavkama biraš temu, veličinu slova, akcentnu boju i jezik — vezano za tvoj nalog. Ovaj vodič uvijek možeš ponovo otvoriti klikom na „?“ gore.",
  // Dashboard (Danas)
  "dash.welcome":
    "✓ Domaćinstvo je kreirano. Dobrodošao/la! Pozovi ukućane preko „Članovi“.",
  "dash.card.tasks": "Zadaci — dospjeli / danas",
  "dash.card.calendar": "Danas u kalendaru",
  "dash.card.bills": "Računi — narednih 7 dana",
  "dash.card.reminders": "Podsjetnici — uskoro",
  "dash.open": "otvori →",
  "dash.empty": "Ništa za sad 🎉",
  "dash.household": "Domaćinstvo",
  "dash.household.link": "članovi / pozovi →",
  "dash.household.none": "Nema domaćinstva.",
  "dash.activity": "Nedavna aktivnost",
  "dash.activity.empty":
    "Još nema aktivnosti. Kad neko doda zadatak, račun ili bilješku, pojaviće se ovdje.",
};

const en: Dict = {
  "nav.dashboard": "Today",
  "group.admin": "Administration",
  "group.settings": "Settings",
  "nav.members": "Members",
  "nav.apps": "Apps",
  "nav.automations": "Automations",
  "nav.profile": "My profile",
  "nav.settings": "Settings",
  "app.tasks": "Tasks",
  "app.kanban": "Kanban",
  "app.calendar": "Calendar",
  "app.notes": "Notes",
  "app.finance": "Finances",
  "app.reminders": "Reminders",
  "app.life": "Home records",
  "app.shopping": "Shopping",
  "app.chat": "Chat",
  "topbar.search": "Search everything…",
  "topbar.menu": "Menu",
  "topbar.myProfile": "My profile",
  "topbar.notifications": "Notifications",
  "topbar.help": "Guide / help",
  "topbar.logout": "Log out",
  "role.owner": "owner",
  "role.member": "member",
  "notif.empty": "No notifications.",
  "notif.accept": "Accept",
  "notif.decline": "Decline",
  "notif.remove": "Remove",
  "time.now": "just now",
  "time.min": "{n} min ago",
  "time.hour": "{n}h ago",
  "qc.button": "Quick add",
  "qc.type.task": "Task",
  "qc.type.note": "Note",
  "qc.type.reminder": "Reminder",
  "qc.placeholder": "Type and press Enter…",
  "qc.hint.reminder": "Reminder is set for 1h from now (edit in the module).",
  "qc.hint.default": "Created immediately in the selected module.",
  "qc.add": "Add",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.close": "Close",
  "settings.title": "Settings",
  "settings.loggedAs": "Signed in as {email}. These settings apply only to you.",
  "appearance.title": "Appearance",
  "appearance.fontSize": "Font size",
  "font.sm": "Small",
  "font.md": "Medium",
  "font.lg": "Large",
  "appearance.accent": "Accent color",
  "appearance.note":
    "Tied to your account — applies on all devices. Takes effect immediately.",
  "language.title": "Language",
  "language.note": "App language for your account.",
  "notif.title": "Email notifications",
  "notif.reminders": "Reminders",
  "notif.reminders.desc": "When a reminder is due.",
  "notif.tasks": "Tasks",
  "notif.tasks.desc": "When a task is assigned to you.",
  "notif.bills": "Bills",
  "notif.bills.desc": "When a bill is due soon.",
  "notif.shared": "Sharing",
  "notif.shared.desc": "When something is shared with you.",
  "notif.digest": "Digest",
  "notif.digest.desc": "Occasional email with an overview of what's coming.",
  "digest.none": "Off",
  "digest.daily": "Daily",
  "digest.weekly": "Weekly",
  "settings.emailFooter":
    "Emails are sent from a verified domain (emurgic.info) — they reach all members.",
  "ob.welcome": "Welcome{name}! 👋",
  "ob.subtitle":
    "To get started, choose one: create your own household or join an existing one.",
  "ob.create.title": "Create your household",
  "ob.create.desc":
    "You become the owner. You can invite household members to join later.",
  "ob.create.nameLabel": "Household name",
  "ob.create.placeholder": "e.g. The Smith Family",
  "ob.create.btn": "Create household",
  "ob.create.pending": "Creating…",
  "ob.join.title": "Join an existing one",
  "ob.join.desc":
    "If someone in your household already has one, have them invite your email:",
  "ob.join.bell":
    "When the invite arrives, you'll see it on the bell top-right and can accept it in one click.",
  "help.back": "Back",
  "help.next": "Next",
  "help.finish": "Finish",
  "help.skip": "Skip guide",
  "help.s1.t": "Welcome to “Moj dom”",
  "help.s1.b":
    "This is a shared system for your whole household — tasks, calendar, finances, reminders, chat and much more, all in one place and shared among members.",
  "help.s2.t": "Today",
  "help.s2.b":
    "The home screen shows what's ahead today: due tasks, events, bills and reminders at a glance.",
  "help.s3.t": "Tasks and Kanban",
  "help.s3.b":
    "Add tasks with a due date, priority and assignee. The same list also appears as a Kanban board.",
  "help.s4.t": "Calendar",
  "help.s4.b":
    "Events, due tasks and bills show up automatically by day. Click a day or event to add/edit.",
  "help.s5.t": "Finances",
  "help.s5.b":
    "Track expenses and income, bills with due dates and budgets with progress. Due bills also remind you by email.",
  "help.s6.t": "Reminders and Home records",
  "help.s6.b":
    "Set one-off or recurring reminders (also by email), and keep documents, warranties and contacts.",
  "help.s7.t": "Chat",
  "help.s7.b":
    "Message your household in real time — messages arrive instantly for everyone.",
  "help.s8.t": "Members",
  "help.s8.b":
    "Invite people to your household (by email). As the owner you can also choose which apps each member sees.",
  "help.s9.t": "Settings your way",
  "help.s9.b":
    "In Settings you pick the theme, font size, accent color and language — tied to your account. You can reopen this guide anytime via the “?” at the top.",
  "dash.welcome":
    "✓ Household created. Welcome! Invite your household via “Members”.",
  "dash.card.tasks": "Tasks — due / today",
  "dash.card.calendar": "Today in calendar",
  "dash.card.bills": "Bills — next 7 days",
  "dash.card.reminders": "Reminders — soon",
  "dash.open": "open →",
  "dash.empty": "Nothing for now 🎉",
  "dash.household": "Household",
  "dash.household.link": "members / invite →",
  "dash.household.none": "No household.",
  "dash.activity": "Recent activity",
  "dash.activity.empty":
    "No activity yet. When someone adds a task, bill or note, it will show up here.",
};

const DICTS: Record<Locale, Dict> = { bs, en };

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const s = DICTS[locale]?.[key] ?? DICTS.bs[key] ?? key;
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : "",
  );
}
