// Minimal service worker: enables "install to home screen". It does not cache anything,
// so members always see fresh data and never a stale page.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
