# Nastavak rada u novoj Claude sesiji (handoff)

Pročitaj ovo PRVO ako si nova Claude Code sesija (ili drugi Claude nalog) koja preuzima
projekat "Moj dom". Dublja arhitektura je u `ONBOARDING.md`; ovdje je sažetak + tekuće stanje.

## Osnovno
- **Repo:** `git@github.com:elmir-m/home_project.git`, branch **`main`** (deploy = push na main).
- **Live:** https://home-project-ruddy.vercel.app/
- **Lokalni dev:** `npm run dev` → **http://localhost:3002** (3000/3001 zauzeti). `npm run build` za provjeru.
- **Stack:** Next.js 16 (App Router, TS) + Tailwind v4 + Supabase (Postgres/Auth/RLS/Realtime/Storage) + Resend, Vercel.
- ⚠️ Ovo NIJE Next.js iz trening podataka — breaking changes. Prije Next koda pročitaj vodič u
  `node_modules/next/dist/docs/` (v. `AGENTS.md`).

## Pravila okruženja
- **Migracije** (`supabase/migrations/*.sql`, idempotentne) pokreće **korisnik RUČNO** u Supabase
  SQL Editoru. Claude ih NE pokreće — samo piše fajl i podsjeti korisnika.
- Podaci **isključivo preko Supabase klijenta** (`@supabase/ssr`, forsira RLS) — NE Prisma.
  `admin.ts` (service-role) samo za cron/cross-user, nikad u klijentskom kodu.
- Commit/push **samo kad korisnik traži**. Tajne nikad u git (samo `.env.local` / Vercel env).

## ⚠️ Migracije koje korisnik mora pokrenuti prije testiranja
- `0020_locale.sql` — `profiles.locale` (bs/en), pamćenje jezika.
- `0021_author_owner_permissions.sql` — RLS "autor ILI vlasnik smije mijenjati/brisati".
  (Popravljeno: loop varijabla je `rec text[]`, ne `record` — ranije rušila greška `42804`.)

## Konvencije (slijedi ih)
- Modul = `src/app/(app)/<slug>/` sa `page.tsx` (server), `actions.ts` (`"use server"`, create/edit/delete),
  `*-form.tsx` (`"use client"`, modalna forma). Layout: `src/app/(app)/layout.tsx`.
- Dodaj/uredi kroz `components/modal.tsx` (render-prop) + `components/submit-button.tsx` (useFormStatus),
  labele IZNAD inputa (Field helper).
- Nova app: migracija + folder + jedan unos u `BUILTIN_APPS` (`src/lib/apps.ts`) → sidebar/dashboard automatski.
- Tamna tema: stranica `#15171d`, kartice `dark:bg-[#20242c]`, inputi `dark:bg-[#2a2f39]`. Valuta **KM (BAM)**.
- Greške NIKAD sirove — kontrolisane poruke (`src/lib/auth-errors.ts`).

## i18n (bs/en) — ZAVRŠENO
- `src/lib/i18n.ts` (rječnici `bs`/`en`, dotted ključevi, `{var}` interpolacija) +
  `i18n-server.ts` (`getT`/`getLocale`, cookie `locale`) + `components/locale-provider.tsx` (`useT`/`useLocale`).
- Novi string → dodaj ključ u OBA rječnika, pa `t("kljuc")`. Ako je `t` zauzet u fajlu, nazovi prevodilac `tr`.

## Dozvole (autor/vlasnik)
- `src/lib/household.ts`: `getCurrentHousehold()` vraća i `userId`, `isOwner`; helper
  `canManage(createdBy, userId, isOwner)`. UI skriva edit/delete za tuđe stavke; RLS (0021) to forsira u bazi.

## Urađeno u zadnjoj sesiji (2026-07-27)
1. Lokalizacija SVIH modula + auth stranica (256 ključeva). Oznake automatizacija su i18n ključevi
   (`auto.ev.*`/`auto.act.*`) u `src/lib/platform.ts`.
2. Chat mjehurić `src/components/chat-widget.tsx` (donji desni ugao, emoji, badge nepročitanih); puna stranica na `/chat`.
3. Profil: uklonjen tekst "(ne može se mijenjati)".
4. Dozvole autor/vlasnik (tačka gore) — UI + migracija 0021.
5. Mobilna navigacija popravljena:
   - `MobileNav` overlay ide kroz `createPortal(document.body)` — header ima `backdrop-blur` koji je
     pravio containing block i sabijao `fixed` meni na visinu trake.
   - Pomoćne kontrole (jezik/pomoć/tema/odjava) na mobitelu u kliznom meniju; na md+ inline.
   - `overflow-x-hidden` na sadržaju (`layout.tsx`); popoveri `max-w-[calc(100vw-1.5rem)]`.

## Otvoreno / backlog
- **Pitanje korisniku (bez pretpostavke):** treba li DODIJELJENA osoba moći označiti zadatak završenim?
  Sad samo autor/vlasnik.
- Nice-to-have: subtaskovi/tagovi/recurring, više kanban tabli, finance budžeti UI, week/day kalendar,
  privatnost po stavci, upload fajlova (Supabase Storage).

## Radni stil korisnika
- Token-ekonomičan (ciljani editi, izbjegavaj masovni `sed`/čitanje velikih fajlova). Gradi inkrementalno —
  korisnik verifikuje svaki korak na live sajtu. Komunikacija na **bosanskom**. Linux.
