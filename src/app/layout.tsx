import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Firmenbuchsuche Österreich | Kostenlos & Automatisch | Firmenbuch Notifier",
  description: "Einfache und kostenlose Firmenbuchsuche für Österreich (HVD). Finden Sie offizielle Firmenbucheinträge, laden Sie Urkunden herunter und aktivieren Sie automatische Updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        
        {/* Sitelinks Searchbox JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://firmenbuchnotify.at/",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {    
                  "@type": "EntryPoint",
                  "urlTemplate": "https://firmenbuchnotify.at/?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </body>
    </html>
  );
}

