# 우리사이 (BetweenUs) Frontend

'우리사이' 의 frontend를 구현하기 위한 repository 입니다. React + Vite 기반으로 구축되었습니다.

## 🚀 시작하기

### 로컬 개발 환경 설정

이 프론트엔드는 백엔드 서버(MiniGameService)와 연동하여 동작합니다.

#### 1. 백엔드 실행
```bash
# 백엔드 서버 실행 (포트 8080)
cd C:\Users\82106\Workspace\MiniGameService
.\gradlew bootRun
```

#### 2. 프론트엔드 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 5173, Vite 기본 포트)
npm run dev
```

#### 3. 연결 상태 확인
```powershell
# 백엔드 상태 확인
irm http://localhost:8080/actuator/health

# 프론트엔드 접속
# http://localhost:5173
```

### 개발 환경 세부 설정

- **프록시 설정**: `vite.config.ts`에서 `/api`와 `/ws` 경로를 `http://localhost:8080`으로 프록시
- **환경변수**: `.env.development.local`에서 `VITE_API_BASE_URL=/api` 설정
- **CORS**: 백엔드에서 `localhost:3000`, `localhost:5173` 허용 설정 완료
- **WebSocket**: STOMP 프로토콜 사용, `/ws` 엔드포인트로 연결

### 기타 명령어

```bash
# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

**중요**: 프록시는 개발 전용 설정이며, 배포 시에는 환경변수나 빌드 설정으로 API baseURL을 교체해야 합니다.

### 벌칙 추가 (개발 모드)

벌칙 선택 화면에서 새로운 벌칙을 추가할 수 있습니다.

#### 기능 설명
- **공개 벌칙**: 모든 사용자가 볼 수 있는 벌칙 (`userUid: null`)
- **개인 벌칙**: 현재 사용자만 볼 수 있는 벌칙 (`userUid: 현재_사용자_ID`)
- `X-USER-UID` 헤더가 자동으로 추가되어 백엔드에서 사용자를 식별합니다.

#### curl 테스트 예시
```powershell
# 공개 벌칙 생성
curl -s -H "Content-Type: application/json" -H "X-USER-UID: test-user" ^
     -d "{\"description\":\"테스트 벌칙\",\"userUid\":null}" ^
     http://localhost:5173/api/penalties

# 개인 벌칙 생성  
curl -s -H "Content-Type: application/json" -H "X-USER-UID: test-user" ^
     -d "{\"description\":\"내 전용 벌칙\",\"userUid\":\"test-user\"}" ^
     http://localhost:5173/api/penalties
```

### 퀴즈 시작 (카테고리 선택)

퀴즈 게임을 선택하면 카테고리를 선택한 후 세션을 시작할 수 있습니다.

#### 기능 흐름
1. **벌칙 선택**: 원하는 벌칙을 선택하고 "확정하기" 클릭
2. **카테고리 선택**: 퀴즈 카테고리 선택 화면이 나타남
   - 백엔드에서 카테고리 목록 조회: `GET /api/mini-games/categories`  
   - 실패 시 기본 카테고리 사용: `['음식', '상식', '스포츠', '영화', '음악']`
3. **퀴즈 시작**: 선택한 카테고리로 퀴즈 세션 생성 및 문제 로드

#### API 호출 순서
```powershell
# 1. 퀴즈 세션 생성 (카테고리 포함)
curl -v -H "Content-Type: application/json" -H "X-USER-UID: test-user-123" ^
     -d "{\"gameType\":\"QUIZ\",\"totalRounds\":5,\"category\":\"음식\",\"penaltyId\":1}" ^
     http://localhost:5173/api/mini-games/sessions

# 2. 해당 카테고리 문제 조회
curl -s "http://localhost:5173/api/mini-games/questions?category=음식&page=0&size=5"

# 3. 라운드 시작 (각 라운드마다)
curl -v -H "Content-Type: application/json" -H "X-USER-UID: test-user-123" ^
     -d "{\"questionId\":1}" ^
     http://localhost:5173/api/mini-games/sessions/{sessionId}/rounds
```

#### 상태 관리
- **Zustand Store**: 선택한 카테고리, 로드된 질문들, 현재 라운드 인덱스 저장
- **네트워크 탭 확인사항**:
  - `POST /api/mini-games/sessions` - payload에 `category` 포함
  - `GET /api/mini-games/questions` - 카테고리별 문제 로드  
  - `POST /api/mini-games/sessions/{sessionId}/rounds` - 각 라운드 시작

## 🚦 라우팅(react-router-dom) 설치 및 사용법

이 프로젝트는 페이지 이동과 라우팅을 위해 [react-router-dom](https://reactrouter.com/)을 사용합니다.

### 사용 예시

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MainPage from './pages/MainPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/main" element={<MainPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## 📁 폴더 구조 및 설명

```plaintext
src/
├─ assets/          # 이미지, 아이콘 등 정적 리소스
├─ components/      # 재사용 가능한 UI 컴포넌트
├─ pages/           # 라우팅 대상 페이지 컴포넌트
├─ routes/          # 라우팅 설정 파일 (React Router)
├─ hooks/           # 커스텀 훅 (재사용 가능한 상태관리 로직)
├─ utils/           # 유틸리티 함수 모음 (날짜 포맷 등)
├─ styles/          # 전역 스타일 및 CSS 관련 파일
├─ types/           # TypeScript 타입 정의
└─ api/             # API 요청 함수들
```

## 폴더별 역할 및 사용 예시

### 1. `routes/` – 라우팅 설정

* URL 경로와 페이지 컴포넌트를 연결합니다.
* React Router 설정을 한 곳에서 관리합니다.

```tsx
// src/routes/index.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import About from '@/pages/About';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 2. `hooks/` – 커스텀 훅

* 자주 사용하는 상태관리, 효과 처리 로직을 재사용 가능한 함수로 분리합니다.

```tsx
// src/hooks/useToggle.ts
import { useState } from 'react';

export default function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = () => setValue(prev => !prev);
  return [value, toggle] as const;
}
```

### 3. `utils/` – 유틸리티 함수

* 컴포넌트와 무관하게 재사용 가능한 순수 함수들을 모아둡니다.

```ts
// src/utils/formatDate.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
```

### 4. `styles/` – 전역 스타일

* Tailwind CSS 설정, 전역 CSS, 폰트, 다크모드 등 스타일 관련 파일을 관리합니다.

```css
/* src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Pretendard', sans-serif;
}
```

### 5. `types/` – 타입 정의

* API 요청/응답 타입 관리
* 코드 자동 완성 및 오류 방지
* 협업과 유지보수에 도움

```ts
// src/types/api.ts
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;  // 선택적 필드
}

export interface Order {
  orderId: string;
  product: string;
  quantity: number;
  price: number;
  status: 'pending' | 'completed' | 'cancelled';
}
```

### 6. `api/` – API 요청 함수

* Axios 인스턴스를 이용해 백엔드 엔드포인트에 요청을 보내는 함수 작성
* 타입스크립트로 요청/응답 타입 지정 권장

```ts
// src/api/user.ts
import axiosInstance from './axiosInstance';
import type { UserProfile } from '@/types/api';

export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await axiosInstance.get('/user/profile');
  return response.data;
}
```

## 사용 예시

### 페이지 컴포넌트에서 데이터 호출

```tsx
import React, { useEffect, useState } from 'react';
import { fetchUserProfile } from '@/api/user';
import type { UserProfile } from '@/types/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile()
      .then(data => setProfile(data))
      .catch(() => setError('데이터를 불러오는 중 오류가 발생했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>{profile?.username}님의 프로필</h1>
      <p>이메일: {profile?.email}</p>
    </div>
  );
}
```

## 참고

* 프로젝트 내 **모듈 경로 별칭(alias)**로 `@/`를 `src/` 폴더에 연결해 import 시 가독성을 높이고 경로를 간단하게 유지합니다.

```ts
// vite.config.ts 예시
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **React Router DOM** - 라우팅
- **React Query** - 서버 상태 관리
- **Axios** - HTTP 클라이언트
