/**
 * Snippet View Page
 * Displays a single snippet with metadata and live countdown
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type SnippetData = {
  content: string;
  viewCount: number;
  createdAt: string;
  expiresAt: string | null;
  maxViews: number | null;
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
  const [countdown, setCountdown] = useState<string>('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  // Calculate countdown
  useEffect(() => {
    if (!snippet?.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(snippet.expiresAt).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setCountdown('Expired');
        return;
      }

      // Check if expiring within 5 minutes
      setIsExpiringSoon(distance < 5 * 60 * 1000);

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [snippet]);

  useEffect(() => {
    const fetchSnippet = async () => {
      try {
        const response = await fetch(`/api/snippets/${id}`);
        const data = await response.json();

        if (!response.ok) {
          // Treat 404/410 or any error as expired/unavailable
          setError({
            status: response.status,
            message: response.status === 404 ? 'Snippet not found' : 'Snippet has expired'
          });
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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Loading paste...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  // Error/Expired State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            This link has expired
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            The paste you're trying to view is no longer available.
          </p>
          <p className="text-gray-500 mb-8">
            It may have expired or reached its view limit.
          </p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Create a new paste
          </Link>
        </div>
      </div>
    );
  }

  if (!snippet) {
    return null;
  }

  // Format created date
  const createdDate = new Date(snippet.createdAt);
  const formattedCreated = createdDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-50">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-xs text-gray-600 mb-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              Paste view
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Paste</h1>
            <p className="text-gray-600 mt-1">
              Created: {formattedCreated}
            </p>
          </div>
          <Link
            href="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Create a new paste
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Metadata Bar */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">ID:</span>
            <span className="font-mono text-gray-900">{id}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Views:</span>
            <span className="font-mono text-gray-900">
              {snippet.viewCount}{snippet.maxViews ? ` / ${snippet.maxViews}` : ' (unlimited)'}
            </span>
          </div>
          {countdown && snippet.expiresAt && (
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${isExpiringSoon ? 'text-yellow-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-gray-700">Expires in:</span>
              <span className={`font-mono ${isExpiringSoon ? 'text-yellow-700 font-semibold' : 'text-gray-900'}`}>
                {countdown}
              </span>
            </div>
          )}
        </div>

        {/* Paste Content */}
        <div className="p-6">
          <pre className="bg-gray-50 rounded-lg p-6 overflow-x-auto scrollbar-thin border border-gray-200">
            <code className="font-mono text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words">
              {snippet.content}
            </code>
          </pre>
        </div>
      </div>

      {/* Back Link */}
      <div className="max-w-6xl mx-auto mt-6">
        <Link
          href="/"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Create a new snippet
        </Link>
      </div>
    </div>
  );
}
