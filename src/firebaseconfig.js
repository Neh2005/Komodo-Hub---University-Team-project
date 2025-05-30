// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, getDoc, updateDoc, arrayUnion} from "firebase/firestore"; // Firestore for database
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
export { collection, addDoc, getDocs, ref, uploadBytes, getDownloadURL, deleteDoc, doc, getDoc, updateDoc, arrayUnion };
export default app;