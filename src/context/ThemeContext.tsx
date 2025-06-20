import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  systemPreference: boolean;
  isAutoMode: boolean;
  toggleAutoMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme-preference';
const AUTO_MODE_KEY = 'theme-auto-mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Détecter la préférence système
  const [systemPreference, setSystemPreference] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Vérifier si le mode auto est activé
  const [isAutoMode, setIsAutoMode] = useState(() => {
    const savedAutoMode = localStorage.getItem(AUTO_MODE_KEY);
    return savedAutoMode === null || savedAutoMode === 'true';
  });

  // État du dark mode
  const [darkMode, setDarkModeState] = useState(() => {
    // Si mode auto, utiliser la préférence système
    if (isAutoMode) {
      return systemPreference;
    }
    
    // Sinon, utiliser la préférence stockée
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    
    // Par défaut, utiliser la préférence système
    return systemPreference;
  });

  // Écouter les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPreference(event.matches);
      
      // Si le mode auto est activé, mettre à jour le thème
      if (isAutoMode) {
        setDarkModeState(event.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isAutoMode]);

  // Appliquer le thème au DOM avec transition fluide
  useEffect(() => {
    const root = document.documentElement;
    
    // Ajouter la classe de transition
    root.style.transition = 'background-color 300ms ease-in-out, color 300ms ease-in-out';
    
    if (darkMode) {
      root.classList.add('dark');
      // Également mettre à jour la couleur de fond du body pour éviter les flashs
      document.body.style.backgroundColor = '#111827'; // gray-900
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f9fafb'; // gray-50
    }

    // Sauvegarder la préférence uniquement si ce n'est pas le mode auto
    if (!isAutoMode) {
      localStorage.setItem(STORAGE_KEY, darkMode.toString());
    }

    // Nettoyer la transition après application
    const timer = setTimeout(() => {
      root.style.transition = '';
    }, 300);

    return () => clearTimeout(timer);
  }, [darkMode, isAutoMode]);

  // Sauvegarder le mode auto
  useEffect(() => {
    localStorage.setItem(AUTO_MODE_KEY, isAutoMode.toString());
    
    // Si on active le mode auto, utiliser la préférence système
    if (isAutoMode) {
      setDarkModeState(systemPreference);
      localStorage.removeItem(STORAGE_KEY); // Supprimer la préférence manuelle
    }
  }, [isAutoMode, systemPreference]);

  const toggleDarkMode = useCallback(() => {
    // Désactiver le mode auto si on bascule manuellement
    if (isAutoMode) {
      setIsAutoMode(false);
    }
    setDarkModeState(prev => !prev);
  }, [isAutoMode]);

  const setDarkMode = useCallback((enabled: boolean) => {
    // Désactiver le mode auto si on définit manuellement
    if (isAutoMode) {
      setIsAutoMode(false);
    }
    setDarkModeState(enabled);
  }, [isAutoMode]);

  const toggleAutoMode = useCallback(() => {
    setIsAutoMode(prev => !prev);
  }, []);

  const contextValue = {
    darkMode,
    toggleDarkMode,
    setDarkMode,
    systemPreference,
    isAutoMode,
    toggleAutoMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};