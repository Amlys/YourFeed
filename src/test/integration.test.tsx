import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AppProvider } from '../contexts/AppProvider';
import { ThemeProvider } from '../context/ThemeContext';
import SearchBar from '../components/SearchBar';
import HomePage from '../pages/HomePage';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock Firebase avec des implementations complètes
vi.mock('../firebaseConfig', () => ({
  auth: {
    onAuthStateChanged: vi.fn((callback) => {
      // Simulate immediate call with no user
      setTimeout(() => callback(null), 0);
      return vi.fn(); // Return unsubscribe function
    }),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    setTimeout(() => callback(null), 0);
    return vi.fn();
  }),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class GoogleAuthProvider {},
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
}));

// Mock YouTube API
global.fetch = vi.fn();

const TestApp: React.FC = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AppProvider>
        <HomePage />
      </AppProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Integration Tests - Complete Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful YouTube API responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          id: { channelId: 'test-channel' },
          snippet: {
            title: 'Test Channel',
            description: 'Test Description',
            thumbnails: { high: { url: 'test-thumbnail.jpg' } }
          }
        }]
      }),
    });
  });

  it('should render HomePage without crashing', async () => {
    console.log('Testing HomePage rendering...');
    
    const { container } = render(<TestApp />);
    
    // Wait for auth loading to complete
    await waitFor(() => {
      expect(screen.getByText(/YourFeed/)).toBeInTheDocument();
    }, { timeout: 2000 });

    console.log('HomePage rendered successfully');
    expect(container).toBeTruthy();
  });

  it('should handle search functionality', async () => {
    console.log('Testing search functionality...');
    
    render(<TestApp />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/YourFeed/)).toBeInTheDocument();
    });

    // Find search input
    const searchInput = screen.getByPlaceholderText(/Rechercher une chaîne YouTube/);
    expect(searchInput).toBeInTheDocument();

    // Try to search
    fireEvent.change(searchInput, { target: { value: 'test channel' } });
    
    const searchButton = screen.getByText(/Rechercher/);
    fireEvent.click(searchButton);

    console.log('Search initiated successfully');
  });

  it('should show appropriate message when not logged in', async () => {
    console.log('Testing not logged in state...');
    
    render(<TestApp />);
    
    await waitFor(() => {
      expect(screen.getByText(/Please sign in to see your personalized feed/)).toBeInTheDocument();
    }, { timeout: 2000 });

    console.log('Not logged in message shown correctly');
  });

  it('should show no favorites message when logged in but no favorites', async () => {
    console.log('Testing logged in but no favorites state...');
    
    // Mock logged in user
    vi.mocked(require('../firebaseConfig').auth.onAuthStateChanged).mockImplementation((callback: any) => {
      setTimeout(() => callback({ uid: 'test-user', email: 'test@test.com' }), 0);
      return vi.fn();
    });
    
    render(<TestApp />);
    
    await waitFor(() => {
      expect(screen.getByText(/No favorites yet/)).toBeInTheDocument();
    }, { timeout: 2000 });

    console.log('No favorites message shown correctly');
  });
}); 