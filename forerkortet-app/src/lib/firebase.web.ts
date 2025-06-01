import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVUB3FuzZM-auzDQNy5UHGu-2vL5Eolvg",
  authDomain: "lappen-461117.firebaseapp.com",
  projectId: "lappen-461117",
  storageBucket: "lappen-461117.firebasestorage.app",
  messagingSenderId: "792835849296",
  appId: "1:792835849296:web:0caee8dcc7adaea25c2555",
  measurementId: "G-4D16ENMGW5",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Crashlytics is not available on web, so we'll create a stub
const crashlytics = () => ({
  setCrashlyticsCollectionEnabled: () => {},
  log: () => {},
  recordError: () => {},
  setUserId: () => {},
  setAttribute: () => {},
  setAttributes: () => {},
});

export { auth, db, crashlytics };
