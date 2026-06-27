import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyA1g7eO9dC7yn-gb1NzSeP9eS2c5SiLoAc',
  authDomain: 'wewooo.firebaseapp.com',
  databaseURL: 'https://wewooo-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'wewooo',
  storageBucket: 'wewooo.firebasestorage.app',
  messagingSenderId: '585420940759',
  appId: '1:585420940759:web:6ad2a6d602fc33bc621792',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
