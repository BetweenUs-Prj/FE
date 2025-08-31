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
        console.log('🎯 맵 옵션 업데이트:', {
          draggable: options.draggable,
          zoomable: options.zoomable,
          disableDoubleClickZoom: options.disableDoubleClickZoom,
          disableDoubleTapZoom: options.disableDoubleTapZoom
        });
        
        const center = new window.kakao.maps.LatLng(options.center.lat, options.center.lng);
        mapRef.current.setCenter(center);
        
        if (options.level !== undefined) {
          mapRef.current.setLevel(options.level);
        }
        
        // 🎯 맵 상호작용 설정 업데이트
        if (options.draggable !== undefined) {
          mapRef.current.setDraggable(options.draggable);
        }
        if (options.zoomable !== undefined) {
          mapRef.current.setZoomable(options.zoomable);
        }
        // scrollwheel은 초기화 시에만 설정 가능하므로 동적 변경 불가
        // if (options.scrollwheel !== undefined) {
        //   mapRef.current.setScrollwheel(options.scrollwheel);
        // }
        if (options.disableDoubleClickZoom !== undefined) {
          mapRef.current.setDisableDoubleClickZoom(options.disableDoubleClickZoom);
        }
        if (options.disableDoubleTapZoom !== undefined) {
          mapRef.current.setDisableDoubleTapZoom(options.disableDoubleTapZoom);
        }
      } catch (error) {
        console.error('맵 업데이트 중 오류:', error);
      }
    }
  }, [options]);

  // 마커 관리 useEffect (깔끔한 전환)
  useEffect(() => {
    if (!mapRef.current || !markers) return;

    try {
      // 기존 마커들을 먼저 완전히 제거
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

      // 새로운 마커들 생성
      markers.forEach(markerInfo => {
        if (!markerInfo.isVisible) return;

        const position = new window.kakao.maps.LatLng(markerInfo.position.lat, markerInfo.position.lng);
        
        // 🎯 친구 마커 커스텀 아이콘 설정
        let markerOptions: any = {
          position: position,
          map: mapRef.current
        };

        // 친구 마커인 경우 커스텀 아이콘 사용
        if (markerInfo.id.startsWith('friend-')) {
          const friendId = parseInt(markerInfo.id.replace('friend-', ''));
          const colorIndex = (friendId - 1) % friendColors.length;
          const friendColor = friendColors[colorIndex];
          
          // 친구별 고유 색상의 원형 마커 생성 (크기 증가)
          const customIcon = new window.kakao.maps.MarkerImage(
            `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="${friendColor}" stroke="white" stroke-width="3"/>
                <text x="16" y="22" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${friendId}</text>
              </svg>
            `)}`,
            new window.kakao.maps.Size(32, 32),
            {
              offset: new window.kakao.maps.Point(16, 16)
            }
          );
          
          markerOptions.image = customIcon;
        }
        // 역 마커인 경우 지하철 아이콘 (크기 증가)
        else if (markerInfo.id.startsWith('station-')) {
          const stationIcon = new window.kakao.maps.MarkerImage(
            `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="5" width="22" height="22" rx="3" fill="#4A90E2" stroke="white" stroke-width="3"/>
                <text x="16" y="22" text-anchor="middle" fill="white" font-size="14" font-weight="bold">🚇</text>
              </svg>
            `)}`,
            new window.kakao.maps.Size(32, 32),
            {
              offset: new window.kakao.maps.Point(16, 16)
            }
          );
          
          markerOptions.image = stationIcon;
        }
        // 장소 마커인 경우 장소 아이콘 (크기 증가)
        else if (markerInfo.id.startsWith('place-')) {
          const placeIcon = new window.kakao.maps.MarkerImage(
            `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3C10.93 3 7 6.93 7 12c0 7 9 17 9 17s9-10 9-17c0-5.07-3.93-9-9-9z" fill="#FF6B6B" stroke="white" stroke-width="2"/>
                <circle cx="16" cy="12" r="3" fill="white"/>
              </svg>
            `)}`,
            new window.kakao.maps.Size(32, 32),
            {
              offset: new window.kakao.maps.Point(16, 16)
            }
          );
          
          markerOptions.image = placeIcon;
        }
        
        const marker = new window.kakao.maps.Marker(markerOptions);

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
      
      // 🎯 모든 마커가 화면에 보이도록 맵 영역 자동 조정
      if (markers.length > 0 && !disableAutoCenter) {
        const bounds = new window.kakao.maps.LatLngBounds();
        
        markers.forEach(markerInfo => {
          if (markerInfo.isVisible) {
            bounds.extend(new window.kakao.maps.LatLng(markerInfo.position.lat, markerInfo.position.lng));
          }
        });
        
        // 경계에 여백 추가
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        
        const latDiff = ne.getLat() - sw.getLat();
        const lngDiff = ne.getLng() - sw.getLng();
        
        // 여백 계산 (최소 0.01, 최대 0.05)
        const latPadding = Math.max(0.01, Math.min(0.05, latDiff * 0.2));
        const lngPadding = Math.max(0.01, Math.min(0.05, lngDiff * 0.2));
        
        const paddedBounds = new window.kakao.maps.LatLngBounds(
          new window.kakao.maps.LatLng(sw.getLat() - latPadding, sw.getLng() - lngPadding),
          new window.kakao.maps.LatLng(ne.getLat() + latPadding, ne.getLng() + lngPadding)
        );
        
        console.log('🎯 마커 자동 영역 조정:', {
          마커수: markers.length,
          남서쪽: { lat: sw.getLat(), lng: sw.getLng() },
          북동쪽: { lat: ne.getLat(), lng: ne.getLng() },
          여백: { lat: latPadding, lng: lngPadding }
        });
        
        mapRef.current.setBounds(paddedBounds);
      }
      
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
  }, [markers, onMarkerClick, disableAutoCenter]);

  // 경로 관리 useEffect (깔끔한 전환)
  useEffect(() => {
    if (!mapRef.current) return;

    // 기존 경로들을 먼저 완전히 제거
    routesRef.current.forEach(route => {
      if (route) {
        try {
          route.setMap(null);
        } catch (error) {
          console.warn('경로 제거 실패:', error);
        }
      }
    });
    routesRef.current = [];

    if (!routes || routes.length === 0) {
      return;
    }

    // 개선된 경로 생성 함수
    const createImprovedRoute = (routeInfo: any) => {
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
        strokeWeight: 8,
        strokeColor: routeInfo.color || '#FF6B6B',
        strokeOpacity: 1.0,
        strokeStyle: 'solid'
      });

      polyline.setMap(mapRef.current);
      return polyline;
    };

    // 새로운 경로들 생성
    routes.forEach((routeInfo, index) => {
      const fromId = routeInfo.from.id || `friend-${index + 1}`;
      const friendNumber = fromId.replace('friend-', '');
      const friendIndex = parseInt(friendNumber) - 1;
      const colorIndex = friendIndex % friendColors.length;
      const routeColor = friendColors[colorIndex];
      
      routeInfo.color = routeColor;
      
      const polyline = createImprovedRoute(routeInfo);
      routesRef.current.push(polyline);
    });

    // 경로가 생성된 후 지도의 시점을 자동으로 조정
    if (routes.length > 0 && !disableAutoCenter) {
      const bounds = new window.kakao.maps.LatLngBounds();
      
      routes.forEach(route => {
        bounds.extend(new window.kakao.maps.LatLng(route.from.lat, route.from.lng));
        bounds.extend(new window.kakao.maps.LatLng(route.to.lat, route.to.lng));
      });
      
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      
      const latDiff = ne.getLat() - sw.getLat();
      const lngDiff = ne.getLng() - sw.getLng();
      
      const latPadding = Math.max(0.005, Math.min(0.02, latDiff * 0.2));
      const lngPadding = Math.max(0.005, Math.min(0.02, lngDiff * 0.2));
      
      const paddedBounds = new window.kakao.maps.LatLngBounds(
        new window.kakao.maps.LatLng(sw.getLat() - latPadding, sw.getLng() - lngPadding),
        new window.kakao.maps.LatLng(ne.getLat() + latPadding, ne.getLng() + lngPadding)
      );
      
      mapRef.current.setBounds(paddedBounds);
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
        scrollwheel: true, // scrollwheel은 초기화 시에만 설정 가능
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
