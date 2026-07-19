// Typed entry point for the events.monitorture.com client. The stub in
// index.html makes window.analytics.track callable synchronously (queuing until
// api.js loads); the server's ALLOWED_HOSTS decides what's actually recorded.
declare global {
  interface Window {
    analytics?: { track: (event: string, payload?: Record<string, unknown>) => void }
  }
}

export const track = (event: string, payload?: Record<string, unknown>) =>
  window.analytics?.track(event, payload)
