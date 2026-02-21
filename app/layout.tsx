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
  title: "Nav Buddy",
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
              relative z-10
              min-h-screen w-full
              flex flex-col
              items-center
              justify-center
              px-3 py-6
              sm:px-6
            "
          >
            <HexagonBackground className="fixed inset-0 -z-10 min-h-screen ">
              {children}
            </HexagonBackground>
          </main>

          <ModeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
