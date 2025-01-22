import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XWord - AI Word Search",
  description: "Generate custom word search puzzles about any topic using AI",
  icons: {
    icon: '/xword_icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <footer className="mt-16 pb-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <div className="max-w-4xl mx-auto px-8">
            <p className="mb-2">
              XWord is an AI-powered word search puzzle generator that creates custom puzzles 
              about any topic you can imagine. Perfect for educators, students, and puzzle enthusiasts.
            </p>
            <p>© Smuzzies {new Date().getFullYear()}. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
