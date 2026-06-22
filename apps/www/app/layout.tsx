import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'everstate — state-complete, accessible, upgradeable React components',
  description:
    'Registry-as-code React components. Own the code like shadcn — but with every async state, verified accessibility, and an upgrade path that survives your edits.',
  openGraph: {
    title: 'everstate',
    description:
      'State-complete, accessible, upgradeable React components — distributed as registry-as-code.',
    url: 'https://geekles007.github.io/everstate',
    siteName: 'everstate',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'everstate',
    description:
      'State-complete, accessible, upgradeable React components — distributed as registry-as-code.',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
