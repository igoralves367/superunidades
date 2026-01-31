
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBNCcQiP69snZbIoYLTN71M55ljC_Q6yq4",
  authDomain: "desbravahub-35316.firebaseapp.com",
  projectId: "desbravahub-35316",
  storageBucket: "desbravahub-35316.firebasestorage.app",
  messagingSenderId: "908455363227",
  appId: "1:908455363227:web:fde86381c039c9c096fc3e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
