/**
 * Home Page
 * Form to create new snippets with expiration controls
 */

'use client';

import { useState, FormEvent, ChangeEvent } from 'react';

export default function HomePage() {
  const [content, setContent] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxViews, setMaxViews] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snippetUrl, setSnippetUrl] = useState('');
  const [error, setError] = useState('');

  // Client-side validation
  const isFormValid = (): boolean => {
    if (!content.trim()) return false;
    if (!expiresAt) return false;
    if (!maxViews || maxViews <= 0) return false;
    
    // Check if expiry date is in the future
    const expiryDate = new Date(expiresAt);
    if (expiryDate <= new Date()) return false;
    
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please fill in all fields correctly');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSnippetUrl('');

    try {
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          expiresAt: new Date(expiresAt).toISOString(),
          maxViews: Number(maxViews),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create snippet');
      }

      // Success - display the URL
      setSnippetUrl(data.url);
      
      // Reset form
      setContent('');
      setExpiresAt('');
      setMaxViews('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create snippet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleExpiresAtChange = (e: ChangeEvent<HTMLInputElement>) => {
    setExpiresAt(e.target.value);
  };

  const handleMaxViewsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxViews(value === '' ? '' : parseInt(value, 10));
  };

  return (
    <div>
      <h2>Create a New Snippet</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="content">
            Content <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            placeholder="Paste your text content here..."
            required
          />
          <div className="helper-text">Enter the text you want to share</div>
        </div>

        <div className="form-group">
          <label htmlFor="expiresAt">
            Expires At <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="datetime-local"
            id="expiresAt"
            value={expiresAt}
            onChange={handleExpiresAtChange}
            required
          />
          <div className="helper-text">
            Snippet will expire after this date and time
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="maxViews">
            Maximum Views <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="number"
            id="maxViews"
            value={maxViews}
            onChange={handleMaxViewsChange}
            min="1"
            placeholder="e.g., 10"
            required
          />
          <div className="helper-text">
            Snippet will expire after this many views
          </div>
        </div>

        <button type="submit" disabled={!isFormValid() || isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Snippet'}
        </button>
      </form>

      {snippetUrl && (
        <div className="success-message">
          <strong>✓ Snippet created successfully!</strong>
          <p style={{ marginTop: '10px' }}>
            Share this link:{' '}
            <a href={snippetUrl} target="_blank" rel="noopener noreferrer">
              {snippetUrl}
            </a>
          </p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>✗ Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
