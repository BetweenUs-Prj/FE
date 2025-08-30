import { useEffect, useRef, useCallback } from 'react';
// import { KAKAO_MOBILITY_API_KEY } from '../constants/config';

interface MarkerInfo {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
  content?: string;
  isVisible?: boolean;
}

interface RouteInfo {
  from: { lat: number; lng: number; id?: string };
  to: { lat: number; lng: number; id?: string };
  color?: string;
}

interface UseKakaoMapProps {
  containerId: string;
  options: {
    center: { lat: number; lng: number };
    level?: number;
    draggable?: boolean;
    zoomable?: boolean;
    scrollwheel?: boolean;
    disableDoubleClickZoom?: boolean;
    disableDoubleTapZoom?: boolean;
  };
  appKey: string;
  markers?: MarkerInfo[];
  routes?: RouteInfo[];
  onMarkerClick?: (marker: MarkerInfo) => void;
  disableAutoCenter?: boolean; // 자동 중심 조정 비활성화 옵션
}

export const useKakaoMap = ({ containerId, options, appKey, markers = [], routes = [], onMarkerClick, disableAutoCenter = false }: UseKakaoMapProps) => {
  const mapRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const markersRef = useRef<any[]>([]);
  const routesRef = useRef<any[]>([]); // 경로 라인들을 저장할 ref
  

  
  // 각 친구별 고유 색상 배열
  const friendColors = [
    '#FF6B6B', // 빨간색
    '#DDA0DD', // 연보라색
    '#98D8C8', // 민트색
    '#4ECDC4', // 청록색
    '#45B7D1', // 파란색
    '#96CEB4', // 연두색
    '#FFEAA7', // 노란색
    '#F7DC6F', // 골드색
    '#BB8FCE', // 보라색
    '#85C1E9'  // 하늘색
  ];



  // 이벤트 리스너 참조 저장
  const eventListenersRef = useRef<any[]>([]);

  // 지도 이벤트 리스너 적용 (메모리 누수 방지)
  const applyMapEventListeners = useCallback(() => {
    if (!mapRef.current) return;

    // 기존 이벤트 리스너들 모두 제거
    eventListenersRef.current.forEach(listener => {
      if (listener && listener.map && listener.event) {
        try {
          window.kakao.maps.event.removeListener(listener.map, listener.event, listener.handler);
        } catch (error) {
          console.warn('이벤트 리스너 제거 실패:', error);
        }
      }
    });
    eventListenersRef.current = [];

    // 새로운 이벤트 리스너 추가
    const dragendHandler = () => {
      // 드래그 완료 시 필요한 로직만
    };

    const zoomChangedHandler = () => {
      // 줌 변경 시 필요한 로직만
    };

    // 이벤트 리스너 등록 및 참조 저장
    const dragendListener = window.kakao.maps.event.addListener(mapRef.current, 'dragend', dragendHandler);
    const zoomListener = window.kakao.maps.event.addListener(mapRef.current, 'zoom_changed', zoomChangedHandler);

    // 리스너 참조 저장
    eventListenersRef.current.push(
      { map: mapRef.current, event: 'dragend', handler: dragendHandler, listener: dragendListener },
      { map: mapRef.current, event: 'zoom_changed', handler: zoomChangedHandler, listener: zoomListener }
    );
  }, []);

  // 브라우저 크기 변화 감지 및 지도 재조정 (타임아웃 누수 방지)
  useEffect(() => {
    let resizeTimeoutId: NodeJS.Timeout | null = null;

    const handleResize = () => {
      if (mapRef.current) {
        // 이전 타임아웃 취소
        if (resizeTimeoutId) {
          clearTimeout(resizeTimeoutId);
        }

        // 새로운 타임아웃 설정
        resizeTimeoutId = setTimeout(() => {
          if (mapRef.current) {
            try {
              mapRef.current.relayout();
            } catch (error) {
              console.error('지도 재조정 중 오류:', error);
            }
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId);
      }
    };
  }, []);

  useEffect(() => {
    // 이미 스크립트가 로드되어 있는지 확인
    if (scriptLoadedRef.current) {
      initializeMap();
      return;
    }

    // 카카오맵 SDK 로드 (services 라이브러리 포함)
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services`;
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      console.log('카카오맵 SDK 로드 완료');
      initializeMap();
    };
    script.onerror = (error) => {
      console.error('카카오맵 SDK 로드 실패:', error);
    };
    document.head.appendChild(script);

    // 클린업 함수
    return () => {
      // 이벤트 리스너들 정리
      eventListenersRef.current.forEach(listener => {
        if (listener && listener.map && listener.event) {
          try {
            window.kakao.maps.event.removeListener(listener.map, listener.event, listener.handler);
          } catch (error) {
            console.warn('이벤트 리스너 정리 실패:', error);
          }
        }
      });
      eventListenersRef.current = [];

      // 마커들 정리
      markersRef.current.forEach(marker => {
        if (marker) {
          try {
            marker.setMap(null);
          } catch (error) {
            console.warn('마커 정리 실패:', error);
          }
        }
      });
      markersRef.current = [];

      // 경로들 정리
      routesRef.current.forEach(route => {
        if (route) {
          try {
            route.setMap(null);
          } catch (error) {
            console.warn('경로 정리 실패:', error);
          }
        }
      });
      routesRef.current = [];

      // 맵 인스턴스 정리
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [containerId, options, appKey]);

  // options 변경 시 맵 업데이트 (동기적 처리)
  useEffect(() => {
    if (mapRef.current && options) {
      try {
        const center = new window.kakao.maps.LatLng(options.center.lat, options.center.lng);
        mapRef.current.setCenter(center);
        
        if (options.level !== undefined) {
          mapRef.current.setLevel(options.level);
        }
      } catch (error) {
        console.error('맵 업데이트 중 오류:', error);
      }
    }
  }, [options]);

  // 마커 관리 useEffect (동기적 처리)
  useEffect(() => {
    if (!mapRef.current || !markers) return;

    try {
      // 기존 마커들 제거
      markersRef.current.forEach(marker => {
        if (marker) {
          try {
            marker.setMap(null);
          } catch (error) {
            console.warn('마커 제거 실패:', error);
          }
        }
      });
      markersRef.current = [];

      // 새로운 마커들 추가
      markers.forEach(markerInfo => {
        if (!markerInfo.isVisible) return;

        const position = new window.kakao.maps.LatLng(markerInfo.position.lat, markerInfo.position.lng);
        
        const marker = new window.kakao.maps.Marker({
          position: position,
          map: mapRef.current
        });

        // 인포윈도우 생성 (제목이나 내용이 있는 경우)
        if (markerInfo.title || markerInfo.content) {
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding:10px;min-width:200px;">
                ${markerInfo.title ? `<h3 style="margin:0 0 5px 0;font-size:14px;">${markerInfo.title}</h3>` : ''}
                ${markerInfo.content ? `<p style="margin:0;font-size:12px;">${markerInfo.content}</p>` : ''}
              </div>
            `
          });

          // 클릭 이벤트 추가
          window.kakao.maps.event.addListener(marker, 'click', () => {
            infowindow.open(mapRef.current, marker);
            if (onMarkerClick) {
              onMarkerClick(markerInfo);
            }
          });

          // 마커에 인포윈도우 참조 저장
          (marker as any).infowindow = infowindow;
        }

        markersRef.current.push(marker);
      });
    } catch (error) {
      console.error('마커 업데이트 중 오류:', error);
    }

    // 클린업 함수
    return () => {
      markersRef.current.forEach(marker => {
        if (marker) {
          try {
            marker.setMap(null);
          } catch (error) {
            console.warn('마커 정리 실패:', error);
          }
        }
      });
      markersRef.current = [];
    };
  }, [markers, onMarkerClick]);

  // 경로 관리 useEffect
  useEffect(() => {
    console.log('useKakaoMap routes useEffect 호출됨:', routes);
    
    if (!mapRef.current || !routes || routes.length === 0) {
      console.log('맵이 초기화되지 않았거나 경로가 없음');
      return;
    }

    // 기존 경로 라인들 제거
    routesRef.current.forEach(route => route.setMap(null));
    routesRef.current = [];

    // 개선된 경로 생성 함수 (먼저 정의)
    const createImprovedRoute = (routeInfo: any, index: number) => {
      // 개선된 경로 생성 (곡선 효과)
      const path = [];
      const steps = 12;
      
      for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const lat = routeInfo.from.lat + (routeInfo.to.lat - routeInfo.from.lat) * ratio;
        const lng = routeInfo.from.lng + (routeInfo.to.lng - routeInfo.from.lng) * ratio;
        
        if (i > 0 && i < steps) {
          const curveIntensity = 0.001;
          const offset = Math.sin(ratio * Math.PI) * curveIntensity;
          path.push(new window.kakao.maps.LatLng(lat + offset, lng));
        } else {
          path.push(new window.kakao.maps.LatLng(lat, lng));
        }
      }

      const polyline = new window.kakao.maps.Polyline({
        path: path,
        strokeWeight: 8, // 굵기 증가 (4 → 8)
        strokeColor: routeInfo.color || '#FF6B6B',
        strokeOpacity: 1.0, // 투명도 증가 (0.8 → 1.0)
        strokeStyle: 'solid'
      });

      polyline.setMap(mapRef.current);
      routesRef.current.push(polyline);
      console.log(`개선된 경로 라인 생성 완료: ${index + 1}번째 경로`, routeInfo);
    };

    // 각 경로에 대해 시뮬레이션 경로 생성
    routes.forEach((routeInfo, index) => {
      // 친구 ID에서 색상 인덱스 추출 (friend-1 -> 0, friend-2 -> 1, ...)
      const fromId = routeInfo.from.id || `friend-${index + 1}`;
      const friendNumber = fromId.replace('friend-', '');
      const friendIndex = parseInt(friendNumber) - 1;
      const colorIndex = friendIndex % friendColors.length;
      const routeColor = friendColors[colorIndex];
      
      // routeInfo에 고유 색상 추가
      routeInfo.color = routeColor;
      
      console.log(`길찾기 요청: ${index + 1}번째 경로`, routeInfo);
      
      // 시뮬레이션 모드로 경로 생성
      console.log(`시뮬레이션 모드로 경로 생성: ${index + 1}번째 경로`);
      createImprovedRoute(routeInfo, index);
    });
    
    console.log('길찾기 요청 완료, 총 개수:', routes.length);
    
    // 경로가 생성된 후 지도의 시점을 자동으로 조정
    if (routes.length > 0 && !disableAutoCenter) {
      // 모든 경로의 시작점과 끝점을 포함하는 경계 계산
      const bounds = new window.kakao.maps.LatLngBounds();
      
      routes.forEach(route => {
        bounds.extend(new window.kakao.maps.LatLng(route.from.lat, route.from.lng));
        bounds.extend(new window.kakao.maps.LatLng(route.to.lat, route.to.lng));
      });
      
      // 경계에 패딩 추가하여 모든 경로가 잘 보이도록 조정
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      
      // 경로들 간의 거리에 따라 동적으로 패딩 계산
      const latDiff = ne.getLat() - sw.getLat();
      const lngDiff = ne.getLng() - sw.getLng();
      
      // 거리에 비례하여 패딩 설정 (최소 0.005, 최대 0.02)
      const latPadding = Math.max(0.005, Math.min(0.02, latDiff * 0.2));
      const lngPadding = Math.max(0.005, Math.min(0.02, lngDiff * 0.2));
      
      const paddedBounds = new window.kakao.maps.LatLngBounds(
        new window.kakao.maps.LatLng(sw.getLat() - latPadding, sw.getLng() - lngPadding),
        new window.kakao.maps.LatLng(ne.getLat() + latPadding, ne.getLng() + lngPadding)
      );
      
      // 패딩이 적용된 경계로 맵 영역 설정
      mapRef.current.setBounds(paddedBounds);
      console.log('경로 생성 후 맵 영역 자동 조정 완료');
    }
  }, [routes, disableAutoCenter]);

  const initializeMap = () => {
    const mapContainer = document.getElementById(containerId);
    if (mapContainer && window.kakao && window.kakao.maps) {
      // 이미 맵 인스턴스가 존재하면 재사용
      if (mapRef.current) {
        console.log('기존 맵 인스턴스 재사용');
        return;
      }
      
      // 컨테이너 크기를 명시적으로 설정
      mapContainer.style.width = '100vw';
      mapContainer.style.height = '100vh';
      mapContainer.style.position = 'fixed';
      mapContainer.style.top = '0';
      mapContainer.style.left = '0';
      
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
      
      // 지도 초기화 후 이벤트 리스너 적용
      applyMapEventListeners();
      
      // 지도 크기 재조정 (동기적 처리)
      if (mapRef.current) {
        mapRef.current.relayout();
      }
      
      console.log('새로운 맵 인스턴스 생성 완료');
    }
  };



  return { map: mapRef.current };
};
