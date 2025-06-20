import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from 'lucide-react';

interface OptimizedImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  quality?: 'low' | 'medium' | 'high';
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  fallbackIcon,
  width,
  height,
  loading = 'lazy',
  quality = 'medium',
  onLoad,
  onError,
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const currentRef = imgRef.current;
    if (!currentRef) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observerRef.current.observe(currentRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading]);

  // Optimisation de l'URL d'image (simule différents formats/qualités)
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    if (!originalSrc) return '';

    // Pour YouTube thumbnails, on peut optimiser la qualité
    if (originalSrc.includes('youtube') || originalSrc.includes('googleusercontent')) {
      const qualityMap = {
        low: originalSrc.replace('maxresdefault', 'mqdefault').replace('hqdefault', 'mqdefault'),
        medium: originalSrc.replace('maxresdefault', 'hqdefault'),
        high: originalSrc,
      };
      return qualityMap[quality];
    }

    return originalSrc;
  }, [quality]);

  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setImageState('error');
    onError?.();
  }, [onError]);

  const shouldShowImage = src && isInView && imageState !== 'error';
  const optimizedSrc = shouldShowImage ? getOptimizedSrc(src) : '';

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
      ref={imgRef}
    >
      {/* Image avec lazy loading */}
      {shouldShowImage && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={loading}
          decoding="async"
          width={width}
          height={height}
        />
      )}

      {/* Skeleton loader */}
      {(imageState === 'loading' || !isInView) && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
        </div>
      )}

      {/* Fallback pour les erreurs */}
      {imageState === 'error' && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          {fallbackIcon || <User size={width && height ? Math.min(width, height) / 3 : 24} className="text-gray-400 dark:text-gray-500" />}
        </div>
      )}

      {/* Indicateur de chargement en cours */}
      {isInView && imageState === 'loading' && src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default OptimizedImage; 