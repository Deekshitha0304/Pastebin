/**
 * 404 Not Found Page for Paste View
 * Renders when paste is unavailable (expired, view limit reached, or not found)
 */

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Paste Not Found</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
          }
          .error-container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
            width: 100%;
          }
          h1 {
            color: #dc2626;
            font-size: 48px;
            margin: 0 0 16px 0;
            font-weight: 700;
          }
          h2 {
            color: #1f2937;
            font-size: 24px;
            margin: 0 0 16px 0;
            font-weight: 600;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            margin: 0 0 24px 0;
            line-height: 1.5;
          }
          a {
            display: inline-block;
            background: #4f46e5;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
          }
          a:hover {
            background: #4338ca;
          }
        `}</style>
      </head>
      <body>
        <div className="error-container">
          <h1>404</h1>
          <h2>Paste Not Found</h2>
          <p>The paste you're looking for is no longer available.</p>
          <p>It may have expired or reached its view limit.</p>
          <a href="/">Create a new paste</a>
        </div>
      </body>
    </html>
  );
}
