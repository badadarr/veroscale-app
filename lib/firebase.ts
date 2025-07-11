import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDwdYrP2FEYV2hAS1QrYEcjXDJqcvUI4WQ",
  authDomain: "timbangan-online-3cd46.firebaseapp.com",
  databaseURL:
    "https://timbangan-online-3cd46-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "timbangan-online-3cd46",
  storageBucket: "timbangan-online-3cd46.firebasestorage.app",
  messagingSenderId: "200904460259",
  appId: "1:200904460259:web:4cebd33928a3190ac382d6",
  measurementId: "G-1N8YW11PM8",
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
