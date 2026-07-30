import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase Web config — these values are public identifiers, not secrets.
// Security is enforced by Firestore/Storage rules, not by hiding this object.
const firebaseConfig = {
  apiKey: 'AIzaSyC9xARMJr9iHwfc1Ay8jQ8zymh1MYuy_mA',
  authDomain: 'insoamil-web.firebaseapp.com',
  projectId: 'insoamil-web',
  storageBucket: 'insoamil-web.firebasestorage.app',
  messagingSenderId: '267390780201',
  appId: '1:267390780201:web:d96af67cef36c0c835ed38',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
