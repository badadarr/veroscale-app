import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  off,
  query,
  orderByChild,
  orderByKey,
  limitToLast,
  set,
  update,
} from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Auto sign-in anonymously for IoT access
let authPromise: Promise<void> | null = null;

const ensureAuth = () => {
  if (!authPromise) {
    authPromise = new Promise((resolve, reject) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("🔑 Firebase Auth: User signed in", user.uid);
          resolve();
        } else {
          console.log("🔑 Firebase Auth: Signing in anonymously...");
          signInAnonymously(auth)
            .then(() => {
              console.log("✅ Firebase Auth: Anonymous sign-in successful");
              resolve();
            })
            .catch((error) => {
              console.error("❌ Firebase Auth error:", error);
              reject(error);
            });
        }
      });
    });
  }
  return authPromise;
};

// Ensure auth when module loads
ensureAuth();

export { database, ref, onValue, off, auth, ensureAuth };
export { query, orderByChild, orderByKey, limitToLast };
export { set, update };
