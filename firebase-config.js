// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBpu6CMVdJfrr4iJxLzEoRruQRdT_D4Ydw",
    authDomain: "e-commerce-app-af794.firebaseapp.com",
    projectId: "e-commerce-app-af794",
    storageBucket: "e-commerce-app-af794.appspot.com",
    messagingSenderId: "792762350753",
    appId: "1:792762350753:web:cbf3da8f12b62ee56484e0",
    measurementId: "G-D8BN81BPH8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export for use in other files
export { app, analytics, auth, db, storage, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, query, where, orderBy, limit, ref, uploadBytes, getDownloadURL, deleteObject };
