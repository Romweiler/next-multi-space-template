import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Configuration avec valeurs en dur pour éviter les problèmes avec les variables d'environnement
const firebaseConfig = {
  apiKey: "AIzaSyCgDwELcgPrmBmI97tEP6irAz06Kipge8s",
  authDomain: "mktflow-5b229.firebaseapp.com",
  databaseURL: "https://mktflow-5b229-default-rtdb.firebaseio.com",
  projectId: "mktflow-5b229",
  storageBucket: "mktflow-5b229.firebasestorage.app",
  messagingSenderId: "672284031059",
  appId: "1:672284031059:web:d52af856ac8077a0fb6ea6",
  measurementId: "G-Y0QT096ZKZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, db, rtdb, analytics };
