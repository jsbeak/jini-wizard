#!/bin/bash

# Animation Performance Test Runner
# This script runs the Playwright performance tests and generates a comprehensive report

echo "🎭 CMS Wizard Animation Performance Testing"
echo "=========================================="
echo ""

# Change to the wizard directory
cd /Users/andwise/cms-ai-project/case2/cms-wizard

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing test dependencies..."
    npm install
    npx playwright install chromium
    echo ""
fi

# Kill any existing Python servers on port 8888
echo "🔧 Cleaning up existing servers..."
lsof -ti:8888 | xargs kill -9 2>/dev/null || true

# Start the development server in the background
echo "🚀 Starting development server on port 8888..."
python3 -m http.server 8888 > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Run the performance tests
echo "🧪 Running animation performance tests..."
echo ""
npx playwright test animation-performance.spec.js --reporter=list,json

# Check test exit code
TEST_EXIT_CODE=$?

# Kill the server
kill $SERVER_PID 2>/dev/null || true

# Generate performance report
if [ -f "test-results/results.json" ]; then
    echo ""
    echo "📊 Generating performance analysis report..."
    node tests/e2e/analyze-performance.js
fi

# Open the HTML report if tests completed
if [ $TEST_EXIT_CODE -eq 0 ] && [ -f "test-results/performance-report.html" ]; then
    echo ""
    echo "✅ Tests completed successfully!"
    echo "📈 Opening performance report..."
    open test-results/performance-report.html 2>/dev/null || xdg-open test-results/performance-report.html 2>/dev/null || echo "Please open test-results/performance-report.html manually"
else
    echo ""
    echo "❌ Tests failed or report generation failed"
    echo "Check test-results/html/index.html for detailed test results"
fi

echo ""
echo "🏁 Performance testing complete!"