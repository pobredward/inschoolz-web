import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABlOh9xUQXnAs2NMpkw76hiCvojtCDDBk",
  authDomain: "inschoolz.firebaseapp.com",
  projectId: "inschoolz",
  storageBucket: "inschoolz.appspot.com",
  messagingSenderId: "702584515843",
  appId: "1:702584515843:web:78a80e8f7fc13ebc714d36",
  measurementId: "G-3JG849FH6X",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app);

export { app, auth, database, db };
