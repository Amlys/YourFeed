@echo off
echo 🔥 Déploiement des règles Firestore sécurisées pour YourFeed...
echo.

REM Vérifier si Firebase CLI est installé
firebase --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI n'est pas installé
    echo Pour installer : npm install -g firebase-tools
    echo.
    pause
    exit /b 1
)

REM Vérifier la connexion Firebase
echo 🔍 Vérification de la connexion Firebase...
firebase projects:list > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Non connecté à Firebase
    echo Pour se connecter : firebase login
    echo.
    pause
    exit /b 1
)

REM Afficher le projet actuel
echo 📋 Projet Firebase actuel :
firebase use

echo.
echo 🔐 Validation des règles de sécurité...
REM Valider les règles avant déploiement
firebase firestore:rules:check

if %errorlevel% neq 0 (
    echo ❌ Erreur dans les règles Firestore
    echo Vérifier le fichier firestore.rules
    echo.
    pause
    exit /b 1
)

echo ✅ Règles validées avec succès
echo.

REM Demander confirmation
set /p confirm="Êtes-vous sûr de vouloir déployer les règles de sécurité ? (O/N) : "
if /i not "%confirm%"=="O" (
    echo ❌ Déploiement annulé
    pause
    exit /b 0
)

echo.
echo 📤 Déploiement des règles de sécurité Firestore...
firebase deploy --only firestore:rules

if %errorlevel% equ 0 (
    echo.
    echo ✅ RÈGLES FIRESTORE DÉPLOYÉES AVEC SUCCÈS!
    echo 🔒 Base de données maintenant SÉCURISÉE
    echo.
    echo 🛡️ Sécurité implémentée :
    echo   - Accès limité aux utilisateurs authentifiés uniquement
    echo   - Isolation totale des données par utilisateur
    echo   - Validation stricte des structures de données
    echo   - Blocage de tous les accès non autorisés
    echo.
    echo 📊 Collections sécurisées :
    echo   - /users/{userId} : catégories et favoris
    echo   - /videos/{userId}/userVideos/{videoId} : vidéos avec état de suppression
    echo.
) else (
    echo.
    echo ❌ ERREUR lors du déploiement des règles
    echo Vérifier :
    echo   1. Le fichier firestore.rules
    echo   2. La configuration Firebase
    echo   3. Les permissions du projet
    echo.
)

echo Appuyer sur une touche pour continuer...
pause > nul 