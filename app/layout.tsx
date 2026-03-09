import type { Metadata } from "next";
import { Albert_Sans, Instrument_Serif, Italianno } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransitions } from "@/components/page-transitions";

const albertSans = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

const italianno = Italianno({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cursive",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kaylee — Study & Scrapbook",
  description: "Pomodoro, flashcards, AI summaries, and a cozy digital scrapbook.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${albertSans.variable} ${instrumentSerif.variable} ${italianno.variable}`}
    >
      <body className="min-h-screen">
        <NuqsAdapter>
          <ThemeProvider>
            <PageTransitions>
              <AppShell>{children}</AppShell>
            </PageTransitions>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
