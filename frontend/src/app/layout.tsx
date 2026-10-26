import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Stand-ins for the editorial pairing: Source Serif 4 at weight 300 for
// thought (headlines, quotes, numbers), Inter for the machinery (UI, body).
const serif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["300"],
  style: ["normal", "italic"],
});

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Swaraloom — voices that never leave your Mac",
  description:
    "A fully local voice agent for Apple Silicon. Speech in, reasoning with tools, speech out — Hindi and English, with consent-gated voice cloning. No cloud, no recurring cost.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
