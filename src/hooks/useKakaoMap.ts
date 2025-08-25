import { useEffect, useRef } from 'react';

interface MarkerInfo {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  type?: 'station' | 'place';
  isHighlighted?: boolean;
  isVisible?: boolean;
}

interface KakaoMapOptions {
  center: {
    lat: number;
    lng: number;
  };
  level?: number;
  draggable?: boolean;
  zoomable?: boolean;
  scrollwheel?: boolean;
  disableDoubleClickZoom?: boolean;
  disableDoubleTapZoom?: boolean;
}

interface UseKakaoMapProps {
  containerId: string;
  options: KakaoMapOptions;
  appKey: string;
  markers?: MarkerInfo[];
  onMarkerClick?: (markerId: string) => void;
}

export const useKakaoMap = ({ containerId, options, appKey, markers = [], onMarkerClick }: UseKakaoMapProps) => {
  const mapRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // 이미 스크립트가 로드되어 있는지 확인
    if (scriptLoadedRef.current) {
      initializeMap();
      return;
    }

    // 카카오맵 SDK 로드
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}`;
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      initializeMap();
    };
    document.head.appendChild(script);

    // 클린업 함수
    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [containerId, options, appKey]);

  // 마커 관리 useEffect
  useEffect(() => {
    if (!mapRef.current || !window.kakao || !window.kakao.maps) return;

    // 기존 마커들 제거
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 마커가 비어있으면 더 이상 진행하지 않음 (모든 마커 제거됨)
    if (markers.length === 0) {
      return;
    }

    // 새로운 마커들 생성
    markers.forEach(markerInfo => {
      // 기본값 설정
      const isVisible = markerInfo.isVisible ?? true; // undefined면 true로 설정
      
      // 가시성이 false인 마커는 생성하지 않음
      if (!isVisible) {
        return;
      }
      
      // 마커 생성 (기본 마커 사용)
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(
          markerInfo.position.lat, 
          markerInfo.position.lng
        ),
        map: mapRef.current
      });

      // 타입별로 Z-Index 설정
      if (markerInfo.isHighlighted) {
        // 강조된 마커는 위에 표시
        marker.setZIndex(1000);
      } else if (markerInfo.type === 'station') {
        // 역 마커는 중간 레이어
        marker.setZIndex(500);
      }
      // 일반 장소 마커는 기본 레이어

      // 마커 클릭 이벤트 추가
      if (onMarkerClick) {
        window.kakao.maps.event.addListener(marker, 'click', () => {
          onMarkerClick(markerInfo.id);
        });
      }

      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;">${markerInfo.title}</div>`
      });

      // 마커 클릭 시 인포윈도우 표시
      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  const initializeMap = () => {
    const mapContainer = document.getElementById(containerId);
    if (mapContainer && window.kakao && window.kakao.maps) {
      const mapOption = {
        center: new window.kakao.maps.LatLng(options.center.lat, options.center.lng),
        level: options.level || 3,
        draggable: options.draggable ?? true,
        zoomable: options.zoomable ?? true,
        scrollwheel: options.scrollwheel ?? true,
        disableDoubleClickZoom: options.disableDoubleClickZoom ?? false,
        disableDoubleTapZoom: options.disableDoubleTapZoom ?? false
      };
      
      mapRef.current = new window.kakao.maps.Map(mapContainer, mapOption);
    }
  };

  return { map: mapRef.current };
};
