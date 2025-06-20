import { lazy, Suspense } from 'react';
import React from 'react';

// Lazy loading des composants avec fallbacks optimisés
export const LazyVideoFeed = lazy(() => 
  import('./VideoFeed').then(module => ({ default: module.default }))
);

export const LazySearchBar = lazy(() => 
  import('./SearchBar').then(module => ({ default: module.default }))
);

export const LazyFavoritesList = lazy(() => 
  import('./FavoritesList').then(module => ({ default: module.default }))
);

export const LazyHomePage = lazy(() => 
  import('../pages/HomePage').then(module => ({ default: module.default }))
);

// Composants de fallback optimisés
export const VideoFeedSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex space-x-2">
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-18 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-300 dark:bg-gray-600"></div>
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SearchBarSkeleton: React.FC = () => (
  <div className="flex animate-pulse">
    <div className="flex-grow">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-l-md"></div>
    </div>
    <div className="h-10 w-24 bg-gray-300 dark:bg-gray-600 rounded-r-md"></div>
  </div>
);

export const FavoritesListSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
    </div>
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 flex items-center space-x-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const HomePageSkeleton: React.FC = () => (
  <div className="flex flex-col space-y-6 animate-pulse">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-6"></div>
      <SearchBarSkeleton />
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <FavoritesListSkeleton />
      </div>
      <div className="lg:col-span-3">
        <VideoFeedSkeleton />
      </div>
    </div>
  </div>
);

// HOC pour wrapper les lazy components avec Suspense
export const withLazyLoading = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  FallbackComponent: React.ComponentType,
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const [hasError, setHasError] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
      setHasError(false);
      setError(null);
    }, []);

    if (hasError && error && errorFallback) {
      const ErrorFallback = errorFallback;
      return <ErrorFallback error={error} retry={resetError} />;
    }

    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent
          {...props}
          ref={ref}
          onError={(err: Error) => {
            setError(err);
            setHasError(true);
          }}
        />
      </Suspense>
    );
  });
};

// Composants lazy prêts à l'emploi
export const VideoFeedWithSuspense = withLazyLoading(
  LazyVideoFeed,
  VideoFeedSkeleton
);

export const SearchBarWithSuspense = withLazyLoading(
  LazySearchBar,
  SearchBarSkeleton
);

export const FavoritesListWithSuspense = withLazyLoading(
  LazyFavoritesList,
  FavoritesListSkeleton
);

export const HomePageWithSuspense = withLazyLoading(
  LazyHomePage,
  HomePageSkeleton
);

// Hook pour preload les composants en arrière-plan
export const usePreloadComponents = () => {
  React.useEffect(() => {
    // Preload des composants après le chargement initial
    const timer = setTimeout(() => {
      void LazyVideoFeed;
      void LazySearchBar;
      void LazyFavoritesList;
      void LazyHomePage;
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
};

// Error Boundary spécialisé pour les lazy components
export class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LazyComponent] Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent />;
      }

      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-200 font-medium mb-2">
            Component Loading Error
          </h3>
          <p className="text-red-600 dark:text-red-300 text-sm mb-3">
            {this.state.error?.message || 'Failed to load component'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 