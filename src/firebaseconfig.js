// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, connectAuthEmulator } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc, arrayUnion, connectFirestoreEmulator} from "firebase/firestore"; // Firestore for database
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


// Your Firebase project configuration (Replace with your actual config from Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyB70kSJoqxGZ8dRA8lj1ZN6tD-lvp7A9sA",
    authDomain: "komodo-hub-4ce8c.firebaseapp.com",
    projectId: "komodo-hub-4ce8c",
    storageBucket: "komodo-hub-4ce8c.firebasestorage.app",
    messagingSenderId: "1051673089594",
    appId: "1:1051673089594:web:2dd15abcd33ea371f4c703",
    measurementId: "G-JDKG02Z66C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Google Sign-in function
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google Signup Error:", error);
    throw error;
  }
};

export { auth, signInWithGoogle };
export const db = getFirestore(app); // ✅ Initialize Firestore Database
export const storage = getStorage(app); // Optional for image uploads

// Opt-in local emulator connection for development only — never active in a production
// build (import.meta.env.DEV is always false once `vite build` runs) and requires an
// explicit VITE_USE_EMULATOR=true in a local, gitignored .env.local file, so a normal
// `npm run dev` still talks to the real project unless a developer deliberately opts in.
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  console.warn("🔧 Connected to local Firebase emulators (VITE_USE_EMULATOR=true)");
}
export { collection, addDoc, getDocs, ref, uploadBytes, getDownloadURL, deleteDoc, doc, getDoc, updateDoc, arrayUnion };
export default app;