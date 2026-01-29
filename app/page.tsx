/**
 * Home Page - Create Snippet
 * Modern UI with validation, modal success flow, and Tailwind CSS
 */

'use client';

import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import { Modal } from './components/Modal';

export default function HomePage() {
  const [content, setContent] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState<number | ''>('');
  const [maxViews, setMaxViews] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snippetUrl, setSnippetUrl] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [currentHost, setCurrentHost] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea on mount and get current host
  useEffect(() => {
    textareaRef.current?.focus();
    if (typeof window !== 'undefined') {
      setCurrentHost(window.location.host);
    }
  }, []);

  // Client-side validation
  const isFormValid = (): boolean => {
    // Content is required
    if (!content.trim()) return false;
    
    // If ttl_seconds is set, it must be >= 1
    if (ttlSeconds !== '' && ttlSeconds < 1) {
      return false;
    }
    
    // If maxViews is set, it must be >= 1
    if (maxViews !== '' && maxViews < 1) {
      return false;
    }
    
    // Both fields are optional per spec - paste can have no expiry
    return true;
  };

  const closeModal = () => {
    setShowModal(false);
    setCopyStatus('idle');
    // Reset form and refocus textarea
    setContent('');
    setTtlSeconds('');
    setMaxViews('');
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleCopyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(snippetUrl);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = snippetUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      setCopyStatus('failed');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please add content. TTL and max views are optional.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Build request body with only provided fields (per spec format)
      const requestBody: any = {
        content: content.trim(),
      };
      
      if (ttlSeconds) {
        requestBody.ttl_seconds = Number(ttlSeconds);
      }
      
      if (maxViews) {
        requestBody.max_views = Number(maxViews);
      }

      const response = await fetch('/api/pastes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create snippet');
      }

      // Success - show modal
      setSnippetUrl(data.url);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create snippet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (error) setError('');
  };

  const handleTtlSecondsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTtlSeconds(value === '' ? '' : parseInt(value, 10));
    if (error) setError('');
  };

  const handleMaxViewsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxViews(value === '' ? '' : parseInt(value, 10));
    if (error) setError('');
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600 mb-4">
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            Fast, plain-text sharing
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-3">
            Pastebin Lite
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Drop text, get a link. Optional expiry and view limits help you share intentionally.
          </p>
        </header>

        {/* Main Card */}
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Create a paste</h2>
              <p className="text-sm text-gray-500 mt-1">
                Plain text in, safe HTML out. The view page escapes content.
              </p>
            </div>
            <div className="text-sm text-gray-400 font-mono">
              {currentHost || 'localhost:3000'}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Paste Content */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                Paste content <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-3">
                A focused snippet, a quick note, or a whole error log—your call.
              </p>
              <textarea
                ref={textareaRef}
                id="content"
                value={content}
                onChange={handleContentChange}
                placeholder="Type or paste anything..."
                className="w-full min-h-[240px] px-4 py-3 border-2 border-gray-200 rounded-lg font-mono text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all resize-y"
                required
              />
              {!content.trim() && (
                <p className="text-sm text-gray-400 italic mt-2 text-center">
                  Add content to enable the button.
                </p>
              )}
            </div>

            {/* Optional Inputs */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* TTL Input */}
              <div className="bg-gray-50 rounded-lg p-5">
                <label htmlFor="ttlSeconds" className="block text-sm font-semibold text-gray-700 mb-2">
                  TTL (seconds) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Leave blank for no time limit.
                </p>
                <input
                  type="number"
                  id="ttlSeconds"
                  value={ttlSeconds}
                  onChange={handleTtlSecondsChange}
                  min="1"
                  placeholder="e.g., 3600"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                />
              </div>

              {/* Max Views Input */}
              <div className="bg-gray-50 rounded-lg p-5">
                <label htmlFor="maxViews" className="block text-sm font-semibold text-gray-700 mb-2">
                  Max views <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Leave blank for unlimited views.
                </p>
                <input
                  type="number"
                  id="maxViews"
                  value={maxViews}
                  onChange={handleMaxViewsChange}
                  min="1"
                  placeholder="e.g., 10"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-lg p-4">
                <p className="text-red-900 font-semibold mb-1">✗ Request failed</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 hover:shadow-lg disabled:shadow-none"
              >
                {isSubmitting ? 'Creating…' : 'Create paste'}
              </button>
              
              {/* Settings Preview */}
              <div className="flex items-center justify-end gap-4 mt-3 text-sm text-gray-500">
                <span>TTL: {ttlSeconds ? `${ttlSeconds}s` : 'none'}</span>
                <span>•</span>
                <span>Max views: {maxViews || 'unlimited'}</span>
              </div>
            </div>
          </form>

          {/* Footer Message */}
          <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
            Built as a take-home assignment · No tracking · No login
          </div>
        </div>
      </div>

      {/* Success Modal - native <dialog> + Tailwind */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title="Your link is ready"
        titleBadge={
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            Created
          </span>
        }
        subtitle="Copy the link below, or open it in a new tab."
      >
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">PASTE URL</label>
          <div className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4">
            <p className="break-all font-mono text-sm text-gray-900">{snippetUrl}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={handleCopyToClipboard}
            className="flex-1 rounded-lg bg-indigo-600 py-3 px-6 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            {copyStatus === 'copied' ? 'Copied ✓' : copyStatus === 'failed' ? 'Copy failed' : 'Copy to clipboard'}
          </button>
          <a
            href={snippetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border-2 border-gray-200 bg-white py-3 px-6 text-center font-semibold text-gray-900 transition-colors hover:bg-gray-50"
          >
            Open
          </a>
        </div>

        <button
          type="button"
          onClick={closeModal}
          className="w-full rounded-lg bg-gray-100 py-2.5 px-6 font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          Close
        </button>
      </Modal>
    </>
  );
}
