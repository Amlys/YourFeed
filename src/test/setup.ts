import '@testing-library/jest-dom';

// Setup global test environment
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock env variables for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_YOUTUBE_API_KEY: 'test-key',
    VITE_FIREBASE_API_KEY: 'test-firebase-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456',
    VITE_FIREBASE_APP_ID: 'test-app-id',
    VITE_FIREBASE_MEASUREMENT_ID: 'test-measurement-id',
  },
}); 