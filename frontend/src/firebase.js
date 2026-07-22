import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATVpLT447uAeWi6SccgTGWbxUyibTCHFo",
  authDomain: "movie-pro-ea4cd.firebaseapp.com",
  projectId: "movie-pro-ea4cd",
  storageBucket: "movie-pro-ea4cd.firebasestorage.app",
  messagingSenderId: "214591015907",
  appId: "1:214591015907:web:05e1368d22cc14543eaed6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();