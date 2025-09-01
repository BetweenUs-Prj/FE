import { http } from './http';

// Default categories to use when backend doesn't provide them
export const DEFAULT_CATEGORIES = ['술', '역사', '스포츠', '음식', '상식'];

// Default penalties to use when backend doesn't provide them
export const DEFAULT_PENALTIES: Penalty[] = [
  { penaltyId: 1, slug: 'dance', text: '춤추기', emoji: '💃', userUid: 'system', createdAt: new Date().toISOString() },
  { penaltyId: 2, slug: 'sing', text: '노래하기', emoji: '🎤', userUid: 'system', createdAt: new Date().toISOString() },
  { penaltyId: 3, slug: 'laugh', text: '웃기', emoji: '😄', userUid: 'system', createdAt: new Date().toISOString() },
  { penaltyId: 4, slug: 'photo', text: '사진찍기', emoji: '📸', userUid: 'system', createdAt: new Date().toISOString() },
  { penaltyId: 5, slug: 'monkey', text: '원숭이 흉내내기', emoji: '🐒', userUid: 'system', createdAt: new Date().toISOString() }
];

export interface Penalty {
  id: number;
  text: string;
  userUid?: string;
  slug?: string;
}

export interface CreatePenaltyRequest {
  description: string;
}

/**
 * 카테고리 목록을 가져옵니다.
 */
export const listCategories = async (): Promise<string[]> => {
  try {
    const response = await http.get('/mini-games/categories');
    
    const data = response.data;
    
    // API 응답이 배열인 경우
    if (Array.isArray(data)) {
      return data.map((item: any) => 
        typeof item === 'string' ? item : 
        typeof item === 'object' && item.name ? item.name : 
        String(item)
      );
    }
    
    // API 응답이 객체이고 categories 필드가 있는 경우
    if (data.categories && Array.isArray(data.categories)) {
      return data.categories.map((item: any) => 
        typeof item === 'string' ? item : 
        typeof item === 'object' && item.name ? item.name : 
        String(item)
      );
    }
    
    // 기본값 반환
    return ['GENERAL_KNOWLEDGE', 'HISTORY', 'SCIENCE', 'SPORTS', 'FOOD'];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ['GENERAL_KNOWLEDGE', 'HISTORY', 'SCIENCE', 'SPORTS', 'FOOD'];
  }
};

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

/**
 * 벌칙 목록을 가져옵니다.
 */
export const listPenalties = async (): Promise<Penalty[]> => {
  try {
    const response = await http.get('/penalties');
    const data = response.data;
    
    // API 응답이 배열인 경우
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.id,
        text: item.text || item.description,
        userUid: item.userUid,
        slug: item.slug
      }));
    }
    
    // API 응답이 객체이고 penalties 필드가 있는 경우
    if (data.penalties && Array.isArray(data.penalties)) {
      return data.penalties.map((item: any) => ({
        id: item.id,
        text: item.text || item.description,
        userUid: item.userUid,
        slug: item.slug
      }));
    }
    
    // 기본값 반환
    return [];
  } catch (error) {
    console.error('Error fetching penalties:', error);
    return [];
  }
};

/**
 * 벌칙 목록을 가져옵니다 (안전한 버전).
 */
export const listPenaltiesSafe = async (): Promise<Penalty[]> => {
  try {
    return await listPenalties();
  } catch (error) {
    console.error('Safe penalty fetching failed:', error);
    return [];
  }
};

/**
 * 새로운 벌칙을 생성합니다.
 */
export const createPenalty = async (request: CreatePenaltyRequest): Promise<Penalty> => {
  const response = await http.post('/penalties', request);
  return {
    id: response.data.id,
    text: response.data.text,
    userUid: response.data.userUid,
    slug: response.data.slug
  };
};

/**
 * 벌칙 생성 (안전한 버전)
 */
export const createPenaltySafe = async (request: CreatePenaltyRequest): Promise<Penalty> => {
  return await createPenalty(request);
};

/**
 * 벌칙을 삭제합니다.
 */
export const deletePenalty = async (penaltyId: number): Promise<void> => {
  await http.delete(`/penalties/${penaltyId}`);
};