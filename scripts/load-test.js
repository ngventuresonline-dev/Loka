/**
 * Load Test Script
 * Simulates multiple concurrent users accessing the application
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '10');
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER || '5');
const PAGES = [
  '/',
  '/about',
  '/properties',
  '/filter/brand',
];

function makeRequest(url) {
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
          success: res.statusCode === 200,
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function simulateUser(userId) {
  const results = [];
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const page = PAGES[Math.floor(Math.random() * PAGES.length)];
    const url = `${BASE_URL}${page}`;
    
    try {
      const result = await makeRequest(url);
      results.push({
        userId,
        request: i + 1,
        page,
        ...result,
      });
      
      // Random delay between requests (0-1 second)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    } catch (error) {
      results.push({
        userId,
        request: i + 1,
        page,
        success: false,
        error: error.message,
      });
    }
  }
  
  return results;
}

async function runLoadTest() {
  console.log('🚀 Starting Load Test');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👥 Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`📨 Requests per User: ${REQUESTS_PER_USER}`);
  console.log(`📊 Total Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}`);
  console.log('\n' + '='.repeat(50));
  
  const startTime = Date.now();
  
  // Start all users concurrently
  const userPromises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
  }
  
  // Wait for all users to complete
  const allResults = await Promise.all(userPromises);
  const endTime = Date.now();
  
  // Flatten results
  const results = allResults.flat();
  
  // Calculate statistics
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const loadTimes = successful.map(r => r.loadTime);
  
  const stats = {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: (successful.length / results.length * 100).toFixed(2),
    avgLoadTime: loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0,
    minLoadTime: loadTimes.length > 0 ? Math.min(...loadTimes) : 0,
    maxLoadTime: loadTimes.length > 0 ? Math.max(...loadTimes) : 0,
    p50: loadTimes.length > 0 ? loadTimes.sort((a, b) => a - b)[Math.floor(loadTimes.length * 0.5)] : 0,
    p95: loadTimes.length > 0 ? loadTimes.sort((a, b) => a - b)[Math.floor(loadTimes.length * 0.95)] : 0,
    p99: loadTimes.length > 0 ? loadTimes.sort((a, b) => a - b)[Math.floor(loadTimes.length * 0.99)] : 0,
    totalTime: endTime - startTime,
    requestsPerSecond: (results.length / ((endTime - startTime) / 1000)).toFixed(2),
  };
  
  // Print results
  console.log('\n📊 Load Test Results');
  console.log('='.repeat(50));
  console.log(`\n✅ Successful Requests: ${stats.successful}/${stats.total} (${stats.successRate}%)`);
  console.log(`❌ Failed Requests: ${stats.failed}`);
  console.log(`\n⏱️  Load Time Statistics:`);
  console.log(`   Average: ${stats.avgLoadTime.toFixed(2)}ms`);
  console.log(`   Min: ${stats.minLoadTime}ms`);
  console.log(`   Max: ${stats.maxLoadTime}ms`);
  console.log(`   P50 (Median): ${stats.p50}ms`);
  console.log(`   P95: ${stats.p95}ms`);
  console.log(`   P99: ${stats.p99}ms`);
  console.log(`\n📈 Throughput:`);
  console.log(`   Total Time: ${(stats.totalTime / 1000).toFixed(2)}s`);
  console.log(`   Requests/Second: ${stats.requestsPerSecond}`);
  
  // Page breakdown
  console.log(`\n📄 Per-Page Statistics:`);
  PAGES.forEach(page => {
    const pageResults = successful.filter(r => r.page === page);
    if (pageResults.length > 0) {
      const pageLoadTimes = pageResults.map(r => r.loadTime);
      const avgPageLoad = pageLoadTimes.reduce((a, b) => a + b, 0) / pageLoadTimes.length;
      console.log(`   ${page}: ${pageResults.length} requests, avg ${avgPageLoad.toFixed(2)}ms`);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  // Check if performance is acceptable
  const acceptable = stats.avgLoadTime < 2000 && stats.successRate > 95;
  if (!acceptable) {
    console.log('\n⚠️  Performance may not meet requirements');
    process.exit(1);
  } else {
    console.log('\n✅ Load test passed!');
  }
}

// Run load test
if (require.main === module) {
  runLoadTest().catch(error => {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  });
}

module.exports = { runLoadTest };

