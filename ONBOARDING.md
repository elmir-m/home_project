# Moj dom — vodič kroz projekat (ONBOARDING)

Zajednički kućni sistem za domaćinstvo: zadaci, kanban, kalendar, bilješke,
finansije, podsjetnici, kućna evidencija, kupovina — sve povezano, dijeljeno
među članovima, s email obavijestima i platformom za nove aplikacije.

- **Live:** https://home-project-ruddy.vercel.app
- **Repo:** github.com/elmir-m/home_project

---

## 1. Tehnološki stack

| Sloj | Tehnologija | Zašto |
|------|-------------|-------|
| Frontend + Backend | **Next.js 16 (App Router), React 19, TypeScript** | Jedan framework za UI i server (server komponente, server actions, API rute) |
| Baza / Auth / Storage / Realtime | **Supabase (PostgreSQL)** | Relaciona baza (sve povezano), JWT auth, RLS, storage, realtime — jedan servis |
| Stilovi | **Tailwind CSS v4** | Utility pristup, light/dark preko `data-theme` |
| Email | **Resend** (verifikovan domen) | Podsjetnici, digest, pozivnice |
| Ikone | **lucide-react** | Čiste SVG ikone |
| Hosting | **Vercel** + **cron-job.org** | Auto-deploy s GitHuba; zakazani poslovi |

---

## 2. Struktura koda

```
src/
├─ middleware.ts               # osvježava Supabase sesiju + štiti /dashboard
├─ app/
│  ├─ layout.tsx               # root <html>, fontovi, no-flash tema
│  ├─ globals.css              # Tailwind, tema, globalni stilovi
│  ├─ page.tsx                 # "/" → redirect /dashboard
│  ├─ login|register|forgot/   # javne auth stranice
│  ├─ auth/confirm/route.ts    # potvrda emaila (verifyOtp)
│  ├─ auth/reset/page.tsx      # postavljanje nove lozinke
│  ├─ invite/[token]/          # prihvat pozivnice u domaćinstvo
│  ├─ api/cron/
│  │  ├─ reminders/route.ts    # šalje dospjele podsjetnike (email)
│  │  └─ digest/route.ts       # dnevni/sedmični sažetak
│  └─ (app)/                   # ROUTE GROUP: sve prijavljene stranice
│     ├─ layout.tsx            # sidebar + topbar + realtime + auth guard
│     ├─ dashboard|tasks|kanban|calendar|notes/
│     ├─ finance|reminders|life|shopping/
│     ├─ members|apps|automations|settings|profile|search/
│     └─ quick-actions.ts      # brzi upis (dijeljena server akcija)
├─ components/                 # dijeljene UI komponente
│  ├─ sidebar.tsx  top-bar.tsx  modal.tsx  submit-button.tsx
│  ├─ theme-toggle.tsx  quick-capture.tsx  realtime-refresh.tsx  app-icon.tsx
└─ lib/                        # logika bez UI-a
   ├─ supabase/{server,client,admin,middleware}.ts
   ├─ apps.ts  platform.ts  household.ts  visibility.ts
   └─ email.ts  auth-errors.ts
supabase/migrations/           # 0001…0015 — verzionisana šema (idempotentna)
```

### Konvencija po modulu (dosljedna svuda)
- **`page.tsx`** — server komponenta: dohvat podataka + prikaz.
- **`actions.ts`** — server actions (`"use server"`): create / edit / delete.
- **`*-form.tsx`** — klijentska komponenta (`"use client"`): modalna forma.

Standardni App Router obrazac: **server po defaultu, klijent samo za interaktivnost**.

---

## 3. Tri Supabase klijenta (namjerno razdvojena)

| Fajl | Kontekst | RLS |
|------|----------|-----|
| `lib/supabase/server.ts` | Server komponente / akcije (sesija iz kolačića) | **Poštuje RLS** |
| `lib/supabase/client.ts` | Browser (realtime, upload, reset) | Poštuje RLS |
| `lib/supabase/admin.ts` | Samo server (cron, kreiranje člana) — service_role | **Zaobilazi RLS** |

> `admin.ts` se NIKAD ne smije koristiti u klijentskom kodu.

---

## 4. Sigurnost

- **Auth:** Supabase izdaje **JWT** (access + refresh) u **httpOnly kolačićima**;
  `middleware.ts` osvježava sesiju. JWT se ne piše ručno.
- **RLS (Row Level Security):** uključen na svakoj tabeli. Korisnik u bazi može
  dohvatiti/mijenjati **samo redove svog domaćinstva**. Obrazac je svuda isti,
  keyan na `security definer` funkciju `public.my_household_ids()`.
- **Uloge:** `household_members.role` = `owner` | `member`. Owner-only akcije
  (kreiranje/pozivanje članova, dozvole) provjeravaju ulogu.
- **Dozvole po članu:** `member_app_hidden` — owner bira koje aplikacije član
  vidi; `lib/visibility.ts` + sidebar/dashboard to poštuju.
- **Greške:** `lib/auth-errors.ts` prevodi sirove auth greške u ljudske poruke.
- **Tajne:** u `.env.local` (gitignore) i Vercel env — nikad u kodu.

---

## 5. Podaci i migracije

Šema se vodi kroz `supabase/migrations/*.sql`, numerisano i **idempotentno**
(može se ponoviti bez greške). Pokreću se u Supabase → SQL Editor.

Ključne tabele: `profiles`, `households`, `household_members`, `tasks`,
`calendar_events`, `notes` + `links`, `transactions`/`bills`/`budgets`,
`reminders`, `records`/`contacts`/`lists`/`list_items`, `shopping_items`,
`invitations`, `notification_prefs`, `member_app_hidden`, te platformske
`app_events`/`automations`/`app_installs`.

---

## 6. API / komunikacija

- **Server actions** — većina pisanja (forme direktno zovu funkcije na serveru).
- **Route handlers** (HTTP): `/api/cron/reminders`, `/api/cron/digest`
  (zaštićeni `CRON_SECRET`), `/auth/confirm`.
- **Realtime:** `realtime-refresh.tsx` sluša izmjene i osvježava prikaz kod svih.
- **Email:** `lib/email.ts` (Resend); auth mailovi idu preko Supabase custom SMTP
  (također Resend).

---

## 7. Platforma / proširivost

- `lib/apps.ts` — **manifest** aplikacija. Iz njega se izvode sidebar, dashboard
  i registar `/apps`. Nova aplikacija = jedan unos ovdje + svoj folder + migracija.
- `lib/platform.ts` — **event bus** (`emitEvent`) + engine za **automatizacije**
  ("kad se desi X → uradi Y"). Moduli objavljuju događaje; automatizacije reaguju.

### Kako dodati novi modul (recept)
1. Migracija `00NN_naziv.sql` (tabela + RLS po istom obrascu).
2. Folder `src/app/(app)/naziv/` s `page.tsx`, `actions.ts`, `*-form.tsx`.
3. Dodaj unos u `BUILTIN_APPS` u `lib/apps.ts` → pojavi se u meniju/dashboardu.
4. (Opciono) `emitEvent(...)` za event bus + upit u `search/page.tsx`.

---

## 8. Pokretanje lokalno

```bash
npm install
# .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#             SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, CRON_SECRET
npm run dev      # http://localhost:3000
npm run build    # provjera build-a
```

Deploy: `git push origin main` → Vercel automatski build i objava.

---

## 9. Standardi koji su praćeni

- TypeScript kroz cijeli projekat
- React Server Components + Server Actions (preporučeni Next obrazac)
- Separacija odgovornosti: `page` / `actions` / `form`, a `lib/` bez UI-a
- Sigurnost na nivou baze (RLS) uz JWT auth i uloge
- Verzionisane, idempotentne migracije
- Dosljedne konvencije imena i strukture foldera
- UX/pristupačnost: labele iznad polja, loaderi na akcijama, kontrast, light/dark
- Tajne van koda; smislena Git historija
