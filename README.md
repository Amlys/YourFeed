# 🎬 YourFeed - Application YouTube Personnalisée

> **Une application moderne et sécurisée pour gérer vos chaînes YouTube favorites avec un système de catégorisation intelligent.**

![YourFeed](https://img.shields.io/badge/YourFeed-YouTube%20App-red?style=for-the-badge&logo=youtube)
[![React](https://img.shields.io/badge/React-18.3-blue?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.8-orange?style=flat&logo=firebase)](https://firebase.google.com/)

---

## 📋 Table des Matières

1. [✨ Présentation](#-présentation)
2. [🚀 Installation Rapide](#-installation-rapide)
3. [⚙️ Prérequis](#️-prérequis)
4. [🔧 Installation Détaillée](#-installation-détaillée)
5. [🔑 Configuration YouTube API](#-configuration-youtube-api)
6. [🛡️ Configuration Firebase](#️-configuration-firebase)
7. [▶️ Lancement de l'Application](#️-lancement-de-lapplication)
8. [🔍 Résolution de Problèmes](#-résolution-de-problèmes)

---

## ✨ Présentation

**YourFeed** est une application YouTube moderne qui vous permet de :

- 🎯 **Organiser vos chaînes favorites** avec un système de catégories personnalisables
- 🔍 **Rechercher facilement** des chaînes YouTube avec suggestions intelligentes
- 📱 **Interface responsive** qui s'adapte à tous vos appareils
- 🛡️ **Sécurité maximale** avec authentification Firebase et chiffrement des données
- ⚡ **Performance optimisée** avec virtualisation et cache intelligent
- 🎨 **Design moderne** avec thème sombre/clair et animations fluides

---

## 🚀 Installation Rapide

> **⏱️ Temps estimé : 10-15 minutes**

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/yourfeed.git
cd yourfeed

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement (voir sections suivantes)
# - Configuration Firebase
# - Configuration YouTube API

# 4. Lancer l'application
npm run dev
```

🎉 **L'application sera disponible sur** : http://localhost:5173/

---

## ⚙️ Prérequis

### 🖥️ **Système Requis**

| Composant | Version Minimale | Version Recommandée |
|-----------|------------------|---------------------|
| **Node.js** | 18.0+ | 20.0+ |
| **npm** | 8.0+ | 10.0+ |
| **Git** | 2.0+ | Dernière version |

### 🔧 **Outils à Installer**

1. **Node.js** - [Télécharger ici](https://nodejs.org/)
2. **Firebase CLI** - Installation : `npm install -g firebase-tools`
3. **Git** - [Télécharger ici](https://git-scm.com/)

### 📱 **Comptes Requis**

1. **Compte Google** - Pour l'authentification Firebase
2. **Projet Firebase** - [Console Firebase](https://console.firebase.google.com/)
3. **Clé API YouTube** - [Google Cloud Console](https://console.cloud.google.com/)

---

## 🔧 Installation Détaillée

### 📦 **Étape 1 : Cloner le Projet**

```bash
# Cloner le repository
git clone https://github.com/votre-username/yourfeed.git

# Naviguer dans le dossier
cd yourfeed
```

### 📋 **Étape 2 : Vérifier les Prérequis**

```bash
# Vérifier Node.js
node --version  # Devrait afficher v18.0+ ou plus

# Vérifier npm
npm --version   # Devrait afficher 8.0+ ou plus

# Installer Firebase CLI si nécessaire
npm install -g firebase-tools

# Vérifier Firebase CLI
firebase --version
```

### 📦 **Étape 3 : Installer les Dépendances**

```bash
# Installation (peut prendre 2-5 minutes)
npm install
```

---

## 🔑 Configuration YouTube API

### 🔐 **Étape 1 : Créer une Clé API YouTube**

1. **Aller sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Créer un nouveau projet** ou sélectionner un projet existant
3. **Activer l'API YouTube Data v3** :
   - Aller dans "APIs & Services" > "Library"
   - Rechercher "YouTube Data API v3"
   - Cliquer sur "Enable"

4. **Créer une clé API** :
   - Aller dans "APIs & Services" > "Credentials"
   - Cliquer sur "Create Credentials" > "API Key"
   - **⚠️ IMPORTANT : Copier votre clé API** (commence par `AIza...`)

### 🔒 **Étape 2 : Sécuriser votre Clé API**

1. **Cliquer sur votre clé API** dans la liste des credentials
2. **Restreindre la clé** :
   - **Application restrictions** : "HTTP referrers (web sites)"
   - **Website restrictions** : Ajouter `http://localhost:5173/*`
   - **API restrictions** : Sélectionner uniquement "YouTube Data API v3"
3. **Sauvegarder** les modifications

---

## 🛡️ Configuration Firebase

### 🚀 **Étape 1 : Créer un Projet Firebase**

1. **Aller sur** [Firebase Console](https://console.firebase.google.com/)
2. **Créer un nouveau projet** :
   - Nom du projet : `yourfeed-app` (ou votre choix)
   - Activer Google Analytics (optionnel)
3. **Ajouter une application Web** :
   - Nom de l'app : "YourFeed Web"
   - **⚠️ IMPORTANT : Copier la configuration Firebase**

### 🔐 **Étape 2 : Configurer l'Authentification**

1. **Dans Firebase Console** > "Authentication" > "Get started"
2. **Sign-in method** > "Google" > "Enable"
3. **Ajouter votre email** comme utilisateur de test si nécessaire

### 💾 **Étape 3 : Configurer Firestore**

1. **Dans Firebase Console** > "Firestore Database" > "Create database"
2. **Mode de sécurité** : "Start in test mode" (temporaire)
3. **Localisation** : Choisir une région proche de vous

### ⚙️ **Étape 4 : Configuration Locale**

#### **4.1 Configurer Firebase Functions**

```bash
# Créer le dossier functions s'il n'existe pas
mkdir -p functions

# Créer le fichier .env dans functions
# Sur Windows : type nul > functions\.env
# Sur Linux/Mac : touch functions/.env
```

Éditer `functions/.env` et ajouter :

```env
# functions/.env
YOUTUBE_API_KEY=VOTRE_CLE_API_YOUTUBE_ICI
```

#### **4.2 Mettre à jour la Configuration Firebase**

Éditer `src/firebaseConfig.ts` avec votre configuration Firebase :

```typescript
// src/firebaseConfig.ts
const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "votre-app-id"
};
```

#### **4.3 Configurer Firebase CLI**

```bash
# Se connecter à Firebase
firebase login

# Configurer le projet Firebase
firebase use --add
# Sélectionner votre projet et lui donner l'alias "default"
```

#### **4.4 Mettre à jour .firebaserc**

Éditer `.firebaserc` :

```json
{
  "projects": {
    "default": "votre-projet-id"
  }
}
```

---

## ▶️ Lancement de l'Application

### 🚀 **Développement (Recommandé)**

```bash
# Lancement sécurisé avec vérifications automatiques
npm run dev
```

**🔄 Processus de démarrage** :
1. ✅ Validation des règles Firestore
2. ✅ Vérification Firebase CLI  
3. ✅ Vérification authentification
4. ✅ Déploiement des règles de sécurité
5. 🚀 Démarrage du serveur Vite

**📱 Application disponible sur** : http://localhost:5173/

### ⚡ **Développement Rapide (Pour Tests)**

```bash
# Démarrage rapide sans vérifications de sécurité
npm run dev:unsafe
```

### 🎯 **Autres Commandes Utiles**

```bash
# Build pour production
npm run build

# Prévisualiser le build
npm run preview

# Lancer les tests
npm run test

# Lint du code
npm run lint
```

---

## 🔍 Résolution de Problèmes

### ❌ **Erreurs Courantes**

#### **1. "Failed to fetch" sur port 5001**

**Cause** : Firebase Functions pas démarrées
**Solution** :
```bash
npm run dev  # Utiliser la commande complète
```

#### **2. "Firebase project not found"**

**Solution** :
```bash
# Vérifier le projet configuré
firebase projects:list

# Changer de projet si nécessaire
firebase use votre-projet-id
```

#### **3. "YouTube API quota exceeded"**

**Cause** : Limites API dépassées (10,000 requêtes/jour gratuit)
**Solutions** :
- Attendre le reset quotidien (minuit PST)
- Optimiser vos recherches
- Upgrader vers un plan payant

#### **4. Erreurs d'installation npm**

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Sur Windows
rmdir /s node_modules
del package-lock.json
npm install
```

### 🔧 **Diagnostics**

```bash
# Vérifier l'état Firebase
firebase projects:list
firebase use

# Vérifier les règles Firestore
firebase firestore:rules:check

# Logs détaillés
npm run security:validate
```

### 🆘 **Obtenir de l'Aide**

1. **Vérifier les logs** dans la console (F12)
2. **Consulter** `DEVELOPER_GUIDE.md` pour plus de détails
3. **Créer une issue** sur GitHub si le problème persiste

---

## 🎉 Félicitations !

Vous avez maintenant une installation complète de **YourFeed** ! 

### 🚀 **Prochaines Étapes**

1. **Se connecter** avec votre compte Google
2. **Rechercher** vos premières chaînes YouTube favorites  
3. **Créer des catégories** pour organiser vos chaînes
4. **Explorer** toutes les fonctionnalités

### 💡 **Conseils d'Utilisation**

- **Organisez avec les catégories** : Entertainment, Science, Sport, Technology...
- **Utilisez la recherche intelligente** pour découvrir de nouvelles chaînes
- **Explorez les onglets** : À voir, Déjà vu, etc.
- **Profitez du thème sombre** pour le confort nocturne

---

## 📚 Documentation Complète

- `DEVELOPER_GUIDE.md` - Guide technique détaillé
- `README_SECURITE.md` - Sécurisation Firebase
- `RAPPORT_ANALYSE_PROJET.md` - Analyse qualité du code

---

**🎬 Profitez de YourFeed et gardez vos chaînes YouTube organisées !** 