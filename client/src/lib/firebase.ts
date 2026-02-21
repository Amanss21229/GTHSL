import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// These would normally be populated with real keys from the integration
// For this generated code to work immediately without crashing, we'll use a mock if keys are missing
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock.appspot.com",
  messagingSenderId: "00000000000",
  appId: "1:00000000000:web:00000000000000",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
