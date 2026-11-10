import { Language } from '../types';

/**
 * Format timestamp into relative human-readable time (e.g. "baru saja", "5m lalu", "2j lalu")
 */
export function formatTimeAgo(timestamp: number, lang: Language = 'id'): string {
  if (!timestamp) return '-';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 45) {
    return lang === 'id' ? 'baru saja' : 'just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return lang === 'id' ? `${diffMin}m lalu` : `${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return lang === 'id' ? `${diffHours}j lalu` : `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return lang === 'id' ? 'kemarin' : 'yesterday';
  }
  if (diffDays < 7) {
    return lang === 'id' ? `${diffDays}h lalu` : `${diffDays}d ago`;
  }

  const date = new Date(timestamp);
  return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
}
