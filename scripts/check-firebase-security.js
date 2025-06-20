#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Couleurs pour les messages console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  security: (msg) => console.log(`${colors.magenta}🛡️  ${msg}${colors.reset}`)
};

async function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
}

async function checkFirebaseRules() {
  const rulesPath = path.join(process.cwd(), 'firestore.rules');
  
  if (!fs.existsSync(rulesPath)) {
    log.error('Fichier firestore.rules manquant !');
    return false;
  }

  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  
  // Vérifications de sécurité critiques
  const securityChecks = [
    {
      pattern: /rules_version.*'2'/,
      message: 'Version des règles Firestore v2',
      critical: true
    },
    {
      pattern: /request\.auth\s*!=\s*null/,
      message: 'Vérification d\'authentification présente',
      critical: true
    },
    {
      pattern: /request\.auth\.uid\s*==\s*userId/,
      message: 'Vérification propriétaire des données',
      critical: true
    },
    {
      pattern: /allow\s+read,\s*write\s*:\s*if\s+false/,
      message: 'Règles par défaut sécurisées',
      critical: false
    }
  ];

  let criticalIssues = 0;
  
  log.info('🔍 Validation des règles de sécurité Firestore...');
  
  securityChecks.forEach(check => {
    if (check.pattern.test(rulesContent)) {
      log.success(check.message);
    } else {
      if (check.critical) {
        log.error(`CRITIQUE: ${check.message} - MANQUANT`);
        criticalIssues++;
      } else {
        log.warning(`Recommandé: ${check.message} - MANQUANT`);
      }
    }
  });

  return criticalIssues === 0;
}

async function checkFirebaseCLI() {
  try {
    await runCommand('firebase --version');
    log.success('Firebase CLI installé');
    return true;
  } catch (error) {
    log.error('Firebase CLI non installé');
    log.info('Installation automatique...');
    
    try {
      await runCommand('npm install -g firebase-tools');
      log.success('Firebase CLI installé avec succès');
      return true;
    } catch (installError) {
      log.error('Échec installation Firebase CLI');
      return false;
    }
  }
}

async function checkFirebaseAuth() {
  try {
    await runCommand('firebase projects:list');
    log.success('Connecté à Firebase');
    return true;
  } catch (error) {
    log.warning('Non connecté à Firebase');
    log.info('Veuillez vous connecter avec: firebase login');
    return false;
  }
}

async function deployFirestoreRules() {
  try {
    log.info('🚀 Déploiement des règles Firestore...');
    
    // Valider les règles d'abord
    const checkResult = await runCommand('firebase firestore:rules:check');
    log.success('Règles Firestore validées');
    
    // Déployer les règles avec output détaillé
    const deployResult = await runCommand('firebase deploy --only firestore:rules --json');
    log.success('Règles Firestore déployées avec succès');
    
    return true;
  } catch (error) {
    log.error('Échec déploiement des règles');
    if (error.stderr) {
      console.error(`Erreur stderr: ${error.stderr}`);
    }
    if (error.error) {
      console.error(`Erreur: ${error.error.message}`);
    }
    
    // Essayer un déploiement simple sans JSON
    try {
      log.warning('Tentative de déploiement alternatif...');
      await runCommand('firebase deploy --only firestore:rules --force');
      log.success('Déploiement alternatif réussi');
      return true;
    } catch (retryError) {
      log.error('Échec du déploiement alternatif');
      return false;
    }
  }
}

async function main() {
  console.log(`${colors.cyan}🔥 YourFeed - Sécurisation Firebase automatique${colors.reset}`);
  console.log('');
  
  try {
    // 1. Vérifier les règles de sécurité
    log.info('🔍 Étape 1/4 - Validation des règles Firestore...');
    const rulesValid = await checkFirebaseRules();
    if (!rulesValid) {
      log.error('Règles de sécurité invalides ou manquantes');
      log.warning('Utilisez npm run dev:unsafe pour démarrer sans sécurité (déconseillé)');
      process.exit(1);
    }
    
    // 2. Vérifier Firebase CLI
    log.info('🔧 Étape 2/4 - Vérification Firebase CLI...');
    const cliOk = await checkFirebaseCLI();
    if (!cliOk) {
      log.error('Impossible d\'installer Firebase CLI');
      log.warning('Utilisez npm run dev:unsafe pour démarrer sans sécurité (déconseillé)');
      process.exit(1);
    }
    
    // 3. Vérifier l'authentification Firebase
    log.info('🔐 Étape 3/4 - Vérification authentification Firebase...');
    const authOk = await checkFirebaseAuth();
    if (!authOk) {
      log.error('Authentification Firebase requise');
      log.info('Pour se connecter : firebase login');
      log.warning('Ou utilisez npm run dev:unsafe pour démarrer sans sécurité (déconseillé)');
      process.exit(1);
    }
    
    // 4. Déployer les règles
    log.info('🚀 Étape 4/4 - Déploiement des règles de sécurité...');
    const deployOk = await deployFirestoreRules();
    if (!deployOk) {
      log.error('Échec du déploiement des règles');
      log.warning('Utilisez npm run dev:unsafe pour démarrer sans sécurité (déconseillé)');
      process.exit(1);
    }
    
    console.log('');
    log.security('🛡️  Sécurité Firebase déployée avec succès !');
    log.success('✅ Base de données YourFeed maintenant protégée');
    log.info('🚀 Démarrage du serveur de développement sécurisé...');
    console.log('');
    
  } catch (error) {
    log.error('Erreur inattendue lors de la sécurisation');
    console.error(error);
    log.warning('Utilisez npm run dev:unsafe pour démarrer sans sécurité (déconseillé)');
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('check-firebase-security.js')) {
  main();
}

export { checkFirebaseRules, checkFirebaseCLI, checkFirebaseAuth, deployFirestoreRules }; 