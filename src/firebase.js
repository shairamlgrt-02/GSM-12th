import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDncAOLd7pmFLvVNk54xMqIARl6r-K89Do',
  authDomain: 'gsm-12th-anniversary.firebaseapp.com',
  projectId: 'gsm-12th-anniversary',
  storageBucket: 'gsm-12th-anniversary.firebasestorage.app',
  messagingSenderId: '766168356812',
  appId: '1:766168356812:web:24a725e848b9f8cc6daf69',
  measurementId: 'G-DCJ17Z0612',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
