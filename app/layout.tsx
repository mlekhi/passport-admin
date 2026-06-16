import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Passport Admin",
  description: "Central dashboard for Passport-protected microsites.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>Passport Admin</h1>
          <p>Protection status across all microsites.</p>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
