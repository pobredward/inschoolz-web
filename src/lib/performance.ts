// 성능 측정 유틸리티

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 성능 측정 시작
  startMeasure(name: string): void {
    if (typeof performance !== 'undefined') {
      this.metrics.set(name, performance.now());
    }
  }

  // 성능 측정 종료 및 결과 반환
  endMeasure(name: string): number {
    if (typeof performance !== 'undefined') {
      const startTime = this.metrics.get(name);
      if (startTime !== undefined) {
        const duration = performance.now() - startTime;
        this.metrics.delete(name);
        return duration;
      }
    }
    return 0;
  }

  // 함수 실행 시간 측정
  measureFunction<T>(name: string, fn: () => T): T {
    this.startMeasure(name);
    const result = fn();
    const duration = this.endMeasure(name);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  // 비동기 함수 실행 시간 측정
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    const result = await fn();
    const duration = this.endMeasure(name);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }
}

// 전역 인스턴스
export const performanceMonitor = PerformanceMonitor.getInstance();

// Web Vitals 측정 (브라우저에서만)
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  // LCP 측정
  if ('PerformanceObserver' in window) {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        console.log('🎯 LCP:', Math.round(lastEntry.startTime), 'ms');
      }
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP measurement not supported');
    }

    // FID 측정
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('⚡ FID:', Math.round(entry.processingStart - entry.startTime), 'ms');
      });
    });
    
    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID measurement not supported');
    }
  }

  // 페이지 로드 시간 측정
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      console.log('📊 Page Load Metrics:');
      console.log('- TTFB:', Math.round(navigation.responseStart - navigation.requestStart), 'ms');
      console.log('- DOM Load:', Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart), 'ms');
      console.log('- Full Load:', Math.round(navigation.loadEventEnd - navigation.navigationStart), 'ms');
    }
  });
};

// 디바운스된 스크롤 성능 측정
export const measureScrollPerformance = () => {
  if (typeof window === 'undefined') return;

  let scrollCount = 0;
  let lastScrollTime = performance.now();
  
  const handleScroll = () => {
    scrollCount++;
    const now = performance.now();
    const timeSinceLastScroll = now - lastScrollTime;
    
    if (timeSinceLastScroll > 1000) { // 1초마다 로그
      const fps = Math.round(1000 / (timeSinceLastScroll / scrollCount));
      console.log(`🏃 Scroll Performance: ${fps} events/sec`);
      scrollCount = 0;
      lastScrollTime = now;
    }
  };

  let ticking = false;
  const optimizedScrollHandler = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
};