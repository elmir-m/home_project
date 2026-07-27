import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

// Postavi temu, veličinu fonta i akcentnu boju prije iscrtavanja (izbjegava treptaj).
const themeScript = `
(function(){
  var d = document.documentElement;
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    d.setAttribute('data-theme', t);
    d.setAttribute('data-font', localStorage.getItem('appFont') || 'md');
    var a = localStorage.getItem('appAccent');
    if (a && a !== 'indigo') d.setAttribute('data-accent', a);
  } catch(e) {
    d.setAttribute('data-theme','light');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bs"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
