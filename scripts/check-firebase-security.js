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
    exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr, stdout });
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
    const result = await runCommand('firebase --version');
    if (result && result.trim()) {
      log.success(`Firebase CLI installé (v${result.trim()})`);
      return true;
    } else {
      throw new Error('Firebase CLI non détecté');
    }
  } catch (error) {
    log.error('Firebase CLI non installé ou non accessible');
    log.info('💡 Solutions possibles :');
    log.info('   1. npm install -g firebase-tools');
    log.info('   2. Redémarrer le terminal après installation');
    log.info('   3. Utiliser npm run dev (sans vérification Firebase)');
    return false;
  }
}

async function checkFirebaseAuth() {
  try {
    const result = await runCommand('firebase projects:list');
    if (result && result.includes('Project ID')) {
      log.success('Connecté à Firebase');
      return true;
    } else {
      throw new Error('Pas de projets Firebase');
    }
  } catch (error) {
    log.warning('Non connecté à Firebase ou aucun projet configuré');
    log.info('💡 Pour vous connecter :');
    log.info('   1. firebase login');
    log.info('   2. firebase use --add (pour sélectionner un projet)');
    log.info('   3. Ou utiliser npm run dev (sans vérification Firebase)');
    return false;
  }
}

async function deployFirestoreRules() {
  try {
    log.info('🚀 Déploiement des règles Firestore...');
    
    // Valider les règles d'abord
    try {
      await runCommand('firebase firestore:rules:check');
      log.success('Règles Firestore validées');
    } catch (checkError) {
      log.warning('Validation des règles échouée, tentative de déploiement direct...');
    }
    
    // Déployer les règles
    await runCommand('firebase deploy --only firestore:rules');
    log.success('Règles Firestore déployées avec succès');
    
    return true;
  } catch (error) {
    log.error('Échec déploiement des règles');
    log.info(`Détails erreur: ${error.stderr || error.error?.message || 'Erreur inconnue'}`);
    log.info('💡 Le développement peut continuer sans déploiement Firebase');
    return false;
  }
}

async function main() {
  console.log(`${colors.cyan}🔥 YourFeed - Vérification Sécurité Firebase (Optionnelle)${colors.reset}`);
  console.log('');
  
  try {
    // 1. Vérifier les règles de sécurité
    log.info('🔍 Étape 1/4 - Validation des règles Firestore...');
    const rulesValid = await checkFirebaseRules();
    if (!rulesValid) {
      log.error('Règles de sécurité invalides ou manquantes');
      log.warning('⚠️  SÉCURITÉ COMPROMISE - Développement autorisé mais non recommandé');
    }
    
    // 2. Vérifier Firebase CLI (non bloquant)
    log.info('🔧 Étape 2/4 - Vérification Firebase CLI...');
    const cliOk = await checkFirebaseCLI();
    if (!cliOk) {
      log.info('🚀 Démarrage en mode développement sans Firebase CLI');
      return; // Sortie gracieuse
    }
    
    // 3. Vérifier l'authentification Firebase (non bloquant)
    log.info('🔐 Étape 3/4 - Vérification authentification Firebase...');
    const authOk = await checkFirebaseAuth();
    if (!authOk) {
      log.info('🚀 Démarrage en mode développement sans authentification Firebase');
      return; // Sortie gracieuse
    }
    
    // 4. Déployer les règles (optionnel)
    log.info('🚀 Étape 4/4 - Déploiement des règles de sécurité...');
    const deployOk = await deployFirestoreRules();
    if (!deployOk) {
      log.warning('Déploiement des règles échoué - Développement autorisé');
    }
    
    log.success('🎉 Vérification sécurité terminée');
    
  } catch (error) {
    log.error(`Erreur inattendue: ${error.message}`);
    log.info('🚀 Démarrage en mode développement malgré l\'erreur');
  }
}

// En mode développement, ne pas bloquer le démarrage
main().catch(error => {
  console.error('Erreur critique:', error);
  console.log('🚀 Démarrage en mode développement...');
}); 