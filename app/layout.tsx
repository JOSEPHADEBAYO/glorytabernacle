import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.glorytabernacle.co.uk";
const SITE_NAME = "RCCG Glory Tabernacle, Barnstaple";
const SITE_TAGLINE = "Furnish · Transform · Influence";
const SITE_DESCRIPTION =
  "A vibrant and welcoming church community in Barnstaple dedicated to worship, fellowship, and service. FURNISHING the saints unto good works, TRANSFORMING people inside out, sending them to INFLUENCE the marketplace as disciples.";

export const metadata: Metadata = {
  // metadataBase lets every per-page metadata use relative URLs and lets
  // Next.js resolve the opengraph-image.tsx output to an absolute URL.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Pages can set a string title; Next.js wraps it as
    // "Page Title — RCCG Glory Tabernacle, Barnstaple". Pages that want
    // their own full title (e.g. inaugural-service pages) override this
    // by exporting `metadata.title` as a plain string.
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // Default Open Graph / Twitter metadata for every page in the site.
  // Routes that set their own `metadata.openGraph` override these. The
  // image itself comes from app/opengraph-image.tsx (auto-attached by
  // Next.js); no explicit images array needed here.
  openGraph: {
    title: SITE_NAME,
    description: `${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    // summary_large_image gives the wide preview card on Twitter / X.
    // The image is inherited from app/opengraph-image.tsx automatically.
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
