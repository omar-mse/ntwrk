import type { Metadata } from "next"
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SearchProvider } from "@/components/search-provider"
import { SiteHeader } from "@/components/site-header"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "Cards — Your Digital Rolodex",
  description: "A minimalist digital rolodex for your business contacts.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        {/* Inline FOUC-prevention: runs before React hydrates, sets .dark on <html> */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('cards-theme');document.documentElement.classList.toggle('dark',t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches))}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <SearchProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              {children}
            </div>
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
