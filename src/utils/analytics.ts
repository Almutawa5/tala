import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SessionData {
    ip: string;
    userAgent: string;
    language: string;
    screenResolution: string;
    referrer: string;
    timestamp: any;
    path: string;
}

export const recordVisitor = async () => {
    try {
        // Fetch IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const ip = ipData.ip;

        const sessionData: SessionData = {
            ip,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            referrer: document.referrer || 'direct',
            timestamp: serverTimestamp(),
            path: window.location.pathname,
        };

        // Add session data to Firestore
        const docRef = await addDoc(collection(db, 'visitors'), sessionData);
        console.log('Visitor recorded with ID: ', docRef.id);
    } catch (error) {
        console.error('Error recording visitor: ', error);
    }
};

export const trackEvent = async (eventName: string, eventData: any = {}) => {
    try {
        await addDoc(collection(db, 'events'), {
            eventName,
            ...eventData,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error tracking event: ', error);
    }
};
