import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwAXWFSkaFGWG3qGAMB9GjrJGEzQeMDd4",
  authDomain: "workout-tracker-9586ec.firebaseapp.com",
  projectId: "workout-tracker-9586ec",
  storageBucket: "workout-tracker-9586ec.firebasestorage.app",
  messagingSenderId: "677836236330",
  appId: "1:677836236330:web:514d794d3d7ed22db4c553"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use modern persistent local cache for offline capabilities
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const googleProvider = new GoogleAuthProvider();
