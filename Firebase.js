// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGgUiuw1dlbGPvHYYS6gL7vyDnumXbSRU",
  authDomain: "myproject-974b4.firebaseapp.com",
  projectId: "myproject-974b4",
  // NOTE: storage bucket IDs use appspot.com format
  storageBucket: "myproject-974b4.appspot.com",
  messagingSenderId: "912660732048",
  appId: "1:912660732048:web:1ace03ea23bddbf2846015",
  measurementId: "G-HY6XK5PLHR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
