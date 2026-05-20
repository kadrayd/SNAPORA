import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCNI8xyiL-ONxRh0dYQiB2LDIq3juD1xD8',
  authDomain: 'snapora-e2571.firebaseapp.com',
  projectId: 'snapora-e2571',
  storageBucket: 'snapora-e2571.firebasestorage.app',
  messagingSenderId: '294880190972',
  appId: '1:294880190972:web:96d5f2c0edfbc9b40dd279',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
