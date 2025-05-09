import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "next-auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const user = userCredential.user;
          
          // Récupérer les données de l'utilisateur depuis Firestore (source unique de vérité)
          let displayName = user.displayName || "";
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Utiliser les champs firstName et lastName pour construire le displayName
              if (userData.firstName && userData.lastName) {
                displayName = `${userData.firstName} ${userData.lastName}`;
              } else {
                // Fallback au displayName si disponible
                displayName = userData.displayName || displayName;
              }
            }
          } catch (dbError) {
            console.error("Erreur lors de la récupération des données utilisateur:", dbError);
          }
          
          return {
            id: user.uid,
            email: user.email || "",
            name: displayName,
            image: user.photoURL || ""
          } as User;
        } catch (error) {
          console.error("Erreur d'authentification:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    // Le champ signUp n'est pas dans l'interface PagesOptions
    // signUp: "/auth/signup",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Stocker l'ID de l'utilisateur et l'email dans le token JWT
        token.id = user.id;
        token.email = user.email;
        console.log("JWT token enrichi avec l'ID utilisateur:", token.id);
      }
      return token;
    },
    async session({ session, token }) {
      // Assurons-nous que session.user existe toujours
      if (!session.user) {
        session.user = { id: '', name: '', email: '' };
      }
      
      // Ajouter l'ID utilisateur à la session (CRUCIAL pour la création d'espaces)
      session.user.id = token.id as string;
      console.log("Session enrichie avec l'ID utilisateur:", session.user.id);
        
      try {
        // S'assurer que l'ID est bien défini avant de l'utiliser
        if (token.id) {
          // Récupérer les données utilisateur depuis Firestore comme source unique de vérité
          const userDoc = await getDoc(doc(db, 'users', token.id as string));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Utiliser firstName et lastName pour construire le nom complet
            if (userData.firstName && userData.lastName) {
              session.user.name = `${userData.firstName} ${userData.lastName}`;
            } else {
              // Fallback au displayName si disponible
              session.user.name = userData.displayName || session.user.name;
            }
            
            // S'assurer que l'email est toujours présent dans la session
            if (!session.user.email) {
              session.user.email = userData.email || token.email as string || '';
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
        // En cas d'erreur, garder les données de session existantes
      }
      
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  }
});

export { handler as GET, handler as POST }
