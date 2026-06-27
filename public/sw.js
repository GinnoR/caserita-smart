self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Básico: dejar pasar las peticiones de red normales
  // Si quisiéramos modo offline complejo, podríamos interceptar aquí
});
