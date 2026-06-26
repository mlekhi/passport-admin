import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavLinks } from "./nav-links";
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
  title: "Passport Admin",
  description: "Central dashboard for Passport-protected microsites.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <header className="border-b border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between gap-6 px-6 py-4">
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
        <footer className="border-t border-black/10 px-6 py-4 dark:border-white/10">
          <div className="flex items-center justify-between text-xs text-black/40 dark:text-white/40">
            <span>Made with love by Maya.</span>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="hover:text-black/70 dark:hover:text-white/70 transition-colors"
            >
              Passports are live on Vercel Dashboard.
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
