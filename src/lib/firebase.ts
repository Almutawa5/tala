import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDH8eSJLXTNuXDJ-jQuYATNYKBGcdgdc7A",
    authDomain: "tala-gold-calc-8291.firebaseapp.com",
    projectId: "tala-gold-calc-8291",
    storageBucket: "tala-gold-calc-8291.firebasestorage.app",
    messagingSenderId: "449112852424",
    appId: "1:449112852424:web:d0fe23b52f7312ae1062fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
