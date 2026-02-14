import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    // Ramp up to 100 users over 2 minutes
    { duration: '2m', target: 100 },
    // Hold 100 users for 5 minutes
    { duration: '5m', target: 100 },
    // Spike to 200 users over 30 seconds
    { duration: '30s', target: 200 },
    // Hold spike for 1 minute
    { duration: '1m', target: 200 },
    // Ramp down to 0 users over 2 minutes
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // 95% of requests must complete below 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate should be less than 1%
    http_req_failed: ['rate<0.01'],
    // Check rate should be 100%
    checks: ['rate==1.0'],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test the /api/properties endpoint
  const response = http.get(`${BASE_URL}/api/properties`, {
    tags: { name: 'PropertiesAPI' },
  });

  // Check if request was successful
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has response body': (r) => r.body.length > 0,
  });

  // Sleep between requests (simulate user think time)
  sleep(1);
}
