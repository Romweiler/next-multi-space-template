import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  console.log("API /api/spaces : Début de la requête POST");
  
  try {
    // Vérifier l'authentification
    const session = await getServerSession();
    console.log("Session utilisateur:", session);
    
    // Vérifier que l'utilisateur est connecté et a un email
    if (!session?.user?.email) {
      console.log("Erreur: utilisateur non authentifié ou email manquant");
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
    }
    
    // Utiliser l'email comme identifiant unique
    const userEmail = session.user.email;
    console.log("Email utilisateur:", userEmail);
    
    // Trouver l'ID utilisateur réel à partir de l'email
    let userId;
    
    // Chercher l'utilisateur par email
    const usersQuery = query(collection(db, 'users'), where('email', '==', userEmail));
    const userSnapshot = await getDocs(usersQuery);
    
    if (!userSnapshot.empty) {
      // Utiliser le premier utilisateur trouvé avec cet email
      userId = userSnapshot.docs[0].id;
      console.log("Utilisateur trouvé avec ID:", userId);
    } else {
      // Créer un nouvel utilisateur si nécessaire
      userId = `user_${Date.now()}`;
      console.log("Nouvel utilisateur créé avec ID:", userId);
      
      // Créer le document utilisateur
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        email: userEmail,
        displayName: session.user.name || "Utilisateur",
        firstName: "",
        lastName: "",
        createdAt: new Date().toISOString(),
        spaces: []
      });
    }
    
    // Obtenir les données de la requête
    const data = await request.json();
    const { name } = data;
    console.log("Données reçues:", { name });

    if (!name || name.trim() === '') {
      console.log("Erreur: nom d'espace manquant");
      return NextResponse.json({ error: 'Le nom de l\'espace est requis' }, { status: 400 });
    }

    // Générer un ID unique pour le nouvel espace
    const newSpaceId = `space_${Date.now()}`;
    console.log("Nouvel ID d'espace généré:", newSpaceId);

    try {
      // Créer le document d'espace
      console.log("Tentative de création du document d'espace...");
      await setDoc(doc(db, 'spaces', newSpaceId), {
        name,
        ownerId: userId,
        createdAt: new Date().toISOString(),
        members: [userId]
      });
      console.log("Document d'espace créé avec succès");

      // Ajouter l'espace à la liste des espaces de l'utilisateur
      console.log("Mise à jour des espaces de l'utilisateur...");
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      // L'utilisateur existe forcément à ce stade, car nous l'avons vérifié/créé plus haut
      // Vérification supplémentaire pour TypeScript
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const spaces = userData.spaces || [];
  
        // Ajouter l'espace à la liste des espaces de l'utilisateur et désactiver l'onboarding
        await updateDoc(userRef, {
          spaces: [...spaces, newSpaceId],
          needsOnboarding: false // Désactiver le flag d'onboarding après création du premier espace
        });
        console.log("Espaces de l'utilisateur mis à jour avec succès");
        
        // Log pour débogage, afficher tous les espaces de l'utilisateur
        console.log("Espaces de l'utilisateur après mise à jour:", [...spaces, newSpaceId]);
      } else {
        // Ce cas ne devrait jamais arriver, mais gérons-le au cas où
        console.log("Erreur inattendue: document utilisateur introuvable");
        await setDoc(userRef, {
          uid: userId,
          email: userEmail,
          displayName: session.user.name || "Utilisateur",
          firstName: "",
          lastName: "",
          createdAt: new Date().toISOString(),
          spaces: [newSpaceId]
        });
        console.log("Document utilisateur créé avec les espaces");
      }

      console.log("Fin du traitement, retour de la réponse");
      return NextResponse.json({ 
        success: true, 
        space: {
          id: newSpaceId,
          name,
          ownerId: userId
        }
      });
    } catch (innerError: any) {
      console.error('Erreur Firebase lors de la création de l\'espace:', innerError);
      return NextResponse.json({ 
        error: 'Erreur Firebase: ' + (innerError.message || 'Erreur de base de données'), 
        details: innerError 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erreur générale lors de la création de l\'espace:', error);
    return NextResponse.json({ 
      error: error.message || 'Une erreur interne est survenue',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
