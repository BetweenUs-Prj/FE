/**
 * 카테고리 정규화 및 매핑 유틸리티 (단일 소스)
 */

export const toServer: Record<string, string> = {
  general: '상식',
  alcohol: '술', 
  sports: '스포츠',
  history: '역사',
  food: '음식',
  // 한국어 직접 매핑 (fallback)
  '상식': '상식',
  '술': '술',
  '스포츠': '스포츠', 
  '역사': '역사',
  '음식': '음식',
};

/**
 * 카테고리를 정규화합니다.
 * @param v - 카테고리 값 (null/undefined 안전)
 * @returns 정규화된 카테고리 또는 빈 문자열
 */
export function normalizeCategory(v?: string | null): string {
  const raw = (v ?? '').trim();
  return raw ? (toServer[raw.toLowerCase()] ?? raw) : '';
}