# Next.js Multi-Space Template

Un template d'application web avec authentification Firebase, gestion multi-espaces et interface moderne. Idéal comme point de départ pour vos projets SaaS ou applications web nécessitant une gestion d'espaces utilisateurs.

## 🚀 Fonctionnalités

- **Authentification complète** - Inscription, connexion et gestion de session avec Firebase
- **Système multi-espaces** - Création et sélection d'espaces de travail
- **Interface responsive** - Dashboard avec sidebar et navigation intuitive
- **Structure optimisée** - Architecture Next.js App Router prête à l'emploi

## 🛠️ Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Support de typage statique
- **Firebase** - Authentification et base de données Firestore
- **NextAuth.js** - Gestion des sessions côté serveur
- **Chakra UI** - Composants UI modernes et accessibles

## 📋 Prérequis

- Node.js 18+ et npm/yarn
- Un projet Firebase (instructions de configuration ci-dessous)

## 🔧 Installation

### 1. Utiliser ce template

```bash
# Option 1: Utiliser comme template GitHub
# Cliquez sur "Use this template" sur la page GitHub du repository

# Option 2: Cloner manuellement
git clone <repository-url>
cd next-multi-space-template
```

### 2. Installer les dépendances

```bash
npm install
# ou
yarn
```

### 3. Configurer Firebase

1. Créez un nouveau projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activez l'authentification par email/mot de passe
3. Créez une base de données Firestore
4. Récupérez vos clés d'API Firebase dans les paramètres du projet

### 4. Configurer les variables d'environnement

Copiez le fichier `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Remplissez les variables avec vos propres valeurs Firebase et NextAuth :

```
# Pour générer un secret NextAuth : 
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=votre_secret_ici
NEXTAUTH_URL=http://localhost:3000

# Valeurs de votre projet Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# etc.
```

### 5. Lancer le serveur de développement

```bash
npm run dev
# ou
yarn dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du projet

```
/
├── app/                    # Application Next.js (App Router)
│   ├── api/                # Routes API (NextAuth)
│   ├── auth/               # Pages d'authentification
│   ├── components/         # Composants réutilisables
│   ├── dashboard/          # Interface principale après connexion
│   ├── onboarding/         # Flux d'onboarding
│   ├── providers/          # Providers React (Chakra UI, etc.)
│   └── styles/             # Styles globaux
├── lib/                    # Utilitaires et configurations
│   └── firebase.ts         # Configuration Firebase
├── types/                  # Types TypeScript
├── .env.example            # Exemple de variables d'environnement
└── README.md               # Documentation
```

## 🔄 Personnalisation

### Modifier le nom de l'application

1. Changez le nom dans `package.json`
2. Mettez à jour le titre dans les composants de la sidebar et le layout principal

### Ajouter des fonctionnalités

Le template est conçu pour être extensible. Vous pouvez facilement ajouter :
- De nouvelles pages dans le dashboard
- Des fonctionnalités spécifiques à vos espaces
- Des intégrations avec d'autres services

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
