// 친구 관련 타입 정의

export interface Friend {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: 'online' | 'offline' | 'busy';
  location?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  receiver: {
    id: number;
    name: string;
    email: string;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface SentFriendRequest {
  id: number;
  receiverId: number;
  receiver: {
    id: number;
    name: string;
    email: string;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFriendRequestData {
  receiverId: number;
  message?: string;
}

export interface FriendRequestResponse {
  success: boolean;
  message: string;
  data?: FriendRequest;
}

export interface FriendsListResponse {
  success: boolean;
  message: string;
  data: Friend[];
  total: number;
}

export interface FriendRequestsResponse {
  success: boolean;
  message: string;
  data: FriendRequest[];
  total: number;
}

export interface SentFriendRequestsResponse {
  success: boolean;
  message: string;
  data: SentFriendRequest[];
  total: number;
}

export interface PendingCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface FriendCheckResponse {
  success: boolean;
  message: string;
  data: {
    isFriend: boolean;
    hasPendingRequest: boolean;
    requestId?: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  statusCode?: number;
}
