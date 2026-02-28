import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore, initializeFirestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAM7dLnh_QeAgZ2osZNR7-tKiImPy4Tmnw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "yetiai-756a1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "yetiai-756a1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "yetiai-756a1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "473585466588",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:473585466588:web:170ebb43a3295ddc86c819",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
const googleProvider = new GoogleAuthProvider();

// Lazy initialization to avoid build-time errors when env vars might be missing
const getFirebaseApp = () => {
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      if (!firebaseConfig.apiKey) {
        console.warn("Firebase API Key is missing. Firebase features will not work.");
      }
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
};

export const getFirebaseDb = () => {
  if (!db) {
    // Enable ignoreUndefinedProperties to prevent "invalid nested entity" errors
    db = initializeFirestore(getFirebaseApp(), {
      ignoreUndefinedProperties: true,
    });
  }
  return db;
};

export const getFirebaseStorage = () => {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
};

export { googleProvider };
