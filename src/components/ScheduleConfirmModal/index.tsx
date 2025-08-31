import React from 'react';
import styles from './ScheduleConfirmModal.module.css';

interface Friend {
  id: number;
  name: string;
  location: string;
  position: { lat: number; lng: number };
}

interface TransportRoute {
  friendId: number;
  friendName: string;
  transportMode: string;
  duration: number;
  distance: number;
  details: string[];
}

interface ScheduleConfirmModalProps {
  isVisible: boolean;
  onClose: () => void;
  scheduleData: {
    placeInfo: {
      title: string;
      category: string;
      description?: string;
      duration: string;
    };
    stationName: string;
    friends: Friend[];
    routes: TransportRoute[];
    meetingTime: string;
    selectedTransportMode: string;
  };
  onSendInvitation: () => void;
  onGoToSchedule: () => void;
}

const ScheduleConfirmModal: React.FC<ScheduleConfirmModalProps> = ({
  isVisible,
  onClose,
  scheduleData,
  onSendInvitation,
  onGoToSchedule
}) => {
  if (!isVisible) return null;

  const { placeInfo, stationName, friends, routes, meetingTime, selectedTransportMode } = scheduleData;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>📅 약속 추가 확인</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* 🎯 선택한 장소 정보 */}
          <div className={styles.section}>
            <h4>📍 선택한 장소</h4>
            <div className={styles.placeInfo}>
              <h5>{placeInfo.title}</h5>
                              <p className={styles.category}>{placeInfo.category}</p>
                {placeInfo.description && (
                  <p className={styles.description}>{placeInfo.description}</p>
                )}
              <span className={styles.duration}>🚶‍♂️ 역에서 도보 {placeInfo.duration}</span>
            </div>
          </div>

          {/* 🎯 만남 정보 */}
          <div className={styles.section}>
            <h4>⏰ 만남 정보</h4>
            <div className={styles.meetingInfo}>
              <p><strong>만남 시간:</strong> {meetingTime}</p>
              <p><strong>만남 장소:</strong> {stationName}역</p>
              <p><strong>최종 목적지:</strong> {placeInfo.title}</p>
            </div>
          </div>

          {/* 🎯 참여자 정보 */}
          <div className={styles.section}>
            <h4>👥 참여자 ({friends.length}명)</h4>
            <div className={styles.participants}>
              {friends.map((friend) => (
                <div key={friend.id} className={styles.participant}>
                  <span className={styles.participantName}>{friend.name}</span>
                  <span className={styles.participantLocation}>{friend.location}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 🎯 교통 정보 */}
          {routes.length > 0 && (
            <div className={styles.section}>
              <h4>🚇 교통 정보</h4>
              <div className={styles.transportInfo}>
                <p><strong>교통수단:</strong> {selectedTransportMode === 'transit' ? '대중교통' : '자동차'}</p>
                {routes.map((route) => (
                  <div key={route.friendId} className={styles.routeInfo}>
                    <span>{route.friendName}: {route.duration}분 ({route.distance}km)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🎯 예상 소요시간 */}
          <div className={styles.section}>
            <h4>⏱️ 예상 소요시간</h4>
            <div className={styles.timeInfo}>
              <p>역에서 장소까지: {placeInfo.duration}</p>
              {routes.length > 0 && (
                <p>가장 오래 걸리는 참여자: {Math.max(...routes.map(r => r.duration))}분</p>
              )}
            </div>
          </div>
        </div>

        {/* 🎯 액션 버튼들 */}
        <div className={styles.actions}>
          <button 
            className={styles.invitationButton}
            onClick={onSendInvitation}
          >
            📧 친구에게 초대장 보내기
          </button>
          <button 
            className={styles.scheduleButton}
            onClick={onGoToSchedule}
          >
            📅 일정으로 이동하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleConfirmModal;
