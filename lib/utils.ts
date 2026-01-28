/**
 * Utility Functions
 * - ID generation for snippets
 * - Input validation
 */

import { nanoid } from 'nanoid';

/**
 * Generate a short, unique, URL-safe ID for snippets
 * @returns {string} 10-character random ID
 */
export function generateSnippetId(): string {
  return nanoid(10);
}

/**
 * Validation result type
 */
export type ValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * Validate snippet input from client
 * @param content - Snippet text content
 * @param expiresAt - ISO 8601 timestamp string
 * @param maxViews - Maximum number of views allowed
 * @returns ValidationResult
 */
export function validateSnippetInput(
  content: string,
  expiresAt: string,
  maxViews: number
): ValidationResult {
  // Validate content is non-empty
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }

  // Validate expiresAt is a valid ISO 8601 date
  const expiryDate = new Date(expiresAt);
  if (isNaN(expiryDate.getTime())) {
    return { valid: false, error: 'Invalid expiry date format' };
  }

  // Validate expiresAt is in the future
  if (expiryDate <= new Date()) {
    return { valid: false, error: 'Expiry date must be in the future' };
  }

  // Validate maxViews is a positive integer
  if (!Number.isInteger(maxViews) || maxViews <= 0) {
    return { valid: false, error: 'Max views must be a positive integer' };
  }

  return { valid: true };
}
