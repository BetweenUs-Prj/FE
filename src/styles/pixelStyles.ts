// 공통 픽셀 아트 스타일 정의
export const PIXEL_COLORS = {
  // 기본 색상
  background: '#2c2d3c',
  text: '#f2e9e4',
  textSecondary: '#c9c9c9',
  textMuted: '#6e6f7a',
  
  // 강조 색상
  primary: '#ffd6a5',
  accent: '#fdffb6',
  success: '#a7c957',
  danger: '#e76f51',
  warning: '#c19454',
  
  // UI 색상
  boxBg: '#4a4e69',
  cardBg: '#9a8c98',
  border: '#0d0d0d',
  infoBg: '#22223b',
  
  // 게임 색상
  gameBg: '#6a856f',
  joinBg: '#c19454',
  redSignal: '#dc2626',
  preparing: '#1a1a2e'
} as const;

export const PIXEL_FONTS = {
  main: "'Press Start 2P', cursive",
} as const;

export const PIXEL_SHADOWS = {
  text: {
    small: '1px 1px 0px #0d0d0d',
    medium: '2px 2px 0px #0d0d0d',
    large: '3px 3px 0px #0d0d0d',
    xlarge: '4px 4px 0px #0d0d0d'
  },
  box: {
    small: '2px 2px 0px #0d0d0d',
    medium: '4px 4px 0px #0d0d0d',
    large: '8px 8px 0px #0d0d0d',
    xlarge: '12px 12px 0px #0d0d0d'
  }
} as const;

export const PIXEL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  
  .pixel-game-body { 
    font-family: ${PIXEL_FONTS.main}; 
    background-color: ${PIXEL_COLORS.background}; 
    color: ${PIXEL_COLORS.text}; 
    background-image: 
      linear-gradient(rgba(242, 233, 228, 0.05) 1px, transparent 1px), 
      linear-gradient(90deg, rgba(242, 233, 228, 0.05) 1px, transparent 1px); 
    background-size: 4px 4px; 
    image-rendering: pixelated; 
    min-height: 100vh; 
  }
  
  .pixel-container { 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center; 
    min-height: 100vh; 
    padding: 2rem; 
    text-align: center; 
  }
  
  .pixel-box { 
    background-color: ${PIXEL_COLORS.boxBg}; 
    padding: 2rem; 
    border: 4px solid ${PIXEL_COLORS.border}; 
    box-shadow: ${PIXEL_SHADOWS.box.large}; 
    width: 100%; 
    max-width: 600px; 
    margin-bottom: 2rem; 
    box-sizing: border-box;
  }
  
  .pixel-title { 
    font-size: 2.5rem; 
    color: ${PIXEL_COLORS.primary}; 
    text-shadow: ${PIXEL_SHADOWS.text.xlarge}; 
    margin: 0 0 1rem 0; 
  }
  
  .pixel-subtitle { 
    font-size: 1rem; 
    color: ${PIXEL_COLORS.textSecondary}; 
    text-shadow: ${PIXEL_SHADOWS.text.medium}; 
    margin: 0; 
  }
  
  .pixel-button { 
    font-family: ${PIXEL_FONTS.main}; 
    color: ${PIXEL_COLORS.text}; 
    border: 4px solid ${PIXEL_COLORS.border}; 
    box-shadow: ${PIXEL_SHADOWS.box.medium}; 
    padding: 1rem 2rem; 
    cursor: pointer; 
    transition: transform 0.1s linear, box-shadow 0.1s linear; 
    text-align: center; 
    background-color: ${PIXEL_COLORS.cardBg}; 
    font-size: 1rem; 
    margin: 0.5rem;
    text-decoration: none;
    display: inline-block;
  }
  
  .pixel-button:hover { 
    transform: translateY(-4px); 
    box-shadow: 6px 6px 0px ${PIXEL_COLORS.border}; 
  }
  
  .pixel-button:active { 
    transform: translateY(2px); 
    box-shadow: ${PIXEL_SHADOWS.box.small}; 
  }
  
  .pixel-button:disabled { 
    background-color: #3b3d51; 
    color: ${PIXEL_COLORS.textMuted}; 
    cursor: not-allowed; 
    transform: translateY(0); 
  }
  
  .pixel-button.primary { background-color: ${PIXEL_COLORS.primary}; color: ${PIXEL_COLORS.border}; }
  .pixel-button.success { background-color: ${PIXEL_COLORS.success}; }
  .pixel-button.danger { background-color: ${PIXEL_COLORS.danger}; }
  .pixel-button.warning { background-color: ${PIXEL_COLORS.warning}; }
  .pixel-button.game { background-color: ${PIXEL_COLORS.gameBg}; }
  .pixel-button.join { background-color: ${PIXEL_COLORS.joinBg}; }
  
  .menu-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
    gap: 2rem; 
    width: 100%; 
    max-width: 800px; 
    margin: 2rem 0; 
  }
  
  .menu-card { 
    background-color: ${PIXEL_COLORS.cardBg}; 
    border: 4px solid ${PIXEL_COLORS.border}; 
    box-shadow: ${PIXEL_SHADOWS.box.large}; 
    padding: 2rem; 
    cursor: pointer; 
    transition: transform 0.1s linear, box-shadow 0.1s linear; 
    text-align: center; 
    position: relative; 
    overflow: hidden; 
  }
  
  .menu-card:hover { 
    transform: translateY(-8px); 
    box-shadow: ${PIXEL_SHADOWS.box.xlarge}; 
  }
  
  .menu-card:active { 
    transform: translateY(4px); 
    box-shadow: ${PIXEL_SHADOWS.box.medium}; 
  }
  
  .menu-icon { 
    font-size: 3rem; 
    margin-bottom: 1.5rem; 
    filter: drop-shadow(${PIXEL_SHADOWS.text.medium}); 
  }
  
  .menu-title { 
    font-size: 1.2rem; 
    color: ${PIXEL_COLORS.text}; 
    text-shadow: ${PIXEL_SHADOWS.text.medium}; 
    margin-bottom: 1rem; 
  }
  
  .menu-description { 
    font-size: 0.8rem; 
    color: ${PIXEL_COLORS.textSecondary}; 
    line-height: 1.4; 
    text-shadow: ${PIXEL_SHADOWS.text.small}; 
  }
  
  .info-box { 
    background-color: ${PIXEL_COLORS.infoBg}; 
    border: 4px solid ${PIXEL_COLORS.border}; 
    padding: 1rem; 
    margin-top: 2rem; 
  }
  
  .info-text { 
    color: #a1a1a1; 
    font-size: 0.7rem; 
    line-height: 1.4; 
    text-shadow: ${PIXEL_SHADOWS.text.small}; 
  }
  
  .loading-spinner {
    width: 60px;
    height: 60px;
    background: ${PIXEL_COLORS.primary};
    border: 4px solid ${PIXEL_COLORS.border};
    animation: pixel-spin 1s linear infinite;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
    text-align: left;
  }
  
  .form-label {
    display: block;
    font-size: 0.9rem;
    color: ${PIXEL_COLORS.primary};
    text-shadow: ${PIXEL_SHADOWS.text.medium};
    margin-bottom: 0.5rem;
  }
  
  .form-input {
    width: 100%;
    padding: 1rem;
    font-family: ${PIXEL_FONTS.main};
    font-size: 0.8rem;
    background-color: ${PIXEL_COLORS.infoBg};
    color: ${PIXEL_COLORS.text};
    border: 4px solid ${PIXEL_COLORS.border};
    box-shadow: inset 2px 2px 0px rgba(0,0,0,0.3);
    box-sizing: border-box;
  }
  
  .form-input:focus {
    outline: none;
    box-shadow: inset 2px 2px 0px rgba(0,0,0,0.3), 0 0 0 2px ${PIXEL_COLORS.primary};
  }
  
  .alert {
    padding: 1rem;
    margin: 1rem 0;
    border: 4px solid ${PIXEL_COLORS.border};
    font-size: 0.8rem;
    text-shadow: ${PIXEL_SHADOWS.text.small};
  }
  
  .alert.success {
    background-color: ${PIXEL_COLORS.success};
    color: ${PIXEL_COLORS.border};
  }
  
  .alert.danger {
    background-color: ${PIXEL_COLORS.danger};
    color: ${PIXEL_COLORS.text};
  }
  
  .alert.warning {
    background-color: ${PIXEL_COLORS.warning};
    color: ${PIXEL_COLORS.border};
  }
  
  .alert.info {
    background-color: ${PIXEL_COLORS.infoBg};
    color: ${PIXEL_COLORS.textSecondary};
  }
  
  /* 애니메이션 */
  @keyframes blink { 
    50% { opacity: 0; } 
  }
  
  .blinking-cursor { 
    animation: blink 1s step-end infinite; 
  }
  
  @keyframes float { 
    0%, 100% { transform: translateY(0px); } 
    50% { transform: translateY(-10px); } 
  }
  
  .floating-pixel { 
    position: absolute; 
    width: 8px; 
    height: 8px; 
    background-color: ${PIXEL_COLORS.primary}; 
    animation: float 3s ease-in-out infinite; 
  }
  
  @keyframes pixel-spin {
    0% { transform: rotate(0deg); }
    25% { transform: rotate(90deg); }
    50% { transform: rotate(180deg); }
    75% { transform: rotate(270deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes countdown-pulse {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes icon-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  
  .countdown-number {
    font-size: 8rem;
    color: ${PIXEL_COLORS.primary};
    text-shadow: 6px 6px 0px ${PIXEL_COLORS.border};
    animation: countdown-pulse 1s ease-in-out;
  }
  
  /* 반응형 */
  @media (max-width: 768px) {
    .pixel-container {
      padding: 1rem;
    }
    
    .pixel-title {
      font-size: 2rem;
    }
    
    .menu-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .pixel-box {
      padding: 1.5rem;
    }
  }
`;