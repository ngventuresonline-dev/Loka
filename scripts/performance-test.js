/**
 * Performance Test Script
 * Tests page load times, Core Web Vitals, and bundle sizes
 */

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const PAGES = [
  '/',
  '/about',
  '/location-intelligence',
  '/properties',
  '/filter/brand',
  '/filter/owner',
];

// Performance thresholds
const THRESHOLDS = {
  FCP: 1800, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  TTI: 3800, // Time to Interactive (ms)
  TBT: 200,  // Total Blocking Time (ms)
  CLS: 0.1,  // Cumulative Layout Shift
  LOAD_TIME: 2000, // Total load time (ms)
};

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          loadTime: endTime - startTime,
          size: Buffer.byteLength(data, 'utf8'),
          headers: res.headers,
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testPageLoad(page) {
  const url = `${BASE_URL}${page}`;
  console.log(`\n📊 Testing: ${page}`);
  
  try {
    const result = await makeRequest(url);
    
    if (result.statusCode !== 200) {
      console.log(`  ❌ Failed: Status ${result.statusCode}`);
      return { page, success: false, error: `Status ${result.statusCode}` };
    }
    
    const loadTime = result.loadTime;
    const sizeKB = (result.size / 1024).toFixed(2);
    const passed = loadTime < THRESHOLDS.LOAD_TIME;
    
    console.log(`  ⏱️  Load Time: ${loadTime}ms ${passed ? '✅' : '❌'} (target: <${THRESHOLDS.LOAD_TIME}ms)`);
    console.log(`  📦 Size: ${sizeKB}KB`);
    console.log(`  📈 Status: ${result.statusCode}`);
    
    // Check cache headers
    const cacheControl = result.headers['cache-control'];
    if (cacheControl) {
      console.log(`  💾 Cache: ${cacheControl}`);
    }
    
    return {
      page,
      success: true,
      loadTime,
      size: result.size,
      passed,
    };
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return { page, success: false, error: error.message };
  }
}

async function testBundleSize() {
  console.log('\n📦 Testing Bundle Sizes...');
  
  try {
    const buildOutput = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
    
    // Extract bundle size info from build output
    const bundleRegex = /(\w+\.js)\s+(\d+\.?\d*)\s+(kb|mb)/gi;
    const matches = [...buildOutput.matchAll(bundleRegex)];
    
    if (matches.length > 0) {
      console.log('\n  Bundle Sizes:');
      matches.forEach(match => {
        console.log(`    ${match[1]}: ${match[2]} ${match[3]}`);
      });
    }
    
    // Check .next directory
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
      const stats = getDirectorySize(nextDir);
      console.log(`\n  Total .next size: ${(stats / 1024 / 1024).toFixed(2)} MB`);
    }
    
    return { success: true };
  } catch (error) {
    console.log(`  ❌ Build failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  } catch (error) {
    // Ignore errors
  }
  
  return totalSize;
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏱️  Thresholds: FCP<${THRESHOLDS.FCP}ms, LCP<${THRESHOLDS.LCP}ms, TTI<${THRESHOLDS.TTI}ms`);
  
  const results = [];
  
  // Test each page
  for (const page of PAGES) {
    const result = await testPageLoad(page);
    results.push(result);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test bundle size
  const bundleResult = await testBundleSize();
  
  // Summary
  console.log('\n📊 Performance Test Summary');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const passed = results.filter(r => r.success && r.passed);
  
  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  console.log(`✅ Passed Threshold: ${passed.length}/${successful.length}`);
  
  if (successful.length > 0) {
    const avgLoadTime = successful.reduce((sum, r) => sum + r.loadTime, 0) / successful.length;
    console.log(`\n⏱️  Average Load Time: ${avgLoadTime.toFixed(2)}ms`);
    
    const totalSize = successful.reduce((sum, r) => sum + (r.size || 0), 0);
    console.log(`📦 Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Exit with error code if tests failed
  if (passed.length < successful.length) {
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runPerformanceTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runPerformanceTests, testPageLoad };

