/**
 * Click Test Script
 * Tests interactive elements and user flows
 * Note: This is a basic test. For full E2E testing, use Playwright or Cypress
 */

const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const PAGES_TO_TEST = [
  { path: '/', elements: ['button', 'a[href]', 'input'] },
  { path: '/about', elements: ['button', 'a[href]'] },
  { path: '/properties', elements: ['button', 'a[href]', '[role="button"]'] },
];

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function analyzePage(html, pagePath) {
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const results = {
      page: pagePath,
      totalElements: 0,
      interactiveElements: {
        buttons: 0,
        links: 0,
        inputs: 0,
        clickable: 0,
      },
      accessibility: {
        buttonsWithText: 0,
        linksWithText: 0,
        imagesWithAlt: 0,
        totalImages: 0,
      },
      responsive: {
        hasViewportMeta: false,
        hasResponsiveClasses: false,
      },
    };
    
    // Check buttons
    const buttons = document.querySelectorAll('button, [role="button"]');
    results.interactiveElements.buttons = buttons.length;
    buttons.forEach(btn => {
      if (btn.textContent && btn.textContent.trim().length > 0) {
        results.accessibility.buttonsWithText++;
      }
    });
    
    // Check links
    const links = document.querySelectorAll('a[href]');
    results.interactiveElements.links = links.length;
    links.forEach(link => {
      if (link.textContent && link.textContent.trim().length > 0) {
        results.accessibility.linksWithText++;
      }
    });
    
    // Check inputs
    const inputs = document.querySelectorAll('input, textarea, select');
    results.interactiveElements.inputs = inputs.length;
    
    // Total clickable elements
    results.interactiveElements.clickable = 
      results.interactiveElements.buttons + 
      results.interactiveElements.links;
    
    // Check images
    const images = document.querySelectorAll('img');
    results.accessibility.totalImages = images.length;
    images.forEach(img => {
      if (img.hasAttribute('alt')) {
        results.accessibility.imagesWithAlt++;
      }
    });
    
    // Check viewport meta
    const viewport = document.querySelector('meta[name="viewport"]');
    results.responsive.hasViewportMeta = !!viewport;
    
    // Check for responsive classes (Tailwind breakpoints)
    const htmlContent = html;
    results.responsive.hasResponsiveClasses = 
      /sm:|md:|lg:|xl:|2xl:/.test(htmlContent);
    
    results.totalElements = 
      results.interactiveElements.buttons +
      results.interactiveElements.links +
      results.interactiveElements.inputs;
    
    return results;
  } catch (error) {
    return {
      page: pagePath,
      error: error.message,
    };
  }
}

async function testPage(pageConfig) {
  const url = `${BASE_URL}${pageConfig.path}`;
  console.log(`\n🔍 Testing: ${pageConfig.path}`);
  
  try {
    const html = await fetchPage(url);
    const analysis = analyzePage(html, pageConfig.path);
    
    if (analysis.error) {
      console.log(`  ❌ Error: ${analysis.error}`);
      return { ...analysis, success: false };
    }
    
    console.log(`  ✅ Page loaded successfully`);
    console.log(`  📊 Interactive Elements:`);
    console.log(`     Buttons: ${analysis.interactiveElements.buttons}`);
    console.log(`     Links: ${analysis.interactiveElements.links}`);
    console.log(`     Inputs: ${analysis.interactiveElements.inputs}`);
    console.log(`     Total Clickable: ${analysis.interactiveElements.clickable}`);
    console.log(`  ♿ Accessibility:`);
    console.log(`     Buttons with text: ${analysis.accessibility.buttonsWithText}/${analysis.interactiveElements.buttons}`);
    console.log(`     Links with text: ${analysis.accessibility.linksWithText}/${analysis.interactiveElements.links}`);
    console.log(`     Images with alt: ${analysis.accessibility.imagesWithAlt}/${analysis.accessibility.totalImages}`);
    console.log(`  📱 Responsive:`);
    console.log(`     Viewport meta: ${analysis.responsive.hasViewportMeta ? '✅' : '❌'}`);
    console.log(`     Responsive classes: ${analysis.responsive.hasResponsiveClasses ? '✅' : '❌'}`);
    
    // Check for issues
    const issues = [];
    if (analysis.interactiveElements.buttons > 0 && 
        analysis.accessibility.buttonsWithText < analysis.interactiveElements.buttons) {
      issues.push('Some buttons missing text');
    }
    if (analysis.interactiveElements.links > 0 && 
        analysis.accessibility.linksWithText < analysis.interactiveElements.links) {
      issues.push('Some links missing text');
    }
    if (analysis.accessibility.totalImages > 0 && 
        analysis.accessibility.imagesWithAlt < analysis.accessibility.totalImages) {
      issues.push('Some images missing alt text');
    }
    if (!analysis.responsive.hasViewportMeta) {
      issues.push('Missing viewport meta tag');
    }
    if (!analysis.responsive.hasResponsiveClasses) {
      issues.push('No responsive classes detected');
    }
    
    if (issues.length > 0) {
      console.log(`  ⚠️  Issues found:`);
      issues.forEach(issue => console.log(`     - ${issue}`));
    } else {
      console.log(`  ✅ No issues found`);
    }
    
    return { ...analysis, success: true, issues };
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`);
    return { page: pageConfig.path, success: false, error: error.message };
  }
}

async function runClickTests() {
  console.log('🖱️  Starting Click/Interaction Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const pageConfig of PAGES_TO_TEST) {
    const result = await testPage(pageConfig);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const withIssues = results.filter(r => r.success && r.issues && r.issues.length > 0);
  
  console.log(`\n✅ Pages Tested: ${successful.length}/${results.length}`);
  console.log(`⚠️  Pages with Issues: ${withIssues.length}`);
  
  if (successful.length > 0) {
    const totalClickable = successful.reduce((sum, r) => 
      sum + (r.interactiveElements?.clickable || 0), 0);
    console.log(`\n🖱️  Total Clickable Elements: ${totalClickable}`);
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (withIssues.length > 0) {
    console.log('\n⚠️  Some pages have accessibility or responsive issues');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

// Run tests
if (require.main === module) {
  // Check if jsdom is available
  try {
    require('jsdom');
  } catch (error) {
    console.error('❌ jsdom is required for click tests. Install it with: npm install --save-dev jsdom');
    process.exit(1);
  }
  
  runClickTests().catch(error => {
    console.error('❌ Click test failed:', error);
    process.exit(1);
  });
}

module.exports = { runClickTests, testPage };

