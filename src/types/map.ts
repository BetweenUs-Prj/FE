// 맵 관련 타입 정의

export interface MapMarker {
  id: string;
  position: { lat: number; lng: number };
  title?: string;
  type: 'friend' | 'station' | 'place' | 'middle';
  isVisible: boolean;
  isHighlighted?: boolean;
}

export interface MapRoute {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  color?: string;
  coords?: { lat: number; lng: number }[];
}

export interface StationInfo {
  id: number;
  name: string;
  lat: number;
  lng: number;
  position?: { lat: number; lng: number };
  placePosition?: { lat: number; lng: number };
  placeInfo?: any;
}

export interface MiddlePlaceCard {
  id: number;
  title: string;
  duration: string;
  type: 'station' | 'place' | 'back';
}

export interface Friend {
  id: number;
  name: string;
  location: string;
  coordinates?: { lat: number; lng: number };
}

export interface MapState {
  center: { lat: number; lng: number };
  level: number;
  markers: MapMarker[];
  routes: MapRoute[];
  interaction: {
    zoomable: boolean;
    draggable: boolean;
  };
}

export interface UIState {
  showCardList: boolean;
  showHomeContent: boolean;
  currentView: 'stations' | 'places';
  selectedStationId: number | null;
}

export interface ModalState {
  showTransport: boolean;
  showScheduleConfirm: boolean;
  showFriends: boolean;
  showSchedule: boolean;
  showMeeting: boolean;
  selectedStationInfo: StationInfo | null;
  selectedMiddlePointData: any;
  scheduleData: any;
}

export interface ToastState {
  isVisible: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}
