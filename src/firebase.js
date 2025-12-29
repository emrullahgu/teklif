import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyD5m5XaxPAi1xEyWztt9OE9iaEi3Nikx-s",
  authDomain: "teklifservisi.firebaseapp.com",
  projectId: "teklifservisi",
  storageBucket: "teklifservisi.firebasestorage.app",
  messagingSenderId: "343578662828",
  appId: "1:343578662828:web:e0d225891de97d3103cc09",
  measurementId: "G-X2S678KJ37"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Authentication ve Firestore servislerini al
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
