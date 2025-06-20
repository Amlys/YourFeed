/**
 * Extrait le prénom de l'utilisateur depuis le displayName ou l'email
 * @param displayName - Le nom complet de l'utilisateur (ex: "John Doe")
 * @param email - L'email de l'utilisateur (ex: "john.doe@gmail.com")
 * @returns Le prénom uniquement
 */
export const extractFirstName = (displayName?: string | null, email?: string | null): string => {
  // Si displayName existe, extraire le premier mot (prénom)
  if (displayName && displayName.trim()) {
    const firstName = displayName.trim().split(' ')[0];
    if (firstName) {
      return firstName;
    }
  }
  
  // Sinon, extraire le prénom depuis l'email (partie avant le @)
  if (email) {
    const emailPart = email.split('@')[0];
    // Si l'email contient des points, prendre la première partie
    const firstName = emailPart.split('.')[0];
    if (firstName) {
      // Capitaliser la première lettre
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
  }
  
  // Valeur par défaut
  return 'Utilisateur';
}; 