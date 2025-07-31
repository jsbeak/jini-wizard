// Performance Utilities
class PerformanceUtils {
    constructor() {
        this.observers = new Map();
        this.timers = new Map();
        this.isSupported = this.checkSupport();
    }
    
    checkSupport() {
        return {
            intersectionObserver: 'IntersectionObserver' in window,
            performanceObserver: 'PerformanceObserver' in window,
            requestIdleCallback: 'requestIdleCallback' in window,
            webAnimations: 'animate' in document.createElement('div')
        };
    }
    
    // Debounce function for performance-heavy operations
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }
    
    // Throttle function for scroll/resize events
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // RAF-based animation helper
    animate(element, keyframes, options = {}) {
        if (!element || !this.isSupported.webAnimations) {
            return Promise.resolve();
        }
        
        const animation = element.animate(keyframes, {
            duration: 300,
            easing: 'ease',
            fill: 'forwards',
            ...options
        });
        
        return animation.finished;
    }
    
    // Lazy loading with Intersection Observer
    observeVisibility(elements, callback, options = {}) {
        if (!this.isSupported.intersectionObserver) {
            // Fallback for browsers without IO support
            elements.forEach(callback);
            return;
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px',
            ...options
        });
        
        elements.forEach(el => observer.observe(el));
        this.observers.set('visibility', observer);
    }
    
    // Performance monitoring
    startPerformanceTimer(label) {
        if (this.isSupported.performanceObserver) {
            performance.mark(`${label}-start`);
        }
        this.timers.set(label, Date.now());
    }
    
    endPerformanceTimer(label) {
        const startTime = this.timers.get(label);
        if (!startTime) return;
        
        const duration = Date.now() - startTime;
        
        if (this.isSupported.performanceObserver) {
            performance.mark(`${label}-end`);
            performance.measure(label, `${label}-start`, `${label}-end`);
        }
        
        console.log(`⏱️ ${label}: ${duration}ms`);
        this.timers.delete(label);
        
        return duration;
    }
    
    // Memory usage monitoring
    getMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            return {
                used: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100,
                total: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100,
                limit: Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100
            };
        }
        return null;
    }
    
    // Log memory usage
    logMemoryUsage(label = 'Memory Usage') {
        const memory = this.getMemoryUsage();
        if (memory) {
            console.log(`📊 ${label}:`, {
                used: `${memory.used} MB`,
                total: `${memory.total} MB`,
                limit: `${memory.limit} MB`,
                utilization: `${Math.round((memory.used / memory.limit) * 100)}%`
            });
        }
    }
    
    // Idle callback wrapper
    runWhenIdle(callback, timeout = 5000) {
        if (this.isSupported.requestIdleCallback) {
            requestIdleCallback(callback, { timeout });
        } else {
            setTimeout(callback, 1);
        }
    }
    
    // Batch DOM operations
    batchDOMOperations(operations) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                operations.forEach(op => op());
                resolve();
            });
        });
    }
    
    // Preload critical resources
    preloadResource(url, type = 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = type;
        document.head.appendChild(link);
    }
    
    // Check if element is in viewport
    isInViewport(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.bottom >= threshold &&
            rect.right >= threshold &&
            rect.top <= viewHeight - threshold &&
            rect.left <= viewWidth - threshold
        );
    }
    
    // Optimize scroll performance
    optimizeScroll(element, callback) {
        let ticking = false;
        
        const scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    callback();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        element.addEventListener('scroll', scrollHandler, { passive: true });
        
        return () => {
            element.removeEventListener('scroll', scrollHandler);
        };
    }
    
    // Clean up all observers and timers
    cleanup() {
        this.observers.forEach(observer => {
            if (observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers.clear();
        
        this.timers.clear();
    }
}

// Create global instance
window.performanceUtils = new PerformanceUtils();

// Performance monitoring setup
if (window.performanceUtils.isSupported.performanceObserver) {
    try {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.entryType === 'measure') {
                    console.log(`📈 Performance Measure: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                }
            });
        });
        
        observer.observe({ entryTypes: ['measure'] });
    } catch (e) {
        console.warn('Performance observer setup failed:', e);
    }
}

// Monitor long tasks
if ('PerformanceObserver' in window) {
    try {
        const longTaskObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                console.warn(`⚠️ Long Task detected: ${entry.duration.toFixed(2)}ms`);
            });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
        console.warn('Long task observer setup failed:', e);
    }
}