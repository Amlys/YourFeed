# 🎨 Favicons YourFeed

## 📋 Fichiers créés

### **Favicons principaux**
- `favicon.svg` (32x32) - Version simple avec lettres YF rouges sur fond transparent
- `favicon-bg.svg` (32x32) - Version avec fond dégradé rouge et lettres blanches
- `apple-touch-icon.svg` (180x180) - Icône pour iOS/Safari avec fond rouge

### **Configuration PWA**
- `manifest.json` - Manifest pour Progressive Web App

### **Fichiers de développement**
- `favicon-enhanced.svg` - Version alternative avec cercle de fond

## 🎯 Utilisation

### **Dans l'HTML**
```html
<!-- Favicon principal (avec fond) -->
<link rel="icon" type="image/svg+xml" href="/favicon-bg.svg" />

<!-- Favicon alternatif (simple) -->
<link rel="alternate icon" type="image/svg+xml" href="/favicon.svg" />

<!-- Icône Apple/iOS -->
<link rel="apple-touch-icon" href="/apple-touch-icon.svg" />

<!-- Manifest PWA -->
<link rel="manifest" href="/manifest.json" />
```

### **Caractéristiques**
- **Couleur principale** : Rouge (#DC2626)
- **Dégradé** : #EF4444 → #DC2626
- **Police** : Arial, sans-serif
- **Style** : Bold, centré

## 🔄 Régénération

Pour régénérer les favicons :
```bash
npm run generate:favicons
```

## 📱 Support

- ✅ **Navigateurs modernes** - SVG favicon
- ✅ **iOS/Safari** - Apple touch icon
- ✅ **PWA** - Manifest avec icônes
- ✅ **Thème couleur** - Rouge YourFeed

## 🎨 Personnalisation

Pour modifier les favicons :
1. Éditer les fichiers SVG dans `/public/`
2. Ajuster les couleurs dans le dégradé
3. Modifier la taille de police si nécessaire
4. Tester dans différents navigateurs 