/**
 * Utility Functions
 * - ID generation for pastes
 */

import { nanoid } from 'nanoid';

/**
 * Generate a short, unique, URL-safe ID for pastes
 * @returns {string} 10-character random ID
 */
export function generateSnippetId(): string {
  return nanoid(10);
}
