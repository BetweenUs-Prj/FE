import { useEffect, useRef } from 'react';

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
}

export const useKakaoMap = ({ containerId, options, appKey }: UseKakaoMapProps) => {
  const mapRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);

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
