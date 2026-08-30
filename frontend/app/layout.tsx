import type { Metadata } from "next";
import { Geist, Geist_Mono, Zain } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const zain = Zain({
  variable: "--font-zain",
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "ClassFlow",
    template: "%s | ClassFlow",
  },
  description: "Center management system for ClassFlow",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${zain.variable} h-full antialiased dark`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
