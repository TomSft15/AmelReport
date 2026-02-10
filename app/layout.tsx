import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Blog d'Amel",
    template: "%s | Blog d'Amel",
  },
  description: "Blog privé d'Amel - Espace de partage avec mes amis",
  keywords: ["blog", "articles", "partage", "communauté"],
  authors: [{ name: "Amel" }],
  creator: "Amel",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "Blog d'Amel",
    description: "Blog privé d'Amel - Espace de partage avec mes amis",
    siteName: "Blog d'Amel",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog d'Amel",
    description: "Blog privé d'Amel - Espace de partage avec mes amis",
  },
  robots: {
    index: false, // Blog privé - pas d'indexation
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
