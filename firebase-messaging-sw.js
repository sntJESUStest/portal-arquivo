importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC5yOHBICKbEAuBkqkLNqxHbWjHnANs3aI",
  authDomain: "hp-contabilidade.firebaseapp.com",
  projectId: "hp-contabilidade",
  storageBucket: "hp-contabilidade.firebasestorage.app",
  messagingSenderId: "928003631327",
  appId: "1:928003631327:web:b68ac218ffca7f94cc81bd"
});

const messaging = firebase.messaging();

// Apenas notificações em background (app fechado/minimizado)
// Quando app está aberto, o handler do index.html cuida
messaging.onBackgroundMessage((payload) => {
  // Não mostrar notificação aqui — deixar o Firebase mostrar automaticamente
  // via notification payload. Só processar data messages se necessário.
  console.log('[SW] Background message recebido');
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
