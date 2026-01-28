/**
 * Snippet View Page
 * Displays a single snippet with metadata
 * Handles 404 and 410 errors appropriately
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type SnippetData = {
  content: string;
  viewCount: number;
  expiresAt: string;
  maxViews: number;
};

type ErrorState = {
  status: number;
  message: string;
};

export default function SnippetPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [snippet, setSnippet] = useState<SnippetData | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const response = await fetch(`/api/snippets/${id}`);
        const data = await response.json();

        if (!response.ok) {
          // Handle different error statuses
          if (response.status === 404) {
            setError({ status: 404, message: 'Snippet not found' });
          } else if (response.status === 410) {
            setError({ status: 410, message: 'Snippet has expired' });
          } else {
            setError({ 
              status: response.status, 
              message: data.error || 'Failed to load snippet' 
            });
          }
        } else {
          setSnippet(data);
        }
      } catch (err) {
        setError({ 
          status: 500, 
          message: 'Network error. Please try again.' 
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSnippet();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="loading">
        <p>Loading snippet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="error-message">
          <h2>
            {error.status === 404 ? '404 - Not Found' : 
             error.status === 410 ? '410 - Gone' : 
             'Error'}
          </h2>
          <p>{error.message}</p>
        </div>
        <Link href="/" className="back-link">
          ← Create a new snippet
        </Link>
      </div>
    );
  }

  if (!snippet) {
    return null;
  }

  // Format expiration date for display
  const expiryDate = new Date(snippet.expiresAt);
  const formattedExpiry = expiryDate.toLocaleString();

  return (
    <div>
      <h2>Snippet Content</h2>
      
      <div className="snippet-display">
        <div className="snippet-meta">
          <div>
            <span>Views:</span> {snippet.viewCount} / {snippet.maxViews}
          </div>
          <div>
            <span>Expires:</span> {formattedExpiry}
          </div>
        </div>

        <div className="snippet-content">
          {snippet.content}
        </div>
      </div>

      <Link href="/" className="back-link">
        ← Create a new snippet
      </Link>
    </div>
  );
}
