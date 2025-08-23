// Polyfills for Node globals in a browser environment.
// Some dependencies such as sockjs-client expect `global` or `process` to exist.
declare global {
  interface Window {
    global?: any;
    process?: any;
  }
}
if (typeof window !== 'undefined') {
  if (!window.global) {
    window.global = window;
  }
  if (!window.process) {
    window.process = { env: {} };
  }
}
export {};