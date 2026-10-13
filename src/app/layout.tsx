import type { Metadata } from "next";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/instrument-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corset lace calculator",
  description: "Work out how much lace a corset needs, and how to thread it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
