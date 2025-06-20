import { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  fpsAverage: number;
  componentRenderCount: number;
  apiCallDuration: Record<string, number>;
}

interface PerformanceConfig {
  trackFPS?: boolean;
  trackMemory?: boolean;
  trackRenderTime?: boolean;
  maxApiCalls?: number;
  logInterval?: number;
}

export const usePerformanceMonitor = (
  componentName: string,
  config: PerformanceConfig = {}
) => {
  const {
    trackFPS = true,
    trackMemory = true,
    trackRenderTime = true,
    maxApiCalls = 10,
    logInterval = 5000,
  } = config;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fpsAverage: 60,
    componentRenderCount: 0,
    apiCallDuration: {},
  });

  const renderCountRef = useRef(0);
  const renderTimeRef = useRef(0);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0, fps: [] as number[], avgFps: 60 });
  const apiCallsRef = useRef<Record<string, number[]>>({});
  const rafIdRef = useRef<number>();

  // Mesure du temps de rendu
  const measureRenderTime = useCallback(() => {
    if (!trackRenderTime) return { start: () => {}, end: () => {} };

    let startTime = 0;
    return {
      start: () => {
        startTime = performance.now();
      },
      end: () => {
        const endTime = performance.now();
        renderTimeRef.current = endTime - startTime;
        renderCountRef.current += 1;

        // Ne pas mettre à jour l'état à chaque render pour éviter les boucles
        // Les métriques seront mises à jour via l'intervalle périodique

        // Log si le rendu est lent
        if (renderTimeRef.current > 16) { // Plus de 16ms = < 60fps
          console.warn(
            `[Performance] Slow render detected in ${componentName}: ${renderTimeRef.current.toFixed(2)}ms`
          );
        }
      },
    };
  }, [componentName, trackRenderTime]);

  // FPS Counter
  const measureFPS = useCallback(() => {
    if (!trackFPS) return;

    const measure = () => {
      const now = performance.now();
      const counter = fpsCounterRef.current;
      
      counter.frames++;
      
      if (now >= counter.lastTime + 1000) {
        const fps = Math.round((counter.frames * 1000) / (now - counter.lastTime));
        counter.fps.push(fps);
        
        // Garder seulement les 10 dernières mesures
        if (counter.fps.length > 10) {
          counter.fps.shift();
        }
        
        const avgFps = counter.fps.reduce((a, b) => a + b, 0) / counter.fps.length;
        
        // Stocker dans une ref pour éviter les re-renders excessifs
        fpsCounterRef.current.avgFps = Math.round(avgFps);

        // Reset
        counter.frames = 0;
        counter.lastTime = now;
      }
      
      rafIdRef.current = requestAnimationFrame(measure);
    };

    rafIdRef.current = requestAnimationFrame(measure);
  }, [trackFPS]);

  // Variable pour stocker l'usage mémoire actuel
  const memoryUsageRef = useRef(0);

  // Mesure de la mémoire
  const measureMemory = useCallback(() => {
    if (!trackMemory || !(performance as any).memory) return;

    const memory = (performance as any).memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    
    // Stocker dans une ref pour éviter les re-renders excessifs
    memoryUsageRef.current = usedMB;

    // Alerte si la mémoire dépasse 100MB
    if (usedMB > 100) {
      console.warn(`[Performance] High memory usage in ${componentName}: ${usedMB}MB`);
    }
  }, [componentName, trackMemory]);

  // Mesure des appels API
  const measureApiCall = useCallback((apiName: string) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        
        // Stocker les durées d'appels API
        if (!apiCallsRef.current[apiName]) {
          apiCallsRef.current[apiName] = [];
        }
        
        apiCallsRef.current[apiName].push(duration);
        
        // Garder seulement les N derniers appels
        if (apiCallsRef.current[apiName].length > maxApiCalls) {
          apiCallsRef.current[apiName].shift();
        }
        
        // La mise à jour des métriques d'API se fera via l'intervalle périodique

        // Log des appels API lents
        if (duration > 2000) {
          console.warn(
            `[Performance] Slow API call ${apiName} in ${componentName}: ${duration.toFixed(2)}ms`
          );
        }
      },
    };
  }, [componentName, maxApiCalls]);

  // Hook principal pour mesurer les renders
  useEffect(() => {
    const timer = measureRenderTime();
    timer.start();
    
    return () => {
      timer.end();
    };
  }, []); // Tableau de dépendances vide pour éviter la boucle infinie

  // Démarrer les mesures
  useEffect(() => {
    measureFPS();
    measureMemory();

    // Mesure périodique de la mémoire
    const memoryInterval = setInterval(measureMemory, logInterval);

    // Mise à jour périodique des métriques pour éviter les re-renders excessifs
    const metricsUpdateInterval = setInterval(() => {
      // Calculer les moyennes des appels API
      const apiDurations: Record<string, number> = {};
      Object.entries(apiCallsRef.current).forEach(([apiName, calls]) => {
        if (calls.length > 0) {
          const avgDuration = calls.reduce((a, b) => a + b, 0) / calls.length;
          apiDurations[apiName] = Math.round(avgDuration);
        }
      });

      setMetrics(prev => ({
        ...prev,
        renderTime: renderTimeRef.current,
        memoryUsage: memoryUsageRef.current,
        fpsAverage: fpsCounterRef.current.avgFps || 60,
        componentRenderCount: renderCountRef.current,
        apiCallDuration: apiDurations,
      }));
    }, 1000); // Mise à jour toutes les secondes

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      clearInterval(memoryInterval);
      clearInterval(metricsUpdateInterval);
    };
  }, [measureFPS, measureMemory, logInterval]);

  // Log périodique des métriques
  useEffect(() => {
    const interval = setInterval(() => {
      console.info(`[Performance] ${componentName} metrics:`, {
        renders: renderCountRef.current,
        avgRenderTime: `${renderTimeRef.current.toFixed(2)}ms`,
        fps: metrics.fpsAverage,
        memory: `${metrics.memoryUsage}MB`,
        apiCalls: metrics.apiCallDuration,
      });
    }, logInterval);

    return () => clearInterval(interval);
  }, [componentName, metrics, logInterval]);

  // Utilities pour l'optimisation
  const shouldOptimize = useCallback(() => {
    return (
      metrics.fpsAverage < 50 ||
      metrics.renderTime > 16 ||
      (metrics.memoryUsage && metrics.memoryUsage > 100)
    );
  }, [metrics]);

  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];
    
    if (metrics.fpsAverage < 50) {
      suggestions.push('Consider using React.memo or useMemo for expensive calculations');
    }
    
    if (metrics.renderTime > 16) {
      suggestions.push('Break down large components into smaller ones');
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > 100) {
      suggestions.push('Check for memory leaks or consider virtualization for large lists');
    }
    
    Object.entries(metrics.apiCallDuration).forEach(([apiName, duration]) => {
      if (duration > 1000) {
        suggestions.push(`Optimize ${apiName} API call or implement caching`);
      }
    });
    
    return suggestions;
  }, [metrics]);

  // Reset des métriques
  const resetMetrics = useCallback(() => {
    renderCountRef.current = 0;
    renderTimeRef.current = 0;
    memoryUsageRef.current = 0;
    fpsCounterRef.current = { frames: 0, lastTime: performance.now(), fps: [], avgFps: 60 };
    apiCallsRef.current = {};
    
    setMetrics({
      renderTime: 0,
      memoryUsage: 0,
      fpsAverage: 60,
      componentRenderCount: 0,
      apiCallDuration: {},
    });
  }, []);

  return {
    metrics,
    measureApiCall,
    shouldOptimize,
    getOptimizationSuggestions,
    resetMetrics,
  };
};

// Hook pour mesurer les performances d'une fonction spécifique
export const usePerformanceTracker = () => {
  const trackFunction = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    functionName: string
  ): T => {
    return ((...args: any[]) => {
      const startTime = performance.now();
      const result = fn(...args);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      if (duration > 10) {
        console.warn(
          `[Performance] Function ${functionName} took ${duration.toFixed(2)}ms to execute`
        );
      }
      
      return result;
    }) as T;
  }, []);

  const trackAsyncFunction = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    functionName: string
  ): T => {
    return (async (...args: any[]) => {
      const startTime = performance.now();
      const result = await fn(...args);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      if (duration > 100) {
        console.warn(
          `[Performance] Async function ${functionName} took ${duration.toFixed(2)}ms to execute`
        );
      }
      
      return result;
    }) as T;
  }, []);

  return {
    trackFunction,
    trackAsyncFunction,
  };
}; 