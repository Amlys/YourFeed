@echo off
echo 🔥 YourFav - Démarrage sécurisé avec Firebase
echo.

REM Couleurs pour les messages
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

echo %BLUE%🔍 Vérification des prérequis Firebase...%RESET%

REM Vérifier si Firebase CLI est installé
firebase --version > nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Firebase CLI n'est pas installé%RESET%
    echo %YELLOW%📦 Installation automatique de Firebase CLI...%RESET%
    npm install -g firebase-tools
    if %errorlevel% neq 0 (
        echo %RED%❌ Échec de l'installation Firebase CLI%RESET%
        echo Pour installer manuellement : npm install -g firebase-tools
        pause
        exit /b 1
    )
    echo %GREEN%✅ Firebase CLI installé avec succès%RESET%
)

REM Vérifier la connexion Firebase
echo %BLUE%🔐 Vérification de la connexion Firebase...%RESET%
firebase projects:list > nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%⚠️  Non connecté à Firebase%RESET%
    echo %BLUE%🚀 Lancement de la connexion Firebase...%RESET%
    firebase login
    if %errorlevel% neq 0 (
        echo %RED%❌ Échec de la connexion Firebase%RESET%
        pause
        exit /b 1
    )
)

REM Afficher le projet actuel
echo %BLUE%📋 Projet Firebase actuel :%RESET%
firebase use

echo.
echo %BLUE%🛡️  Déploiement des règles de sécurité Firestore...%RESET%

REM Valider les règles
firebase firestore:rules:check
if %errorlevel% neq 0 (
    echo %RED%❌ Erreur dans les règles Firestore%RESET%
    echo %YELLOW%Vérifiez le fichier firestore.rules%RESET%
    pause
    exit /b 1
)

REM Déployer les règles
firebase deploy --only firestore:rules
if %errorlevel% neq 0 (
    echo %RED%❌ Échec du déploiement des règles%RESET%
    echo %YELLOW%Vérifiez votre connexion et vos permissions%RESET%
    pause
    exit /b 1
)

echo %GREEN%✅ Règles de sécurité Firestore déployées avec succès !%RESET%
echo.

REM Vérifier si le serveur de dev est déjà en cours
netstat -an | findstr ":5173" > nul 2>&1
if %errorlevel% equ 0 (
    echo %YELLOW%⚠️  Le serveur de développement semble déjà en cours (port 5173)%RESET%
    echo %BLUE%🔄 Arrêt du serveur existant...%RESET%
    taskkill /f /im node.exe > nul 2>&1
    timeout /t 2 > nul
)

echo %GREEN%🚀 Lancement du serveur de développement sécurisé...%RESET%
echo %BLUE%📱 Application disponible sur : http://localhost:5173%RESET%
echo %YELLOW%🛡️  Base de données protégée par les règles de sécurité%RESET%
echo.

REM Lancer Vite en mode développement
npm run vite:dev 