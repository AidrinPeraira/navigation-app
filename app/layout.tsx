import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ModeToggle } from "@/components/theme-toggle";
import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon";
import "mapbox-gl/dist/mapbox-gl.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Navi Pro",
  description: "Navigation app using next js and map box.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main
            className="
            absolute
            mx-auto
            z-10
            left-0 right-0 
            w-[95vw]
            sm:w-[90vw]
            md:w-[720px]
            lg:w-[960px]
            xl:w-[1200px]
            2xl:w-[1400px]
          "
          >
            {children}
          </main>
          <HexagonBackground className="min-h-screen" />
          <ModeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
