import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`, // Fixed storage bucket
  messagingSenderId: "00000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate config presence
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.appId
);

console.log("Firebase Configuration Check:", {
  apiKey: !!firebaseConfig.apiKey,
  projectId: !!firebaseConfig.projectId,
  appId: !!firebaseConfig.appId,
  storageBucket: firebaseConfig.storageBucket
});

if (!isFirebaseConfigured) {
  console.warn("Firebase is not fully configured. Please add VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID to environment variables.");
}

let app: ReturnType<typeof initializeApp>;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;
let storage: ReturnType<typeof getStorage>;

if (isFirebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  app = !getApps().length ? initializeApp({ ...firebaseConfig, apiKey: "placeholder", appId: "placeholder", projectId: "placeholder" }) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { auth, db, storage, isFirebaseConfigured };
