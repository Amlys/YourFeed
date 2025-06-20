// Types branded pour plus de sécurité
export type Brand<T, K> = T & { __brand: K };

// Types de base sécurisés
export type VideoId = Brand<string, 'VideoId'>;
export type ChannelId = Brand<string, 'ChannelId'>;
export type UserId = Brand<string, 'UserId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
export type ISO8601Date = Brand<string, 'ISO8601Date'>;
export type NonEmptyString = Brand<string, 'NonEmptyString'>;
export type URL = Brand<string, 'URL'>;
export type Seconds = Brand<number, 'Seconds'>;

// Types d'état
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type VideoStatus = 'a_voir' | 'deja_vu' | 'plus_tard';

// Helper pour créer des types branded
export const createBrandedString = <K>(value: string): Brand<string, K> => {
  return value as Brand<string, K>;
};

export const createBrandedNumber = <K>(value: number): Brand<number, K> => {
  return value as Brand<number, K>;
};

// Validation helpers
export const isNonEmptyString = (value: string): value is NonEmptyString => {
  return value.trim().length > 0;
};

export const isValidUrl = (value: string): value is URL => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const isValidISO8601 = (value: string): value is ISO8601Date => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString();
};

// Types d'erreur
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: ISO8601Date;
}

export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Helper pour créer des résultats
export const createSuccess = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

export const createError = <E = AppError>(error: E): Result<never, E> => ({
  success: false,
  error,
});

// Type pour les réponses API paginées
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
  nextPageToken?: string;
} 