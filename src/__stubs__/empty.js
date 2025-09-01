/**
 * Empty stub for WebSocket modules
 * Prevents "SockJS is not defined" errors
 */

export default {};

// Common WebSocket exports that components might expect
export const Client = function() { 
  return {
    activate: () => {},
    deactivate: () => {},
    subscribe: () => ({ unsubscribe: () => {} }),
    publish: () => {},
    connected: false,
    onConnect: null,
    onDisconnect: null,
    onStompError: null,
    onWebSocketError: null
  }; 
};

export const Stomp = {
  over: () => ({
    connect: () => {},
    disconnect: () => {},
    subscribe: () => ({ unsubscribe: () => {} }),
    send: () => {}
  })
};

// For any other imports
export const SockJS = function() {
  return {
    readyState: 3, // CLOSED
    close: () => {}
  };
};