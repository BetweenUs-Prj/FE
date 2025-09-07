import type {
  Friend,
  FriendRequest,
  SentFriendRequest,
  CreateFriendRequestData,
  FriendRequestResponse,
  FriendsListResponse,
  FriendRequestsResponse,
  SentFriendRequestsResponse,
  PendingCountResponse,
  FriendCheckResponse,
  ApiError
} from '@/types/friend.ts';

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// 공통 API 요청 함수
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    // TODO: 실제 인증 토큰 추가
    // 'Authorization': `Bearer ${getAuthToken()}`,
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API 요청 실패 (${endpoint}):`, error);
    throw error;
  }
};

// 친구 요청 생성 (POST /friends/requests)
export const createFriendRequest = async (
  data: CreateFriendRequestData
): Promise<FriendRequestResponse> => {
  return apiRequest<FriendRequestResponse>('/friends/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 친구 요청 수락 (POST /friends/requests/{id}/accept)
export const acceptFriendRequest = async (
  requestId: number
): Promise<FriendRequestResponse> => {
  return apiRequest<FriendRequestResponse>(`/friends/requests/${requestId}/accept`, {
    method: 'POST',
  });
};

// 친구 요청 거절 (POST /friends/requests/{id}/reject)
export const rejectFriendRequest = async (
  requestId: number
): Promise<FriendRequestResponse> => {
  return apiRequest<FriendRequestResponse>(`/friends/requests/${requestId}/reject`, {
    method: 'POST',
  });
};

// 친구 요청 취소 (DELETE /friends/requests/{id})
export const cancelFriendRequest = async (
  requestId: number
): Promise<FriendRequestResponse> => {
  return apiRequest<FriendRequestResponse>(`/friends/requests/${requestId}`, {
    method: 'DELETE',
  });
};

// 받은 친구 요청 목록 조회 (GET /friends/requests/received)
export const getReceivedFriendRequests = async (): Promise<FriendRequestsResponse> => {
  return apiRequest<FriendRequestsResponse>('/friends/requests/received');
};

// 보낸 친구 요청 목록 조회 (GET /friends/requests/sent)
export const getSentFriendRequests = async (): Promise<SentFriendRequestsResponse> => {
  return apiRequest<SentFriendRequestsResponse>('/friends/requests/sent');
};

// 대기 중인 요청 개수 조회 (GET /friends/requests/pending/count)
export const getPendingRequestCount = async (): Promise<PendingCountResponse> => {
  return apiRequest<PendingCountResponse>('/friends/requests/pending/count');
};

// 친구 목록 조회 (GET /friends)
export const getFriendsList = async (): Promise<FriendsListResponse> => {
  return apiRequest<FriendsListResponse>('/friends');
};

// 친구 삭제 (DELETE /friends/{friendId})
export const deleteFriend = async (
  friendId: number
): Promise<FriendRequestResponse> => {
  return apiRequest<FriendRequestResponse>(`/friends/${friendId}`, {
    method: 'DELETE',
  });
};

// 친구 관계 확인 (GET /friends/check/{otherUserId})
export const checkFriendStatus = async (
  otherUserId: number
): Promise<FriendCheckResponse> => {
  return apiRequest<FriendCheckResponse>(`/friends/check/${otherUserId}`);
};

// 사용자 검색 (추가 기능)
export const searchUsers = async (
  query: string
): Promise<{
  success: boolean;
  message: string;
  data: Array<{
    id: number;
    name: string;
    email: string;
  }>;
}> => {
  return apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
};

// 친구 추가 검증 함수들
export const validateFriendRequest = (
  receiverId: number,
  currentUserId: number,
  existingFriends: Friend[],
  sentRequests: SentFriendRequest[],
  receivedRequests: FriendRequest[]
): { isValid: boolean; errorMessage?: string } => {
  // 자기 자신에게 요청 방지
  if (receiverId === currentUserId) {
    return {
      isValid: false,
      errorMessage: '자기 자신에게는 친구 요청을 보낼 수 없습니다.'
    };
  }

  // 이미 친구인 경우 방지
  const isAlreadyFriend = existingFriends.some(friend => friend.id === receiverId);
  if (isAlreadyFriend) {
    return {
      isValid: false,
      errorMessage: '이미 친구인 사용자입니다.'
    };
  }

  // 중복 요청 방지 (보낸 요청)
  const hasSentRequest = sentRequests.some(request => 
    request.receiverId === receiverId && request.status === 'pending'
  );
  if (hasSentRequest) {
    return {
      isValid: false,
      errorMessage: '이미 친구 요청을 보낸 사용자입니다.'
    };
  }

  // 중복 요청 방지 (받은 요청)
  const hasReceivedRequest = receivedRequests.some(request => 
    request.senderId === receiverId && request.status === 'pending'
  );
  if (hasReceivedRequest) {
    return {
      isValid: false,
      errorMessage: '이미 이 사용자로부터 친구 요청을 받았습니다.'
    };
  }

  return { isValid: true };
};
