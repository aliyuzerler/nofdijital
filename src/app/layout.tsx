import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import "./nof.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-nof-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nof-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NOF DİJİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama",
  description: "Sosyal medya yönetimi, Google & Meta Ads, fotoğraf, video ve prodüksiyon hizmetleri.",
  icons: {
    icon: [{ url: "/assets/logo.png", type: "image/png" }],
    apple: [{ url: "/assets/logo.png" }],
  },
};

/** DEV-001: ilk boyamadan önce tema uygulanır (FOUC önleme). Varsayılan: koyu (referans görünüm). */
const themeInit = `(function(){try{var t=localStorage.getItem('nof-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${bricolage.variable} ${dmSans.variable}`}>
        <style>{`:root{--fd:var(--font-nof-display),'Arial Black','Helvetica Neue',Arial,sans-serif;--fb:var(--font-nof-body),'Helvetica Neue',Arial,sans-serif}`}</style>
        {children}
      </body>
    </html>
  );
}
