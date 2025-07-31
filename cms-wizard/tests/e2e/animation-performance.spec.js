// Animation Performance E2E Tests
// Tests focus on measuring animation performance metrics and visual smoothness

const { test, expect } = require('@playwright/test');

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  FPS: 55, // Minimum acceptable FPS (target 60)
  ANIMATION_DURATION: 1000, // Maximum animation duration in ms
  PAGE_TRANSITION: 800, // Maximum page transition time
  SKELETON_LOAD: 500, // Maximum skeleton screen display time
  CONTENT_STAGGER: 100, // Maximum delay between staggered items
  CLICK_FEEDBACK: 200, // Maximum click feedback duration
};

// Helper to measure FPS during animation
async function measureFPS(page, duration = 1000) {
  return await page.evaluate((duration) => {
    return new Promise(resolve => {
      let frames = 0;
      let lastTime = performance.now();
      const startTime = lastTime;
      
      function countFrame() {
        frames++;
        const currentTime = performance.now();
        
        if (currentTime - startTime < duration) {
          requestAnimationFrame(countFrame);
        } else {
          const fps = (frames * 1000) / (currentTime - startTime);
          resolve(fps);
        }
      }
      
      requestAnimationFrame(countFrame);
    });
  }, duration);
}

// Helper to measure animation smoothness
async function measureAnimationSmoothness(page, selector, propertyName) {
  return await page.evaluate(({ selector, propertyName }) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    
    const values = [];
    const startTime = performance.now();
    
    return new Promise(resolve => {
      function recordValue() {
        const computedStyle = window.getComputedStyle(element);
        const value = computedStyle[propertyName];
        const time = performance.now() - startTime;
        
        values.push({ time, value });
        
        if (time < 1000) {
          requestAnimationFrame(recordValue);
        } else {
          // Calculate jank by checking for irregular intervals
          let jankCount = 0;
          for (let i = 1; i < values.length; i++) {
            const interval = values[i].time - values[i-1].time;
            if (interval > 20) { // More than 20ms between frames indicates jank
              jankCount++;
            }
          }
          
          resolve({
            frameCount: values.length,
            jankFrames: jankCount,
            smoothness: ((values.length - jankCount) / values.length) * 100
          });
        }
      }
      
      requestAnimationFrame(recordValue);
    });
  }, { selector, propertyName });
}

test.describe('Animation Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start local server and navigate to the app
    await page.goto('http://localhost:8888');
    
    // Wait for app initialization
    await page.waitForSelector('.intro-screen.active', { timeout: 5000 });
  });

  test('Intro animation performance', async ({ page }) => {
    console.log('🎬 Testing intro animation performance...');
    
    // Measure FPS during intro animation
    const fps = await measureFPS(page, 3000);
    console.log(`  ✓ Intro animation FPS: ${fps.toFixed(2)}`);
    expect(fps).toBeGreaterThan(PERFORMANCE_THRESHOLDS.FPS);
    
    // Measure logo float animation smoothness
    const logoSmoothness = await measureAnimationSmoothness(
      page, 
      '.logo-container', 
      'transform'
    );
    console.log(`  ✓ Logo animation smoothness: ${logoSmoothness.smoothness.toFixed(2)}%`);
    expect(logoSmoothness.smoothness).toBeGreaterThan(90);
    
    // Wait for main interface
    await page.waitForSelector('.main-interface.active', { timeout: 5000 });
  });

  test('Click feedback animations', async ({ page }) => {
    console.log('🖱️ Testing click feedback animations...');
    
    // Skip intro
    await page.waitForSelector('.main-interface.active', { timeout: 5000 });
    
    // Test various button click feedbacks
    const buttons = [
      { selector: '#btn-help', name: 'Help button' },
      { selector: '#btn-settings', name: 'Settings button' },
      { selector: '.zoom-btn[data-zoom="50"]', name: 'Zoom 50% button' }
    ];
    
    for (const button of buttons) {
      const startTime = Date.now();
      
      // Click and measure animation
      await page.click(button.selector);
      
      // Check if animation class is applied
      const hasAnimation = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        return el && el.classList.contains('animate-buttonPress');
      }, button.selector);
      
      expect(hasAnimation).toBeTruthy();
      
      // Verify animation completes within threshold
      await page.waitForTimeout(PERFORMANCE_THRESHOLDS.CLICK_FEEDBACK);
      
      const duration = Date.now() - startTime;
      console.log(`  ✓ ${button.name} feedback: ${duration}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CLICK_FEEDBACK + 50);
    }
  });

  test('Loading message and progress bars animation', async ({ page }) => {
    console.log('📊 Testing loading animations...');
    
    // Skip to main interface
    await page.waitForSelector('.main-interface.active', { timeout: 5000 });
    
    // Wait for first page processing to start
    await page.waitForSelector('.menu-item[data-status="processing"]', { timeout: 10000 });
    
    // Check if loading message is visible
    const loadingVisible = await page.isVisible('#loading-message');
    expect(loadingVisible).toBeTruthy();
    
    // Measure multi-progress bar animation performance
    const progressFPS = await page.evaluate(() => {
      const bars = document.querySelectorAll('.multi-progress-fill');
      if (bars.length === 0) return 0;
      
      return new Promise(resolve => {
        let frames = 0;
        const startTime = performance.now();
        
        function measureFrame() {
          frames++;
          const elapsed = performance.now() - startTime;
          
          if (elapsed < 2000) { // Measure for 2 seconds
            requestAnimationFrame(measureFrame);
          } else {
            resolve((frames * 1000) / elapsed);
          }
        }
        
        requestAnimationFrame(measureFrame);
      });
    });
    
    console.log(`  ✓ Progress bars FPS: ${progressFPS.toFixed(2)}`);
    expect(progressFPS).toBeGreaterThan(PERFORMANCE_THRESHOLDS.FPS);
  });

  test('Skeleton screen performance', async ({ page }) => {
    console.log('💀 Testing skeleton screen performance...');
    
    // Skip to main interface
    await page.waitForSelector('.main-interface.active', { timeout: 5000 });
    
    // Monitor skeleton screen display by checking iframe content
    const skeletonTiming = await page.evaluate(() => {
      return new Promise(resolve => {
        const iframe = document.getElementById('preview-iframe');
        const startTime = performance.now();
        let skeletonDetected = false;
        let skeletonEndTime = 0;
        
        const checkContent = () => {
          try {
            const iframeDoc = iframe.contentDocument;
            if (iframeDoc && iframeDoc.querySelector('.skeleton-screen')) {
              if (!skeletonDetected) {
                skeletonDetected = true;
              }
            } else if (skeletonDetected && !skeletonEndTime) {
              skeletonEndTime = performance.now();
              resolve({
                displayed: true,
                duration: skeletonEndTime - startTime
              });
              return;
            }
          } catch (e) {
            // Cross-origin or loading
          }
          
          if (performance.now() - startTime < 5000) {
            requestAnimationFrame(checkContent);
          } else {
            resolve({
              displayed: skeletonDetected,
              duration: skeletonEndTime ? skeletonEndTime - startTime : 0
            });
          }
        };
        
        requestAnimationFrame(checkContent);
      });
    });
    
    if (skeletonTiming.displayed) {
      console.log(`  ✓ Skeleton screen duration: ${skeletonTiming.duration.toFixed(0)}ms`);
      expect(skeletonTiming.duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SKELETON_LOAD);
    }
  });

  test('Page transition animations', async ({ page }) => {
    console.log('🔄 Testing page transition animations...');
    
    // Skip to main interface
    await page.waitForSelector('.main-interface.active', { timeout: 5000 });
    
    // Wait for at least 2 page transitions
    let transitionCount = 0;
    const transitionTimings = [];
    
    await page.evaluate(() => {
      return new Promise(resolve => {
        const browserContent = document.querySelector('.browser-content');
        let transitionStart = 0;
        
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.target.classList.contains('page-transition-out')) {
              transitionStart = performance.now();
            } else if (mutation.target.classList.contains('page-transition-in') && transitionStart) {
              const duration = performance.now() - transitionStart;
              window.transitionTimings = window.transitionTimings || [];
              window.transitionTimings.push(duration);
              transitionStart = 0;
            }
          });
        });
        
        observer.observe(browserContent, {
          attributes: true,
          attributeFilter: ['class']
        });
        
        // Wait for transitions
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 10000);
      });
    });
    
    // Get recorded timings
    const timings = await page.evaluate(() => window.transitionTimings || []);
    
    if (timings.length > 0) {
      const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
      console.log(`  ✓ Average page transition: ${avgTiming.toFixed(0)}ms`);
      console.log(`  ✓ Transitions measured: ${timings.length}`);
      expect(avgTiming).toBeLessThan(PERFORMANCE_THRESHOLDS.PAGE_TRANSITION);
    }
  });

  test('Staggered content animations', async ({ page }) => {
    console.log('📝 Testing staggered content animations...');
    
    // Skip to main interface and wait for content generation
    await page.waitForSelector('.main-interface.active', { timeout: 5000 });
    await page.waitForTimeout(5000); // Wait for some content to be generated
    
    // Measure stagger timing in iframe content
    const staggerMetrics = await page.evaluate(() => {
      const iframe = document.getElementById('preview-iframe');
      const iframeDoc = iframe.contentDocument;
      
      if (!iframeDoc) return null;
      
      const elements = iframeDoc.querySelectorAll('.content p, .card');
      const timings = [];
      
      elements.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        const delay = parseFloat(style.transitionDelay || '0') * 1000;
        const duration = parseFloat(style.transitionDuration || '0') * 1000;
        
        timings.push({
          index,
          delay,
          duration,
          total: delay + duration
        });
      });
      
      return {
        elementCount: elements.length,
        averageDelay: timings.reduce((sum, t) => sum + t.delay, 0) / timings.length,
        maxTotalTime: Math.max(...timings.map(t => t.total))
      };
    });
    
    if (staggerMetrics && staggerMetrics.elementCount > 0) {
      console.log(`  ✓ Staggered elements: ${staggerMetrics.elementCount}`);
      console.log(`  ✓ Average stagger delay: ${staggerMetrics.averageDelay.toFixed(0)}ms`);
      console.log(`  ✓ Max animation time: ${staggerMetrics.maxTotalTime.toFixed(0)}ms`);
      
      expect(staggerMetrics.maxTotalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.ANIMATION_DURATION);
    }
  });

  test('Overall animation performance metrics', async ({ page }) => {
    console.log('📈 Collecting overall performance metrics...');
    
    // Skip to main interface
    await page.waitForSelector('.main-interface.active', { timeout: 5000 });
    
    // Collect performance metrics over 10 seconds
    const metrics = await page.evaluate(() => {
      return new Promise(resolve => {
        const startTime = performance.now();
        const samples = [];
        
        function collectSample() {
          const navTiming = performance.getEntriesByType('navigation')[0];
          const paintTiming = performance.getEntriesByName('first-contentful-paint')[0];
          
          samples.push({
            timestamp: performance.now() - startTime,
            memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
            layoutCount: performance.getEntriesByType('layout')?.length || 0
          });
          
          if (performance.now() - startTime < 10000) {
            setTimeout(collectSample, 1000);
          } else {
            resolve({
              samples,
              navigation: navTiming,
              fcp: paintTiming?.startTime || 0
            });
          }
        }
        
        collectSample();
      });
    });
    
    // Calculate average memory usage
    const avgMemory = metrics.samples.reduce((sum, s) => sum + s.memory, 0) / metrics.samples.length;
    console.log(`  ✓ Average memory usage: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  ✓ First Contentful Paint: ${metrics.fcp.toFixed(0)}ms`);
    
    // Performance should be acceptable
    expect(metrics.fcp).toBeLessThan(3000); // FCP under 3 seconds
    expect(avgMemory).toBeLessThan(100 * 1024 * 1024); // Under 100MB
  });
});

// Test configuration for performance monitoring
test.use({
  video: 'off',
  trace: 'off',
  viewport: { width: 1920, height: 1080 },
  
  // Performance-specific settings
  launchOptions: {
    args: [
      '--enable-gpu-rasterization',
      '--enable-zero-copy',
      '--enable-accelerated-2d-canvas'
    ]
  }
});