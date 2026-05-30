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
  title: "Firmenbuch Notifier - Kostenlose Firmenbuchsuche & Benachrichtigungen",
  description: "Durchsuchen Sie das österreichische Firmenbuch (HVD) kostenlos, laden Sie Urkunden herunter und abonnieren Sie E-Mail-Updates für bis zu 10 Firmen bei neuen Veröffentlichungen.",
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

