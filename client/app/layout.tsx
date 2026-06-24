'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar"; 
import { usePathname } from "next/navigation"; // 🎯 Import the path sniffer

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

  // 🎯 HIDE CHECK: If the user is on the workspace page, we DO NOT show the old top header navbar
  const isWorkspace = pathname?.startsWith('/workspace');

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ margin: 0, padding: 0, backgroundColor: '#09090b', color: '#fff' }}
      >
        {/* Only render the top navbar if we are NOT inside the mobile app view */}
        {!isWorkspace && <Navbar />} 

        {/* Displays your isolated views cleanly */}
        {children} 
      </body>
    </html>
  );
}