import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/variables.css";
import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/layout";
import { PostsProvider } from "@/contexts/PostsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vorp Friends",
  description: "A simple social app to connect with vorp friends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <PostsProvider>
        <html lang="pt-BR">
          <body style={{ margin: 0, padding: 0, backgroundColor: 'var(--gray-alpha-100)' }} className={`${geistSans.variable} ${geistMono.variable}`}>
            <Header />
            {children}
          </body>
        </html>
      </PostsProvider>
    </ClerkProvider>
  );
}
