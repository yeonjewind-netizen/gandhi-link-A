/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyC5B2uZ2PEzjfcavdisFbNr8qKGhKMlTag",
  authDomain: "gandhi-planner.firebaseapp.com",
  projectId: "gandhi-planner",
  storageBucket: "gandhi-planner.firebasestorage.app",
  messagingSenderId: "232249680614",
  appId: "1:232249680614:web:6fbe017dce7fb56f9f5127",
};

firebase.initializeApp(firebaseConfig);

// 백그라운드에서 푸시를 받을 준비
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] Received background message", payload);

  const notification = payload && payload.notification ? payload.notification : {};
  const title = notification.title || "알림";
  const body = notification.body || "";

  const options = {
    body,
    icon: "/pwa-icon.svg",
  };

  self.registration.showNotification(title, options);
});

