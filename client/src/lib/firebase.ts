import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: "00000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate config presence
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.appId
);

if (!isFirebaseConfigured) {
  console.warn("Firebase is not fully configured. Please add VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID to environment variables.");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { isFirebaseConfigured };
