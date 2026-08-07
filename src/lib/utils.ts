/**
 * Shared utility functions — DRY principle.
 * Import these instead of duplicating in each page.
 */

/**
 * Format ISO date string to Indonesian locale (e.g. "4 Agu 2026").
 */
export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Format currency to Indonesian Rupiah (e.g. "Rp 50.000").
 */
export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}
