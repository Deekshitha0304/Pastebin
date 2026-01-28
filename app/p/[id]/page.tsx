/**
 * View Paste Page (HTML)
 * GET /p/:id
 * Returns HTML containing the paste content
 * Must render content safely (no script execution)
 */

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';

// Helper to get current time (supports TEST_MODE)
function getCurrentTime(): Date {
  if (process.env.TEST_MODE === '1') {
    const headersList = headers();
    const testNowMs = headersList.get('x-test-now-ms');
    if (testNowMs) {
      const testTime = parseInt(testNowMs, 10);
      if (!isNaN(testTime)) {
        return new Date(testTime);
      }
    }
  }
  return new Date();
}

export default async function PasteViewPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const now = getCurrentTime();

  // Fetch paste from database
  const paste = await prisma.snippet.findUnique({
    where: { id },
  });

  // Check if paste exists
  if (!paste) {
    notFound();
  }

  // Check time-based expiration (if set)
  if (paste.expiresAt && now > paste.expiresAt) {
    notFound();
  }

  // Check view-based expiration (if set)
  if (paste.maxViews !== null && paste.viewCount >= paste.maxViews) {
    notFound();
  }

  // Atomically increment view count
  await prisma.snippet.update({
    where: { id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });

  // Escape HTML to prevent script execution
  const escapeHtml = (text: string) => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  const safeContent = escapeHtml(paste.content);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Paste - {id}</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .paste-container {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .paste-content {
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
            background: #f9f9f9;
            padding: 16px;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
          }
        `}</style>
      </head>
      <body>
        <div className="paste-container">
          <h1>Paste</h1>
          <div className="paste-content">{safeContent}</div>
        </div>
      </body>
    </html>
  );
}
