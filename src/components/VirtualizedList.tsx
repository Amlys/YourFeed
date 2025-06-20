import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculer quels éléments sont visibles
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Items visibles avec overscan
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  // Hauteur totale de la liste
  const totalHeight = items.length * itemHeight;

  // Offset pour positionner les items visibles
  const offsetY = visibleRange.start * itemHeight;

  // Handler de scroll optimisé avec RAF
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const newScrollTop = element.scrollTop;
    
    // Utiliser requestAnimationFrame pour optimiser les performances
    requestAnimationFrame(() => {
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    });
  }, [onScroll]);

  // Scroll programmatique
  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const targetScrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    }
  }, [itemHeight]);

  // Scroll au top
  const scrollToTop = useCallback(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Container avec hauteur totale pour maintenir la scrollbar */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Items visibles */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, relativeIndex) => {
            const absoluteIndex = visibleRange.start + relativeIndex;
            return (
              <div
                key={absoluteIndex}
                style={{
                  height: itemHeight,
                  overflow: 'hidden',
                }}
              >
                {renderItem(item, absoluteIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook personnalisé pour utiliser la virtualisation facilement
export const useVirtualizedList = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return { start: startIndex, end: endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const scrollToIndex = useCallback((index: number) => {
    setScrollTop(index * itemHeight);
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    setScrollTop(0);
  }, []);

  return {
    visibleRange,
    scrollTop,
    setScrollTop,
    scrollToIndex,
    scrollToTop,
    totalHeight: items.length * itemHeight,
  };
};

// Composant Grid virtualisé pour les layouts en grille
interface VirtualizedGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  gap?: number;
}

export function VirtualizedGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  className = '',
  gap = 0,
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculer le nombre de colonnes
  const columnsCount = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowsCount = Math.ceil(items.length / columnsCount);
  const rowHeight = itemHeight + gap;

  // Calculer les lignes visibles
  const visibleRowStart = Math.floor(scrollTop / rowHeight);
  const visibleRowEnd = Math.min(
    visibleRowStart + Math.ceil(containerHeight / rowHeight) + 1,
    rowsCount - 1
  );

  // Items visibles
  const visibleItems = useMemo(() => {
    const startIndex = visibleRowStart * columnsCount;
    const endIndex = Math.min((visibleRowEnd + 1) * columnsCount - 1, items.length - 1);
    return items.slice(startIndex, endIndex + 1).map((item, relativeIndex) => ({
      item,
      absoluteIndex: startIndex + relativeIndex,
    }));
  }, [items, visibleRowStart, visibleRowEnd, columnsCount]);

  const totalHeight = rowsCount * rowHeight;
  const offsetY = visibleRowStart * rowHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    requestAnimationFrame(() => {
      setScrollTop(newScrollTop);
    });
  }, []);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columnsCount}, ${itemWidth}px)`,
            gap: `${gap}px`,
            justifyContent: 'space-evenly',
          }}
        >
          {visibleItems.map(({ item, absoluteIndex }) => (
            <div key={absoluteIndex}>
              {renderItem(item, absoluteIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualizedList; 