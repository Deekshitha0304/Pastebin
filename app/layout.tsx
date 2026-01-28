/**
 * Root Layout
 * Global HTML structure and metadata
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pastebin Lite - Fast, plain-text sharing',
  description: 'Drop text, get a link. Optional expiry and view limits help you share intentionally.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
