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

  // options 변경 시 맵 업데이트
  useEffect(() => {
    if (mapRef.current && options.level) {
      mapRef.current.setLevel(options.level);
      console.log(`맵 레벨을 ${options.level}로 설정 (options 변경)`);
    }
  }, [options.level]);

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

    // 마커 개수에 따라 동적으로 레벨 조정
    const stationMarkers = markers.filter(marker => marker.type === 'station');
    const placeMarkers = markers.filter(marker => marker.type === 'place');
    const highlightedPlaceMarkers = placeMarkers.filter(marker => marker.isHighlighted);
    
    if (stationMarkers.length > 0 && placeMarkers.length === 0) {
      // 역 마커만 있을 때 (모든 역 표시) - 더 넓은 시야
      mapRef.current.setLevel(7);
      console.log('맵 레벨을 7로 설정 (모든 역 표시)');
    } else if (highlightedPlaceMarkers.length > 0) {
      // 선택된 추천 장소가 있을 때 - 역과 선택된 장소가 모두 보이도록 자동 조정
      const visibleMarkers = markers.filter(marker => marker.isVisible);
      if (visibleMarkers.length >= 2) {
        // 최소 2개 마커(역 + 선택된 장소)가 있을 때 자동 레벨 조정
        const bounds = new window.kakao.maps.LatLngBounds();
        visibleMarkers.forEach(marker => {
          bounds.extend(new window.kakao.maps.LatLng(marker.position.lat, marker.position.lng));
        });
        
        // 모든 마커가 보이도록 맵 영역 설정 (추천장소 쪽으로 약간 치우침)
        mapRef.current.setBounds(bounds);
        
        // 중간 지점을 오른쪽으로 이동
        const currentCenter = mapRef.current.getCenter();
        const offsetLng =  -0.001; // 오른쪽으로 이동할 경도 오프셋
        
        const newCenter = new window.kakao.maps.LatLng(
          currentCenter.getLat(),
          currentCenter.getLng() + offsetLng
        );
        mapRef.current.setCenter(newCenter);
        
        console.log('자동 레벨 조정으로 역과 선택된 장소가 모두 보이도록 설정 (추천장소 쪽으로 치우침)');
      } else {
        // 기본 레벨 1 설정
        mapRef.current.setLevel(1);
        console.log('맵 레벨을 1로 설정 (선택된 추천 장소 표시)');
      }
    } else if (placeMarkers.length > 0) {
      // 추천 장소 마커가 있을 때 - 자세한 시야
      mapRef.current.setLevel(3);
      console.log('맵 레벨을 3로 설정 (추천 장소 표시)');
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

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  const initializeMap = () => {
    const mapContainer = document.getElementById(containerId);
    if (mapContainer && window.kakao && window.kakao.maps) {
      const mapOption = {
        center: new window.kakao.maps.LatLng(options.center.lat, options.center.lng),
        level: options.level || 8, // 기본 레벨을 8로 설정
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
