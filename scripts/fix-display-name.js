// Script pour corriger le displayName dans Firebase Auth
// Pour exécuter : node scripts/fix-display-name.js

const { initializeApp } = require('firebase/app');
const { getAuth, updateProfile, signInWithEmailAndPassword } = require('firebase/auth');

// Configuration Firebase
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

// Fonction pour corriger le displayName
async function fixDisplayName() {
  try {
    // Connectez-vous à votre compte (remplacez par vos identifiants)
    const email = 'romain@guyonconsulting.com';
    const password = prompt('Entrez votre mot de passe: ');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Utilisateur connecté:', user.email);
    console.log('DisplayName actuel:', user.displayName);
    
    // Mettre à jour le displayName pour "Romain"
    await updateProfile(user, {
      displayName: "Romain"
    });
    
    console.log('DisplayName mis à jour avec succès !');
    console.log('Nouveau displayName:', auth.currentUser.displayName);
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Fonction pour demander le mot de passe
function prompt(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Exécuter la fonction
fixDisplayName();
