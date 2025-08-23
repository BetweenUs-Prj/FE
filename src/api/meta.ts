import { http } from './http';

// Default categories to use when backend doesn't provide them
export const DEFAULT_CATEGORIES = ['술', '역사', '스포츠', '음식', '상식'];

/**
 * Fetch categories from backend. Falls back to default categories if API fails.
 */
export async function listCategories(): Promise<string[]> {
  try {
    const response = await http.get('/mini-games/categories');
    // If response is successful and contains data
    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data;
    }
    // If response is successful but empty/no data, use default
    return DEFAULT_CATEGORIES;
  } catch (error: any) {
    // If API doesn't exist (404) or any other error, use default categories
    console.log('Categories API not available, using default categories');
    return DEFAULT_CATEGORIES;
  }
}

/**
 * Safe categories fetcher with multiple response schema support
 */
export async function listCategoriesSafe(): Promise<string[]> {
  try {
    const { data } = await http.get('/mini-games/categories');
    
    // Handle different response schemas
    const raw = Array.isArray(data)
      ? data
      : Array.isArray(data?.categories)
      ? data.categories
      : [];

    const names = raw.map((x: any) =>
      typeof x === 'string' ? x : (x?.name ?? '')
    ).filter(Boolean);

    const uniq = Array.from(new Set(names));
    return uniq.length ? uniq : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}