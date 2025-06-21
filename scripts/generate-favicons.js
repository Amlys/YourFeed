#!/usr/bin/env node

/**
 * Script pour générer les favicons YourFeed
 * Génère les favicons en différentes tailles à partir du SVG
 */

import fs from 'fs';
import path from 'path';

// Fonction pour créer un favicon SVG personnalisé
function createFaviconSVG(size, withBackground = false) {
  const fontSize = Math.floor(size * 0.5);
  const radius = Math.floor(size / 2) - 1;
  
  const background = withBackground ? `
    <defs>
      <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#EF4444;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#DC2626;stop-opacity:1" />
      </linearGradient>
    </defs>
    <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="url(#redGradient)" stroke="#B91C1C" stroke-width="1"/>
  ` : '';
  
  const textColor = withBackground ? 'white' : '#DC2626';
  const textY = Math.floor(size * 0.7);
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${background}
  <text x="${size/2}" y="${textY}" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        text-anchor="middle" 
        fill="${textColor}">YF</text>
</svg>`;
}

// Créer le dossier public s'il n'existe pas
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Générer les différents favicons
const favicons = [
  { name: 'favicon.svg', size: 32, withBackground: false },
  { name: 'favicon-simple.svg', size: 32, withBackground: false },
  { name: 'favicon-bg.svg', size: 32, withBackground: true },
  { name: 'apple-touch-icon.svg', size: 180, withBackground: true },
];

favicons.forEach(({ name, size, withBackground }) => {
  const svgContent = createFaviconSVG(size, withBackground);
  const filePath = path.join(publicDir, name);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Créé: ${name} (${size}x${size})`);
});

// Créer un manifest.json pour PWA
const manifest = {
  name: "YourFeed YouTube App",
  short_name: "YourFeed",
  description: "Application de curation de contenu YouTube",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#DC2626",
  icons: [
    {
      src: "/favicon-bg.svg",
      sizes: "32x32",
      type: "image/svg+xml"
    },
    {
      src: "/apple-touch-icon.svg", 
      sizes: "180x180",
      type: "image/svg+xml"
    }
  ]
};

fs.writeFileSync(
  path.join(publicDir, 'manifest.json'), 
  JSON.stringify(manifest, null, 2)
);

console.log('✅ Créé: manifest.json');
console.log('\n🎉 Tous les favicons ont été générés avec succès !');
console.log('\n📋 Fichiers créés:');
console.log('   • favicon.svg (32x32) - Version simple');
console.log('   • favicon-bg.svg (32x32) - Version avec fond');
console.log('   • apple-touch-icon.svg (180x180) - Pour iOS');
console.log('   • manifest.json - Pour PWA');
console.log('\n💡 Pour utiliser la version avec fond, modifiez index.html:');
console.log('   <link rel="icon" type="image/svg+xml" href="/favicon-bg.svg" />'); 