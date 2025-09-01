import { useParams, useLocation } from 'react-router-dom';
import { useReactionStore } from '../hooks/useReactionStore';

/**
 * 세션 ID를 획득하는 우선순위:
 * 1. URL 파라미터 (useParams)
 * 2. location.state
 * 3. URLSearchParams (sid)
 * 4. sessionStorage
 * 5. 전역 store
 */
export function useSessionId(): number | null {
  const params = useParams();
  const location = useLocation();
  const { sessionId: storeSessionId } = useReactionStore();

  // 1. URL 파라미터에서 sessionId 추출
  const urlSessionId = params.sessionId;
  if (urlSessionId && !isNaN(Number(urlSessionId))) {
    return Number(urlSessionId);
  }

  // 2. location.state에서 추출
  const stateSessionId = (location.state as any)?.sessionId;
  if (stateSessionId && !isNaN(Number(stateSessionId))) {
    return Number(stateSessionId);
  }

  // 3. URLSearchParams에서 sid 추출
  const searchParams = new URLSearchParams(location.search);
  const sidParam = searchParams.get('sid');
  if (sidParam && !isNaN(Number(sidParam))) {
    return Number(sidParam);
  }

  // 4. sessionStorage에서 추출
  const storedSessionId = sessionStorage.getItem('reaction.sessionId');
  if (storedSessionId && !isNaN(Number(storedSessionId))) {
    return Number(storedSessionId);
  }

  // 5. 전역 store에서 추출
  if (storeSessionId) {
    return storeSessionId;
  }

  return null;
}

export function setSessionId(sessionId: number): void {
  // sessionStorage에 영속화
  sessionStorage.setItem('reaction.sessionId', sessionId.toString());
  
  // 전역 store 업데이트
  useReactionStore.getState().setSession(sessionId);
}

export function clearSessionId(): void {
  sessionStorage.removeItem('reaction.sessionId');
  useReactionStore.getState().resetGame();
}

/**
 * 동기적으로 세션 ID를 가져오는 함수 (hooks 외부에서 사용)
 */
export function getSessionIdSync(
  params: Record<string, string | undefined>,
  location: { state?: any; search?: string }
): number | null {
  // 1. URL path parameter
  if (params.sessionId && !isNaN(Number(params.sessionId))) {
    const sessionId = Number(params.sessionId);
    console.log('[SESSION-UTILS] Found sessionId from URL path parameter:', sessionId);
    // URL에서 찾은 경우 sessionStorage 업데이트
    sessionStorage.setItem('reaction.sessionId', sessionId.toString());
    return sessionId;
  }

  // 2. location.state
  const stateSessionId = location.state?.sessionId;
  if (stateSessionId && !isNaN(Number(stateSessionId))) {
    const sessionId = Number(stateSessionId);
    console.log('[SESSION-UTILS] Found sessionId from location.state:', sessionId);
    // state에서 찾은 경우 sessionStorage 업데이트
    sessionStorage.setItem('reaction.sessionId', sessionId.toString());
    return sessionId;
  }

  // 3. URLSearchParams - 다양한 파라미터 이름 지원 (sessionId, sessionid, sid)
  if (location.search) {
    const searchParams = new URLSearchParams(location.search);
    
    // sessionId (카멜케이스)
    let paramValue = searchParams.get('sessionId');
    if (paramValue && !isNaN(Number(paramValue))) {
      const sessionId = Number(paramValue);
      console.log('[SESSION-UTILS] Found sessionId from URL query (sessionId):', sessionId);
      // URL에서 찾은 경우 sessionStorage 업데이트
      sessionStorage.setItem('reaction.sessionId', sessionId.toString());
      return sessionId;
    }
    
    // sessionid (소문자)  
    paramValue = searchParams.get('sessionid');
    if (paramValue && !isNaN(Number(paramValue))) {
      const sessionId = Number(paramValue);
      console.log('[SESSION-UTILS] Found sessionId from URL query (sessionid):', sessionId);
      // URL에서 찾은 경우 sessionStorage 업데이트
      sessionStorage.setItem('reaction.sessionId', sessionId.toString());
      return sessionId;
    }
    
    // sid (기존 호환성)
    paramValue = searchParams.get('sid');
    if (paramValue && !isNaN(Number(paramValue))) {
      const sessionId = Number(paramValue);
      console.log('[SESSION-UTILS] Found sessionId from URL query (sid):', sessionId);
      // URL에서 찾은 경우 sessionStorage 업데이트
      sessionStorage.setItem('reaction.sessionId', sessionId.toString());
      return sessionId;
    }
  }

  // 4. sessionStorage (URL에서 찾지 못한 경우만 사용)
  const storedSessionId = sessionStorage.getItem('reaction.sessionId');
  if (storedSessionId && !isNaN(Number(storedSessionId))) {
    const sessionId = Number(storedSessionId);
    console.log('[SESSION-UTILS] Found sessionId from sessionStorage:', sessionId);
    return sessionId;
  }

  // 5. 전역 store
  const storeSessionId = useReactionStore.getState().sessionId;
  if (storeSessionId) {
    console.log('[SESSION-UTILS] Found sessionId from store:', storeSessionId);
    return storeSessionId;
  }

  console.log('[SESSION-UTILS] No sessionId found from any source');
  return null;
}