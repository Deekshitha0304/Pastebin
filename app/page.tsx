/**
 * Home Page - Create Snippet
 * Modern UI with validation, modal success flow, and Tailwind CSS
 */

'use client';

import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react';

export default function HomePage() {
  // Helper to get default expiry time (1 hour from now)
  const getDefaultExpiryTime = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [content, setContent] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxViews, setMaxViews] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snippetUrl, setSnippetUrl] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [currentHost, setCurrentHost] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Auto-focus textarea on mount and get current host
  useEffect(() => {
    textareaRef.current?.focus();
    // Get current browser host (client-side only)
    if (typeof window !== 'undefined') {
      setCurrentHost(window.location.host);
    }
  }, []);

  // Modal focus management
  useEffect(() => {
    if (showModal) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.classList.add('modal-open');
      
      // Focus first button in modal
      const firstButton = modalRef.current?.querySelector('button');
      firstButton?.focus();

      // Trap focus in modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeModal();
        }
        
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements || focusableElements.length === 0) return;
          
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.classList.remove('modal-open');
      // Restore focus
      previousFocusRef.current?.focus();
    }
  }, [showModal]);

  // Client-side validation
  const isFormValid = (): boolean => {
    // Content is required
    if (!content.trim()) return false;
    
    // At least one expiry method must be set
    const hasExpiresAt = expiresAt && expiresAt.trim() !== '';
    const hasMaxViews = maxViews && maxViews > 0;
    
    if (!hasExpiresAt && !hasMaxViews) {
      return false; // Need at least one expiry method
    }
    
    // If expiry date is set, it must be in the future
    if (hasExpiresAt) {
      const expiryDate = new Date(expiresAt);
      if (expiryDate <= new Date()) return false;
    }
    
    // If maxViews is set, it must be positive
    if (hasMaxViews && maxViews <= 0) {
      return false;
    }
    
    return true;
  };

  const closeModal = () => {
    setShowModal(false);
    setCopyStatus('idle');
    // Reset form and refocus textarea
    setContent('');
    setExpiresAt('');
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
      setError('Please add content and at least one expiry method (time or max views)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Build request body with only provided fields
      const requestBody: any = {
        content: content.trim(),
      };
      
      if (expiresAt) {
        requestBody.expiresAt = new Date(expiresAt).toISOString();
      }
      
      if (maxViews) {
        requestBody.maxViews = Number(maxViews);
      }

      const response = await fetch('/api/snippets', {
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

  const handleExpiresAtChange = (e: ChangeEvent<HTMLInputElement>) => {
    setExpiresAt(e.target.value);
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
                  Add content and at least one expiry option to enable the button.
                </p>
              )}
            </div>

            {/* Optional Inputs */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* TTL Input */}
              <div className="bg-gray-50 rounded-lg p-5">
                <label htmlFor="expiresAt" className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Time <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Leave blank for no time limit.
                </p>
                <input
                  type="datetime-local"
                  id="expiresAt"
                  value={expiresAt}
                  onChange={handleExpiresAtChange}
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
                <span>Expiry: {expiresAt ? 'set' : 'none'}</span>
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

      {/* Success Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                  Your link is ready
                </h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Created
                </span>
              </div>
              <p className="text-gray-600">
                Copy the link below, or open it in a new tab.
              </p>
            </div>

            {/* Paste URL */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                PASTE URL
              </label>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <p className="font-mono text-sm text-gray-900 break-all">
                  {snippetUrl}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleCopyToClipboard}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {copyStatus === 'copied' ? 'Copied ✓' : copyStatus === 'failed' ? 'Copy failed' : 'Copy to clipboard'}
              </button>
              <a
                href={snippetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-lg border-2 border-gray-200 transition-colors text-center"
              >
                Open
              </a>
            </div>

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
