// Build version for debugging deployment issues
export const BUILD_HASH = import.meta.env.VITE_BUILD_HASH || `local-${Date.now()}`;
export const BUILD_TIMESTAMP = new Date().toISOString();

// Log build info on startup  
console.info('[FE] build=', BUILD_HASH);
console.info('[FE] timestamp=', BUILD_TIMESTAMP);
console.info('[FE] mode=', import.meta.env.MODE);
console.info('[FE] api_base=', import.meta.env.VITE_API_BASE_URL || 'http://localhost:8084');

export function getBuildInfo() {
  return {
    build: BUILD_HASH,
    timestamp: BUILD_TIMESTAMP,
    mode: import.meta.env.MODE,
    apiBase: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8084'
  };
}