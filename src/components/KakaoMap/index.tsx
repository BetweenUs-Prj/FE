import React from 'react';
import { useKakaoMap } from '../../hooks/useKakaoMap';
import styles from './KakaoMap.module.css';

interface KakaoMapProps {
  containerId: string;
  center: {
    lat: number;
    lng: number;
  };
  level?: number;
  appKey: string;
  className?: string;
  style?: React.CSSProperties;
  // 상호작용 설정
  draggable?: boolean;        // 지도 드래그 가능 여부
  zoomable?: boolean;         // 지도 확대/축소 가능 여부
  scrollwheel?: boolean;      // 마우스 휠로 확대/축소 가능 여부
  disableDoubleClickZoom?: boolean;  // 더블클릭 확대 비활성화
  disableDoubleTapZoom?: boolean;    // 더블탭 확대 비활성화
  
  // 추가 가능한 기능들 (주석으로만 표시)
  // mapTypeId?: string;         // 지도 타입 (roadmap, satellite, hybrid)
  // keyboardShortcuts?: boolean; // 키보드 단축키 사용 가능 여부
  // mapTypeControl?: boolean;    // 지도 타입 컨트롤 표시 여부
  // zoomControl?: boolean;       // 확대/축소 컨트롤 표시 여부
  // scaleControl?: boolean;      // 축척 컨트롤 표시 여부
  // tilt?: number;              // 지도 기울기 (0-60도)
  // heading?: number;           // 지도 회전 각도 (0-360도)
  // maxLevel?: number;          // 최대 확대 레벨
  // minLevel?: number;          // 최소 확대 레벨
  // onLoad?: () => void;        // 지도 로드 완료 시 호출되는 함수
  // onZoomChanged?: () => void; // 확대/축소 변경 시 호출되는 함수
  // onCenterChanged?: () => void; // 중심 좌표 변경 시 호출되는 함수
}

const KakaoMap: React.FC<KakaoMapProps> = ({
  // 필수 props
  containerId,        // 지도를 표시할 DOM 요소의 ID
  center,             // 지도의 중심 좌표 (위도, 경도)
  appKey,             // 카카오맵 API 키
  level = 3,          // 지도의 확대 레벨 (기본값: 3)
  
  // 스타일링 props
  className = '',     // CSS 클래스명
  style = {},         // 인라인 스타일
  
  // 상호작용 설정
  draggable = true,   // 지도 드래그 가능 여부 (기본값: true)
  zoomable = true,    // 지도 확대/축소 가능 여부 (기본값: true)
  scrollwheel = true, // 마우스 휠로 확대/축소 가능 여부 (기본값: true)
  disableDoubleClickZoom = false,  // 더블클릭 확대 비활성화 (기본값: false)
  disableDoubleTapZoom = false     // 더블탭 확대 비활성화 (기본값: false)
}) => {
  useKakaoMap({
    containerId,
    options: { 
      center, 
      level,
      draggable,
      zoomable,
      scrollwheel,
      disableDoubleClickZoom,
      disableDoubleTapZoom
    },
    appKey
  });

  return (
    <div 
      id={containerId}
      className={`kakao-map-container ${className}`}
      style={style}
    />
  );
};

export default KakaoMap;
