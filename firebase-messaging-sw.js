importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBpcfRgaensCCNcQJcjc30S3Amsa8koArI",
  authDomain: "hp-contabilidade.firebaseapp.com",
  projectId: "hp-contabilidade",
  storageBucket: "hp-contabilidade.firebasestorage.app",
  messagingSenderId: "928003631327",
  appId: "1:928003631327:web:3eb9bf210d9cd69cc3a16a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.tag || 'hp-notif',
    requireInteraction: payload.data?.urgente === 'true'
  });
});
