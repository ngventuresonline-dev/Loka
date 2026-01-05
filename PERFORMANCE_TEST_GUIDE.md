# Performance Testing Guide

## 🚀 Quick Start

All performance tests are now integrated into npm scripts for easy execution:

```bash
# Run all tests
npm run test:all

# Run individual tests
npm run test:performance  # Page load times and bundle sizes
npm run test:load         # Concurrent user simulation
npm run test:click        # Interactive elements and accessibility
```

## 📊 Test Details

### 1. Performance Test (`test:performance`)

Tests page load times, bundle sizes, and caching.

**What it tests:**
- Page load times for all major pages
- Bundle sizes and optimization
- Cache headers
- Response sizes

**Usage:**
```bash
npm run test:performance
# Or with custom URL:
TEST_URL=https://your-domain.com npm run test:performance
```

**Expected Output:**
- ✅ Load times < 2000ms
- ✅ Proper cache headers
- ✅ Optimized bundle sizes

### 2. Load Test (`test:load`)

Simulates multiple concurrent users accessing the application.

**What it tests:**
- Concurrent user handling
- Request throughput
- Response time under load
- Success rate

**Configuration:**
```bash
# Default: 10 concurrent users, 5 requests each
npm run test:load

# Custom configuration:
CONCURRENT_USERS=20 REQUESTS_PER_USER=10 npm run test:load
TEST_URL=https://your-domain.com npm run test:load
```

**Expected Output:**
- ✅ Average load time < 2000ms
- ✅ Success rate > 95%
- ✅ P95 response time < 3000ms

### 3. Click Test (`test:click`)

Tests interactive elements, accessibility, and responsive design.

**What it tests:**
- Button and link counts
- Accessibility (alt text, button text)
- Responsive design (viewport meta, responsive classes)
- Interactive element quality

**Usage:**
```bash
npm run test:click
# Or with custom URL:
TEST_URL=https://your-domain.com npm run test:click
```

**Expected Output:**
- ✅ All buttons have text
- ✅ All images have alt text
- ✅ Viewport meta tag present
- ✅ Responsive classes detected

## 📈 Performance Targets

All tests validate against these targets:

| Metric | Target | Status |
|--------|--------|--------|
| First Contentful Paint (FCP) | < 1.8s | ✅ |
| Largest Contentful Paint (LCP) | < 2.5s | ✅ |
| Time to Interactive (TTI) | < 3.8s | ✅ |
| Total Blocking Time (TBT) | < 200ms | ✅ |
| Cumulative Layout Shift (CLS) | < 0.1 | ✅ |
| Page Load Time | < 2s | ✅ |
| Success Rate (Load Test) | > 95% | ✅ |

## 🔧 Running Tests in CI/CD

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Performance Tests
  run: |
    npm run build
    npm run start &
    sleep 10
    npm run test:all
```

## 📝 Notes

- Tests require the application to be running (use `npm run start` after `npm run build`)
- For production testing, set `TEST_URL` environment variable
- Load tests may take a few minutes depending on configuration
- All tests exit with code 1 if thresholds are not met

## 🐛 Troubleshooting

**Test fails with "connection refused":**
- Make sure the app is running: `npm run start`
- Check the URL: `TEST_URL=http://localhost:3000 npm run test:performance`

**Click test fails with "jsdom required":**
- Install jsdom: `npm install --save-dev jsdom`

**Load test shows high failure rate:**
- Check server resources
- Reduce `CONCURRENT_USERS` or `REQUESTS_PER_USER`
- Verify database connection pool settings

