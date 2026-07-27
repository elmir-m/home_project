import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moj dom",
  description: "Zajednički kućni sistem za cijelo domaćinstvo.",
};

// Temu postavljamo prije iscrtavanja iz localStorage (izbjegava treptaj).
// Font i akcent dolaze iz baze (SSR atributi ispod) — vezani za nalog.
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {
    document.documentElement.setAttribute('data-theme','light');
  }
})();
`;

// Pročitaj postavke izgleda s profila (ako je korisnik prijavljen).
async function getAppearance() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { font: "md", accent: "indigo" };
    const { data } = await supabase
      .from("profiles")
      .select("font_size, accent")
      .eq("id", user.id)
      .single();
    return {
      font: (data?.font_size as string) || "md",
      accent: (data?.accent as string) || "indigo",
    };
  } catch {
    return { font: "md", accent: "indigo" };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { font, accent } = await getAppearance();
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-font={font}
      data-accent={accent === "indigo" ? undefined : accent}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
