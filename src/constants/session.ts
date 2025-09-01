export const MAX_PLAYERS = 10 as const;

/**
 * Category constants for consistent display across the app
 */
export const CATEGORY_LABELS: Record<string, string> = {
  general: '상식',
  alcohol: '술', 
  sports: '스포츠',
  history: '역사',
  food: '음식',
  // Korean direct mappings (fallback)
  '상식': '상식',
  '술': '술',
  '스포츠': '스포츠', 
  '역사': '역사',
  '음식': '음식',
};

/**
 * Get the display label for a category
 * @param category - The category key (English or Korean)
 * @returns The Korean display label
 */
export function getCategoryLabel(category?: string | null): string {
  if (!category) return '기본';
  const normalized = category.trim().toLowerCase();
  return CATEGORY_LABELS[normalized] || CATEGORY_LABELS[category] || category || '기본';
}

/**
 * Get the server-compatible category value
 * @param category - The category key
 * @returns The server-compatible category string
 */
export function getServerCategory(category?: string | null): string {
  if (!category) return 'unknown';
  return getCategoryLabel(category);
}