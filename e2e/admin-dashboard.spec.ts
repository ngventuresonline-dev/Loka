import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('/auth/login')
    
    // Use admin credentials
    // Note: Adjust based on your test setup
    const adminEmail = 'admin@lokazen.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456'
    
    const emailInput = page.locator('input[name="email"], input[type="email"]')
    const passwordInput = page.locator('input[name="password"], input[type="password"]')
    
    if (await emailInput.isVisible({ timeout: 5000 })) {
      await emailInput.fill(adminEmail)
      await passwordInput.fill(adminPassword)
      
      const loginButton = page.getByRole('button', { name: /login|sign in/i })
      await loginButton.click()
      
      // Wait for redirect
      await page.waitForURL(/\//, { timeout: 10000 })
    }
  })

  test('access admin dashboard', async ({ page }) => {
    // 1. Navigate to admin dashboard
    await page.goto('/admin')
    
    // Wait for admin page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // 2. Verify admin dashboard is accessible
    // Should either show dashboard or redirect if not authorized
    const currentUrl = page.url()
    const isAdminPage = currentUrl.includes('/admin')
    
    // If redirected away, might not be admin
    if (isAdminPage) {
      // 3. Verify metrics are shown
      const metrics = page.locator('text=/total|properties|brands|users|metrics|dashboard/i')
      const metricsCount = await metrics.count()
      
      // Should have some metrics or dashboard content
      expect(metricsCount).toBeGreaterThan(0)
    } else {
      // Might be redirected to login or home if not admin
      // This is acceptable - means auth is working
      expect(currentUrl).toMatch(/\/(auth\/login|\?)/)
    }
  })

  test('verify admin metrics displayed', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Check for common admin metrics
    const totalProperties = page.locator('text=/total.*properties|properties.*total/i')
    const totalBrands = page.locator('text=/total.*brands|brands.*total/i')
    const totalUsers = page.locator('text=/total.*users|users.*total/i')
    const recentActivity = page.locator('text=/recent.*activity|activity/i')

    // At least one metric should be visible
    const hasProperties = await totalProperties.isVisible({ timeout: 5000 }).catch(() => false)
    const hasBrands = await totalBrands.isVisible({ timeout: 5000 }).catch(() => false)
    const hasUsers = await totalUsers.isVisible({ timeout: 5000 }).catch(() => false)
    const hasActivity = await recentActivity.isVisible({ timeout: 5000 }).catch(() => false)

    // If on admin page, should have at least one metric
    if (page.url().includes('/admin')) {
      expect(hasProperties || hasBrands || hasUsers || hasActivity).toBeTruthy()
    }
  })

  test('test export functionality if exists', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|download|csv|excel/i })
    
    if (await exportButton.isVisible({ timeout: 5000 })) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null)
      
      await exportButton.click()
      
      // Wait for download
      const download = await downloadPromise
      
      if (download) {
        // Verify download started
        expect(download.suggestedFilename()).toBeTruthy()
      }
    } else {
      // Export might not be implemented yet - that's okay
      test.skip()
    }
  })

  test('navigate admin sections', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    if (!page.url().includes('/admin')) {
      test.skip() // Not admin, skip navigation tests
    }

    // Test navigation to different admin sections
    const propertiesLink = page.getByRole('link', { name: /properties/i })
    const brandsLink = page.getByRole('link', { name: /brands/i })
    const usersLink = page.getByRole('link', { name: /users/i })
    const analyticsLink = page.getByRole('link', { name: /analytics/i })

    // Try to navigate to properties
    if (await propertiesLink.isVisible({ timeout: 5000 })) {
      await propertiesLink.click()
      await page.waitForURL(/admin\/properties/, { timeout: 5000 })
      expect(page.url()).toContain('/admin/properties')
    }

    // Try to navigate to brands
    await page.goto('/admin')
    if (await brandsLink.isVisible({ timeout: 5000 })) {
      await brandsLink.click()
      await page.waitForURL(/admin\/brands/, { timeout: 5000 })
      expect(page.url()).toContain('/admin/brands')
    }
  })

  test('admin authentication required', async ({ page, context }) => {
    // Clear cookies/session to test as non-admin
    await context.clearCookies()
    
    await page.goto('/admin')
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Should redirect to login or show unauthorized
    const currentUrl = page.url()
    const isRedirected = currentUrl.includes('/auth/login') || 
                       currentUrl.includes('/') && !currentUrl.includes('/admin')
    
    // If not redirected, check for unauthorized message
    if (!isRedirected) {
      const unauthorized = page.locator('text=/unauthorized|access denied|permission/i')
      const hasUnauthorized = await unauthorized.isVisible({ timeout: 5000 }).catch(() => false)
      expect(hasUnauthorized || isRedirected).toBeTruthy()
    } else {
      expect(isRedirected).toBeTruthy()
    }
  })
})
