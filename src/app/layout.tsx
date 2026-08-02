import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { SWRegister } from "@/components/pwa/SWRegister";
import { ConnectionStatusBadge } from "@/components/common/ConnectionStatusBadge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#3d2514",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Kedai Kopi | Coffee, Drinks, Snack & Good Food",
  description: "Kedai Kopi - Tempat ngopi, santai, dan nikmati beragam pilihan minuman kopi, non-kopi, makanan, dan snack lezat.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kedai Kopi",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SWRegister />
        <ConnectionStatusBadge />
        {children}
      </body>
    </html>
  );
}
