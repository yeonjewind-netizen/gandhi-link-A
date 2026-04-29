import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Firestore DB 추가
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC5B2uZ2PEzjfcavdisFbNr8qKGhKMlTag",
  authDomain: "gandhi-planner.firebaseapp.com",
  projectId: "gandhi-planner",
  storageBucket: "gandhi-planner.firebasestorage.app",
  messagingSenderId: "232249680614",
  appId: "1:232249680614:web:6fbe017dce7fb56f9f5127",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // 앱 전체에서 쓸 수 있게 db 내보내기
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const messaging = getMessaging(app);
