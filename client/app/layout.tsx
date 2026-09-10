'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar"; 
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Hide the global top navbar across all internal console and app views
  const appRoutes = ['/workspace', '/discover', '/profile', '/signals', '/dashboard', '/inbox'];
  const isAppView = appRoutes.some(route => pathname?.startsWith(route));

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ margin: 0, padding: 0, backgroundColor: '#09090b', color: '#fff' }}
      >
        {/* Only render the top navbar on public landing, auth, or onboarding pages */}
        {!isAppView && <Navbar />} 

        {children} 
      </body>
    </html>
  );
}