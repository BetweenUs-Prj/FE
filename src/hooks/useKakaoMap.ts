import { useEffect, useRef } from 'react';
import { KAKAO_MOBILITY_API_KEY } from '../constants/config';

interface MarkerInfo {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  type?: 'station' | 'place' | 'friend';
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

interface RouteInfo {
  from: { lat: number; lng: number; id?: string };
  to: { lat: number; lng: number; id?: string };
  color?: string;
}

interface UseKakaoMapProps {
  containerId: string;
  options: KakaoMapOptions;
  appKey: string;
  markers?: MarkerInfo[];
  routes?: RouteInfo[]; // 경로 정보 추가
  onMarkerClick?: (markerId: string) => void;
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
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [containerId, options, appKey]);

  // options 변경 시 맵 업데이트 (중심점과 레벨 모두 업데이트)
  useEffect(() => {
    if (mapRef.current) {
      // 중심점은 항상 업데이트 (초기 설정값 유지)
      if (options.center) {
        mapRef.current.setCenter(new window.kakao.maps.LatLng(options.center.lat, options.center.lng));
        console.log(`맵 중심점을 ${options.center.lat}, ${options.center.lng}로 설정 (options 변경)`);
      }
      
      // 레벨도 항상 업데이트 (마커들이 적절히 보이도록)
      if (options.level) {
        mapRef.current.setLevel(options.level);
        console.log(`맵 레벨을 ${options.level}로 설정 (options 변경)`);
      }
    }
  }, [options.center, options.level]);

  // 마커 관리 useEffect
  useEffect(() => {
    console.log('useKakaoMap markers useEffect 호출됨:', markers);
    if (!mapRef.current || !window.kakao || !window.kakao.maps) {
      console.log('맵이 초기화되지 않았거나 카카오맵 SDK가 로드되지 않음');
      return;
    }

    // 기존 마커들 제거
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 마커가 비어있으면 더 이상 진행하지 않음 (모든 마커 제거됨)
    if (markers.length === 0) {
      return;
    }

    // 마커는 항상 생성하되, 자동 중심 조정과 확대/축소는 disableAutoCenter에 따라 제어
    console.log('disableAutoCenter 값:', disableAutoCenter);
    
    // 자동 중심 조정이 활성화되어 있을 때만 실행
    if (!disableAutoCenter) {
      console.log('자동 중심 조정 활성화 - 마커 생성 및 중심 조정 실행');
      // 마커 개수에 따라 동적으로 레벨 조정
      const stationMarkers = markers.filter(marker => marker.type === 'station');
      const placeMarkers = markers.filter(marker => marker.type === 'place');
      const friendMarkers = markers.filter(marker => marker.type === 'friend');
      const highlightedPlaceMarkers = placeMarkers.filter(marker => marker.isHighlighted);
      
      if (friendMarkers.length > 0) {
        // 친구 마커가 있을 때 - 모든 친구 마커가 보이도록 자동 조정
        if (friendMarkers.length >= 2) {
          const bounds = new window.kakao.maps.LatLngBounds();
          friendMarkers.forEach(marker => {
            bounds.extend(new window.kakao.maps.LatLng(marker.position.lat, marker.position.lng));
          });
          
          // 경계에 패딩 추가 (마커들이 화면 끝에 딱 맞지 않도록)
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          
          // 마커들 간의 거리에 따라 동적으로 패딩 계산
          const latDiff = ne.getLat() - sw.getLat();
          const lngDiff = ne.getLng() - sw.getLng();
          
          // 거리에 비례하여 패딩 설정 (최소 0.01, 최대 0.05)
          const latPadding = Math.max(0.01, Math.min(0.05, latDiff * 0.3));
          const lngPadding = Math.max(0.01, Math.min(0.05, lngDiff * 0.3));
          
          const paddedBounds = new window.kakao.maps.LatLngBounds(
            new window.kakao.maps.LatLng(sw.getLat() - latPadding, sw.getLng() - lngPadding),
            new window.kakao.maps.LatLng(ne.getLat() + latPadding, ne.getLng() + lngPadding)
          );
          
          // 패딩이 적용된 경계로 맵 영역 설정
          mapRef.current.setBounds(paddedBounds);
          console.log('친구 마커들에 맞춰 맵 영역 자동 조정 (패딩 포함)');
          
          // 맵 중심점을 오른쪽으로 이동 (setTimeout으로 인한 이동은 방지)
          // setTimeout(() => {
          //   const currentCenter = mapRef.current.getCenter();
          //   const offsetLng = -0.02; // 오른쪽으로 이동할 경도 오프셋 (조정 가능)
          //   
          //   const newCenter = new window.kakao.maps.LatLng(
          //     currentCenter.getLat(),
          //     currentCenter.getLng() + offsetLng
          //   );
          //   mapRef.current.setCenter(newCenter);
          //   console.log('맵 중심점을 오른쪽으로 이동:', offsetLng);
          // }, 100); // 약간의 지연을 두어 setBounds가 완료된 후 실행
        } else {
          // 친구 마커가 1개일 때는 해당 위치로 중심 이동
          const friendMarker = friendMarkers[0];
          mapRef.current.setCenter(new window.kakao.maps.LatLng(friendMarker.position.lat, friendMarker.position.lng));
          mapRef.current.setLevel(3);
          console.log('친구 마커 1개에 맞춰 맵 중심 이동 및 레벨 3 설정');
        }
      } else if (stationMarkers.length > 0 && placeMarkers.length === 0) {
        // 역 마커만 있을 때 (모든 역 표시) - 더 넓은 시야
        mapRef.current.setLevel(6);
        console.log('맵 레벨을 6으로 설정 (모든 역 표시)');
      } else if (highlightedPlaceMarkers.length > 0) {
        // 선택된 추천 장소가 있을 때 - 더 자세한 시야로 설정
        mapRef.current.setLevel(2);
        console.log('맵 레벨을 2로 설정 (선택된 추천 장소 표시)');
      } else if (placeMarkers.length > 0 && stationMarkers.length === 0) {
        // 추천 장소 마커만 있고 역 마커가 없을 때만 자동 레벨 조정
        mapRef.current.setLevel(3);
        console.log('맵 레벨을 3로 설정 (추천 장소 표시)');
      }
    } else {
      console.log('자동 중심 조정이 비활성화되어 있음 - 마커만 생성하고 중심/레벨 조정은 하지 않음');
    }

    // 새로운 마커들 생성 (disableAutoCenter와 관계없이 항상 실행)
    console.log('useKakaoMap에서 마커 생성 시작 (disableAutoCenter:', disableAutoCenter, '):', markers.length, '개');
    markers.forEach(markerInfo => {
      console.log('마커 정보:', markerInfo);
      // 기본값 설정
      const isVisible = markerInfo.isVisible ?? true; // undefined면 true로 설정
      
      // 가시성이 false인 마커는 생성하지 않음
      if (!isVisible) {
        console.log('마커가 보이지 않음, 건너뜀:', markerInfo.id);
        return;
      }
      
      let marker;
      
      // friend 타입 마커는 커스텀 마커 생성
      if (markerInfo.type === 'friend') {
        console.log('친구 마커 생성 시작:', markerInfo);
        // 친구 마커용 커스텀 이미지 생성
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // 친구 ID에서 번호 추출 (friend-1 -> 1)
          const friendNumber = markerInfo.id.replace('friend-', '');
          const friendIndex = parseInt(friendNumber) - 1; // 0부터 시작하는 인덱스
          const isMe = friendNumber === '1'; // 첫 번째 친구는 '나'
          
          // 고유 색상 적용 (색상 배열 범위 내에서)
          const colorIndex = friendIndex % friendColors.length;
          const markerColor = friendColors[colorIndex];
          
          // 배경색 설정 (고유 색상 사용)
          ctx.fillStyle = markerColor;
          ctx.beginPath();
          ctx.arc(20, 20, 18, 0, 2 * Math.PI);
          ctx.fill();
          
          // 강조 효과 (테두리 추가)
          if (markerInfo.isHighlighted) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // 추가 강조 효과 (외부 테두리)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(20, 20, 22, 0, 2 * Math.PI);
            ctx.stroke();
          }
          
          // 텍스트 설정
          ctx.fillStyle = 'white';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // 텍스트를 정확히 중앙에 위치시키기
          const text = isMe ? '나' : friendNumber;
          
          // 정확한 중앙 좌표 계산
          const textX = 20;
          const textY = 22; // 약간 아래로 조정 (한글 특성상)
          
          // 텍스트 그리기
          ctx.fillText(text, textX, textY);
        }
        
        // 커스텀 마커 생성
        marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(
            markerInfo.position.lat, 
            markerInfo.position.lng
          ),
          map: mapRef.current,
          image: new window.kakao.maps.MarkerImage(
            canvas.toDataURL(),
            new window.kakao.maps.Size(40, 40)
          )
        });
        
        // 친구 마커는 최상위 레이어
        marker.setZIndex(1500);
      } else {
        // 기본 마커 생성
        marker = new window.kakao.maps.Marker({
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
      }

      // 마커 클릭 이벤트 추가
      if (onMarkerClick) {
        window.kakao.maps.event.addListener(marker, 'click', () => {
          onMarkerClick(markerInfo.id);
        });
      }

      markersRef.current.push(marker);
      console.log('마커 생성 완료:', markerInfo.id, marker);
      console.log('마커 위치:', markerInfo.position);
    });
    console.log('모든 마커 생성 완료, 총 개수:', markersRef.current.length);
    
    // 맵 중심점과 레벨 확인
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const level = mapRef.current.getLevel();
      console.log('현재 맵 중심점:', { lat: center.getLat(), lng: center.getLng() });
      console.log('현재 맵 레벨:', level);
    }
  }, [markers, onMarkerClick]);

  // 경로 관리 useEffect
  useEffect(() => {
    console.log('useKakaoMap routes useEffect 호출됨:', routes);
    if (!mapRef.current || !window.kakao || !window.kakao.maps) {
      console.log('맵이 초기화되지 않았거나 카카오맵 SDK가 로드되지 않음');
      return;
    }

    // 경로가 비어있으면 기존 경로 제거하고 종료
    if (routes.length === 0) {
      routesRef.current.forEach(route => {
        route.setMap(null);
      });
      routesRef.current = [];
      return;
    }

    // 기존 경로 라인들 제거
    routesRef.current.forEach(route => {
      route.setMap(null);
    });
    routesRef.current = [];

    // services 라이브러리가 로드되었는지 확인하고 안전하게 처리
    console.log('카카오맵 services 확인:', {
      services: !!window.kakao.maps.services,
      Directions: !!(window.kakao.maps.services && window.kakao.maps.services.Directions)
    });
    
    // 카카오모빌리티 API를 직접 호출 (카카오맵 services와 무관하게)
    console.log('카카오모빌리티 API를 직접 호출합니다.');

        // 카카오모빌리티 길찾기 API 사용
    console.log('카카오모빌리티 길찾기 API를 사용하여 실제 도로 경로를 생성합니다.');
    console.log('API 키 확인:', KAKAO_MOBILITY_API_KEY);
    
    // 각 경로에 대해 카카오모빌리티 API 호출
    routes.forEach((routeInfo, index) => {
      // 친구 ID에서 색상 인덱스 추출 (friend-1 -> 0, friend-2 -> 1, ...)
      const fromId = routeInfo.from.id || `friend-${index + 1}`;
      const friendNumber = fromId.replace('friend-', '');
      const friendIndex = parseInt(friendNumber) - 1;
      const colorIndex = friendIndex % friendColors.length;
      const routeColor = friendColors[colorIndex];
      
      // routeInfo에 고유 색상 추가
      routeInfo.color = routeColor;
      // 카카오모빌리티 API 요청 데이터 준비
      const requestData = {
        origin: {
          x: routeInfo.from.lng.toString(), // 경도
          y: routeInfo.from.lat.toString(), // 위도
        },
        destination: {
          x: routeInfo.to.lng.toString(), // 경도
          y: routeInfo.to.lat.toString(), // 위도
        },
        priority: "TIME" // 최단 시간 우선
      };

      console.log(`API 요청 데이터: ${index + 1}번째 경로`, requestData);

      // 카카오모빌리티 대중교통 API 호출 (지하철 우선)
      const params = new URLSearchParams({
        origin: `${routeInfo.from.lng},${routeInfo.from.lat}`,
        destination: `${routeInfo.to.lng},${routeInfo.to.lat}`,
        priority: "TIME",
        avoid: "toll",  // 톨게이트 회피
        alternatives: "true"  // 대안 경로 포함
      });
      
      fetch(`https://apis-navi.kakaomobility.com/v1/directions?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `KakaoAK ${KAKAO_MOBILITY_API_KEY}`
        }
      })
      .then(response => {
        console.log(`API 응답 상태: ${index + 1}번째 경로`, response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
             .then(data => {
         console.log(`카카오모빌리티 대중교통 API 응답: ${index + 1}번째 경로`, data);
         
         if (data.routes && data.routes.length > 0) {
           // 대중교통 API에서는 routes 배열의 첫 번째 요소가 경로 정보
           const route = data.routes[0];
           console.log(`대중교통 경로 데이터: ${index + 1}번째 경로`, route);
           
           if (route && route.result_code === 0) {
             // 실제 대중교통 경로 데이터가 있으면 사용
             console.log(`대중교통 경로 생성: ${index + 1}번째 경로`, route.summary);
             
             // 대중교통 경로 좌표가 있으면 사용, 없으면 개선된 경로로 표시
             if (route.sections && route.sections.length > 0) {
               createTransitRoute(routeInfo, index, route);
             } else {
               createImprovedRoute(routeInfo, index);
             }
           } else {
             console.warn(`대중교통 길찾기 실패: ${index + 1}번째 경로`, route?.result_msg);
             createImprovedRoute(routeInfo, index);
           }
         } else {
           console.warn(`대중교통 경로 데이터 없음: ${index + 1}번째 경로`);
           createImprovedRoute(routeInfo, index);
         }
       })
      .catch(error => {
        console.error(`카카오모빌리티 API 오류: ${index + 1}번째 경로`, error);
        // API 오류 시 개선된 경로로 대체
        createImprovedRoute(routeInfo, index);
      });
    });
    
        // 대중교통 경로 생성 함수 (지하철 경로 시뮬레이션)
    const createTransitRoute = (routeInfo: any, index: number, routeData: any) => {
      console.log(`대중교통 경로 생성: ${index + 1}번째 경로`, routeData);
      
      const path: any[] = [];
      
      // sections에서 대중교통 경로 좌표 추출
      routeData.sections.forEach((section: any) => {
        if (section.roads) {
          section.roads.forEach((road: any) => {
            if (road.vertexes) {
              // vertexes는 [lng1, lat1, lng2, lat2, ...] 형태
              for (let i = 0; i < road.vertexes.length; i += 2) {
                const lng = road.vertexes[i];
                const lat = road.vertexes[i + 1];
                path.push(new window.kakao.maps.LatLng(lat, lng));
              }
            }
          });
        }
      });
      
      if (path.length > 0) {
        const polyline = new window.kakao.maps.Polyline({
          path: path,
          strokeWeight: 4,
          strokeColor: routeInfo.color || '#4A90E2', // 대중교통용 파란색
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        });
        
        polyline.setMap(mapRef.current);
        
        console.log(`대중교통 경로 생성 완료: ${index + 1}번째 경로 (좌표 ${path.length}개)`);
      } else {
        console.warn(`대중교통 경로 좌표 없음, 개선된 경로로 대체: ${index + 1}번째 경로`);
        createImprovedRoute(routeInfo, index);
      }
    };







    // 개선된 경로 생성 함수
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
    
    console.log('길찾기 요청 완료, 총 개수:', routes.length);
  }, [routes]);

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
