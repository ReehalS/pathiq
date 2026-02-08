import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ScrollToTop } from "@/components/scroll-to-top";
import { OnboardingRedirect } from "@/components/onboarding-redirect";
import { AuthProvider } from "@/lib/auth-context";
import { UserProfileProvider } from "@/hooks/use-user-profile";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PathIQ - Data-Driven Career Intelligence",
  description:
    "Make your next move with data, not guesswork. AI-powered career intelligence for undergraduates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <AuthProvider>
          <UserProfileProvider>
            <ScrollToTop />
            <OnboardingRedirect />
            <Navbar />
            <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          </UserProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
