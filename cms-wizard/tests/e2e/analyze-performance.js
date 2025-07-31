// Performance Analysis Script
// Analyzes test results and generates performance report

const fs = require('fs');
const path = require('path');

// Performance benchmarks
const BENCHMARKS = {
  EXCELLENT: { fps: 60, smoothness: 95, duration: 500 },
  GOOD: { fps: 55, smoothness: 90, duration: 800 },
  ACCEPTABLE: { fps: 50, smoothness: 85, duration: 1000 },
  POOR: { fps: 45, smoothness: 80, duration: 1500 }
};

// Read test results
function readResults() {
  try {
    const resultsPath = path.join(__dirname, '../../test-results/results.json');
    if (fs.existsSync(resultsPath)) {
      return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading results:', error);
  }
  return null;
}

// Extract performance metrics from console logs
function extractMetrics(test) {
  const metrics = {
    name: test.title,
    status: test.status,
    duration: test.duration,
    fps: [],
    smoothness: [],
    timings: []
  };

  // Parse stdout for metrics
  if (test.stdout) {
    test.stdout.forEach(line => {
      // FPS metrics
      const fpsMatch = line.match(/FPS: ([\d.]+)/);
      if (fpsMatch) {
        metrics.fps.push(parseFloat(fpsMatch[1]));
      }

      // Smoothness metrics
      const smoothnessMatch = line.match(/smoothness: ([\d.]+)%/);
      if (smoothnessMatch) {
        metrics.smoothness.push(parseFloat(smoothnessMatch[1]));
      }

      // Timing metrics
      const timingMatch = line.match(/([\w\s]+): (\d+)ms/);
      if (timingMatch) {
        metrics.timings.push({
          name: timingMatch[1],
          value: parseInt(timingMatch[2])
        });
      }
    });
  }

  return metrics;
}

// Generate performance grade
function getGrade(value, type) {
  const thresholds = {
    fps: { A: 60, B: 55, C: 50, D: 45 },
    smoothness: { A: 95, B: 90, C: 85, D: 80 },
    duration: { A: 500, B: 800, C: 1000, D: 1500 }
  };

  const threshold = thresholds[type];
  if (!threshold) return 'N/A';

  if (type === 'duration') {
    // Lower is better for duration
    if (value <= threshold.A) return 'A';
    if (value <= threshold.B) return 'B';
    if (value <= threshold.C) return 'C';
    if (value <= threshold.D) return 'D';
    return 'F';
  } else {
    // Higher is better for fps and smoothness
    if (value >= threshold.A) return 'A';
    if (value >= threshold.B) return 'B';
    if (value >= threshold.C) return 'C';
    if (value >= threshold.D) return 'D';
    return 'F';
  }
}

// Generate HTML report
function generateHTMLReport(metrics) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Animation Performance Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #6366F1;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .metric-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e5e7eb;
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .metric-label {
            color: #6b7280;
            font-size: 0.9em;
        }
        
        .grade {
            display: inline-block;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            color: white;
            font-weight: bold;
            line-height: 40px;
            text-align: center;
            margin-left: 10px;
        }
        
        .grade-A { background-color: #10B981; }
        .grade-B { background-color: #3B82F6; }
        .grade-C { background-color: #F59E0B; }
        .grade-D { background-color: #EF4444; }
        .grade-F { background-color: #991B1B; }
        
        .test-results {
            margin-top: 40px;
        }
        
        .test {
            margin-bottom: 30px;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .test-name {
            font-size: 1.2em;
            font-weight: 600;
        }
        
        .test-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }
        
        .status-passed {
            background-color: #D1FAE5;
            color: #065F46;
        }
        
        .status-failed {
            background-color: #FEE2E2;
            color: #991B1B;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .metric {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        
        .metric-name {
            font-size: 0.9em;
            color: #6b7280;
            margin-bottom: 5px;
        }
        
        .metric-result {
            font-size: 1.2em;
            font-weight: 600;
        }
        
        .recommendations {
            margin-top: 40px;
            padding: 20px;
            background-color: #FEF3C7;
            border-radius: 8px;
            border: 1px solid #F59E0B;
        }
        
        .recommendations h2 {
            color: #92400E;
            margin-bottom: 15px;
        }
        
        .recommendations ul {
            margin-left: 20px;
        }
        
        .recommendations li {
            margin-bottom: 10px;
            color: #78350F;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 Animation Performance Report</h1>
        
        <div class="summary">
            ${generateSummaryCards(metrics)}
        </div>
        
        <div class="test-results">
            <h2>Detailed Test Results</h2>
            ${metrics.map(generateTestResult).join('')}
        </div>
        
        <div class="recommendations">
            <h2>💡 Performance Recommendations</h2>
            ${generateRecommendations(metrics)}
        </div>
    </div>
</body>
</html>
  `;
  
  return html;
}

function generateSummaryCards(metrics) {
  // Calculate overall metrics
  const allFPS = metrics.flatMap(m => m.fps);
  const avgFPS = allFPS.length > 0 ? allFPS.reduce((a, b) => a + b, 0) / allFPS.length : 0;
  
  const allSmoothness = metrics.flatMap(m => m.smoothness);
  const avgSmoothness = allSmoothness.length > 0 ? allSmoothness.reduce((a, b) => a + b, 0) / allSmoothness.length : 0;
  
  const passedTests = metrics.filter(m => m.status === 'passed').length;
  const totalTests = metrics.length;
  
  return `
    <div class="metric-card">
        <div class="metric-label">Average FPS</div>
        <div class="metric-value">
            ${avgFPS.toFixed(1)}
            <span class="grade grade-${getGrade(avgFPS, 'fps')}">${getGrade(avgFPS, 'fps')}</span>
        </div>
    </div>
    <div class="metric-card">
        <div class="metric-label">Animation Smoothness</div>
        <div class="metric-value">
            ${avgSmoothness.toFixed(0)}%
            <span class="grade grade-${getGrade(avgSmoothness, 'smoothness')}">${getGrade(avgSmoothness, 'smoothness')}</span>
        </div>
    </div>
    <div class="metric-card">
        <div class="metric-label">Tests Passed</div>
        <div class="metric-value">${passedTests}/${totalTests}</div>
    </div>
  `;
}

function generateTestResult(metric) {
  return `
    <div class="test">
        <div class="test-header">
            <div class="test-name">${metric.name}</div>
            <div class="test-status status-${metric.status}">${metric.status.toUpperCase()}</div>
        </div>
        <div class="metrics-grid">
            ${metric.fps.map((fps, i) => `
                <div class="metric">
                    <div class="metric-name">FPS ${i + 1}</div>
                    <div class="metric-result">${fps.toFixed(1)}</div>
                </div>
            `).join('')}
            ${metric.smoothness.map((smooth, i) => `
                <div class="metric">
                    <div class="metric-name">Smoothness ${i + 1}</div>
                    <div class="metric-result">${smooth.toFixed(0)}%</div>
                </div>
            `).join('')}
            ${metric.timings.map(timing => `
                <div class="metric">
                    <div class="metric-name">${timing.name}</div>
                    <div class="metric-result">${timing.value}ms</div>
                </div>
            `).join('')}
        </div>
    </div>
  `;
}

function generateRecommendations(metrics) {
  const recommendations = [];
  
  // Analyze FPS
  const allFPS = metrics.flatMap(m => m.fps);
  const avgFPS = allFPS.length > 0 ? allFPS.reduce((a, b) => a + b, 0) / allFPS.length : 0;
  
  if (avgFPS < 55) {
    recommendations.push('Consider reducing the complexity of animations or using CSS transforms instead of JavaScript animations');
    recommendations.push('Enable hardware acceleration with will-change CSS property on animated elements');
  }
  
  // Analyze smoothness
  const allSmoothness = metrics.flatMap(m => m.smoothness);
  const avgSmoothness = allSmoothness.length > 0 ? allSmoothness.reduce((a, b) => a + b, 0) / allSmoothness.length : 0;
  
  if (avgSmoothness < 90) {
    recommendations.push('Reduce the number of simultaneous animations');
    recommendations.push('Use requestAnimationFrame for JavaScript animations');
    recommendations.push('Avoid animating properties that trigger layout (width, height, top, left)');
  }
  
  // Analyze timings
  const allTimings = metrics.flatMap(m => m.timings);
  const longAnimations = allTimings.filter(t => t.value > 1000);
  
  if (longAnimations.length > 0) {
    recommendations.push(`${longAnimations.length} animations take longer than 1 second - consider reducing duration`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Great job! All animations are performing within acceptable thresholds');
    recommendations.push('Continue monitoring performance as you add new features');
  }
  
  return `<ul>${recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`;
}

// Main execution
function main() {
  console.log('📊 Analyzing performance test results...\n');
  
  const results = readResults();
  if (!results) {
    console.error('❌ No test results found. Run tests first with: npm test');
    return;
  }
  
  const metrics = results.suites[0].specs.map(extractMetrics);
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(metrics);
  const reportPath = path.join(__dirname, '../../test-results/performance-report.html');
  fs.writeFileSync(reportPath, htmlReport);
  
  console.log('✅ Performance report generated: test-results/performance-report.html');
  console.log('\n📈 Summary:');
  
  // Print summary to console
  const allFPS = metrics.flatMap(m => m.fps);
  const avgFPS = allFPS.length > 0 ? allFPS.reduce((a, b) => a + b, 0) / allFPS.length : 0;
  console.log(`   Average FPS: ${avgFPS.toFixed(1)} (Grade: ${getGrade(avgFPS, 'fps')})`);
  
  const allSmoothness = metrics.flatMap(m => m.smoothness);
  const avgSmoothness = allSmoothness.length > 0 ? allSmoothness.reduce((a, b) => a + b, 0) / allSmoothness.length : 0;
  console.log(`   Average Smoothness: ${avgSmoothness.toFixed(0)}% (Grade: ${getGrade(avgSmoothness, 'smoothness')})`);
  
  const passedTests = metrics.filter(m => m.status === 'passed').length;
  console.log(`   Tests Passed: ${passedTests}/${metrics.length}`);
}

// Run analysis
main();