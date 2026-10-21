import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aura Finance | Self-Repaying CDP Lending on BOT Chain',
  description:
    'Borrow synthetic Bitcoin (aBTC) against native BOT token collateral on BOT Chain (Chain ID: 968). Ultra-low fees, 0.75s block confirmations, and secure DeFi architecture.',
  keywords: [
    'BOT Chain',
    'Aura Finance',
    'DeFi',
    'CDP',
    'Synthetic Bitcoin',
    'aBTC',
    'Testnet',
    'Web3 Lending',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-zinc-950 text-zinc-100 selection:bg-purple-500/30 selection:text-purple-200`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
