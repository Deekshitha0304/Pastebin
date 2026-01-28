/**
 * Root Layout
 * Global HTML structure and metadata
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pastebin App',
  description: 'Share text snippets with expiration controls',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          <header>
            <h1>📋 Pastebin</h1>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
