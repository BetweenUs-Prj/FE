import axios, { AxiosHeaders } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

let userUid =
  (import.meta as any).env?.VITE_DEV_USER_UID ||
  localStorage.getItem('userUid');

if (!userUid) {
  userUid =
    'user-' +
    (globalThis.crypto?.randomUUID?.().slice(0, 8) ??
      Math.random().toString(36).slice(2, 10));
  localStorage.setItem('userUid', userUid);
}

export const http = axios.create({ baseURL: API_BASE });

// 전역 기본 헤더(안전망)
axios.defaults.headers.common['X-USER-UID'] = userUid;

// 공용 인스턴스 인터셉터
http.interceptors.request.use((config) => {
  const headers = (config.headers ??= new AxiosHeaders());
  headers.set('X-USER-UID', userUid);
  return config;
});

export function setUserUid(uid: string) {
  userUid = uid;
  localStorage.setItem('userUid', uid);
  axios.defaults.headers.common['X-USER-UID'] = uid;
}
