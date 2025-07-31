// Playwright Test Configuration
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: false, // Run tests sequentially for performance accuracy
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for performance testing
  
  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8888',
    
    // Collect trace for debugging
    trace: 'off',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'off',
    
    // Viewport size
    viewport: { width: 1920, height: 1080 },
    
    // Timeout for actions
    actionTimeout: 10000,
    
    // Browser context options
    contextOptions: {
      // Reduce motion for consistent testing
      reducedMotion: 'no-preference'
    }
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          args: [
            '--enable-gpu-rasterization',
            '--enable-zero-copy',
            '--enable-accelerated-2d-canvas',
            '--disable-web-security', // For iframe testing
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        }
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'cd /Users/andwise/cms-ai-project/case2/cms-wizard && python3 -m http.server 8888',
    port: 8888,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});