import { test, expect } from '@playwright/test'

test.describe('Brand Onboarding Journey', () => {
  test('complete brand onboarding flow', async ({ page }) => {
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@lokazen.com`
    const testPassword = 'Test@123456'

    // 1. Navigate to homepage
    await page.goto('/')
    await expect(page).toHaveTitle(/Lokazen/i)

    // 2. Click register/login
    const registerLink = page.getByRole('link', { name: /register|sign up|get started/i })
    if (await registerLink.isVisible()) {
      await registerLink.click()
    } else {
      // Try to find login link and navigate to register
      const loginLink = page.getByRole('link', { name: /login|sign in/i })
      if (await loginLink.isVisible()) {
        await loginLink.click()
        await page.waitForURL(/auth/)
        const registerFromLogin = page.getByRole('link', { name: /register|sign up/i })
        if (await registerFromLogin.isVisible()) {
          await registerFromLogin.click()
        }
      } else {
        // Direct navigation
        await page.goto('/auth/register')
      }
    }

    // Wait for register page
    await page.waitForURL(/auth\/register|register/i)

    // 3. Fill registration form
    await page.fill('input[name="name"], input[type="text"]:first-of-type', `Test Brand ${timestamp}`)
    await page.fill('input[name="email"], input[type="email"]', testEmail)
    await page.fill('input[name="phone"], input[type="tel"]', '9876543210')
    await page.fill('input[name="password"], input[type="password"]:first-of-type', testPassword)
    await page.fill('input[name="confirmPassword"], input[type="password"]:last-of-type', testPassword)

    // Select brand user type if radio buttons exist
    const brandRadio = page.getByLabel(/brand|looking for space/i).first()
    if (await brandRadio.isVisible()) {
      await brandRadio.check()
    }

    // Submit form
    const submitButton = page.getByRole('button', { name: /register|sign up|create account/i })
    await submitButton.click()

    // 4. Verify redirect to onboarding or dashboard
    await page.waitForURL(/\?step=brand-onboarding|\/onboarding|\/dashboard|\//, { timeout: 10000 })

    // 5. Fill brand onboarding form if visible
    const companyNameInput = page.locator('input[name="companyName"], input[placeholder*="company"], input[placeholder*="Company"]').first()
    if (await companyNameInput.isVisible({ timeout: 5000 })) {
      await companyNameInput.fill(`Test Company ${timestamp}`)

      // Fill other fields if they exist
      const industrySelect = page.locator('select[name="industry"], select').first()
      if (await industrySelect.isVisible()) {
        await industrySelect.selectOption({ index: 1 })
      }

      const minAreaInput = page.locator('input[name="minArea"], input[placeholder*="min"], input[type="number"]').first()
      if (await minAreaInput.isVisible()) {
        await minAreaInput.fill('500')
      }

      const maxAreaInput = page.locator('input[name="maxArea"], input[placeholder*="max"], input[type="number"]').first()
      if (await maxAreaInput.isVisible()) {
        await maxAreaInput.fill('1000')
      }

      const budgetMaxInput = page.locator('input[name="budgetMax"], input[placeholder*="budget"], input[type="number"]').last()
      if (await budgetMaxInput.isVisible()) {
        await budgetMaxInput.fill('200000')
      }

      // Submit onboarding form
      const completeButton = page.getByRole('button', { name: /submit|complete|finish|save/i })
      if (await completeButton.isVisible()) {
        await completeButton.click()
        await page.waitForTimeout(2000)
      }
    }

    // 6. Verify dashboard or brand name appears
    const brandName = page.getByText(/Test Company|Test Brand/i)
    const dashboardTitle = page.getByText(/dashboard|welcome/i)
    
    // Either brand name or dashboard should be visible
    const hasBrandName = await brandName.isVisible().catch(() => false)
    const hasDashboard = await dashboardTitle.isVisible().catch(() => false)
    
    expect(hasBrandName || hasDashboard).toBeTruthy()
  })

  test('validation errors on registration form', async ({ page }) => {
    await page.goto('/auth/register')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /register|sign up|create account/i })
    await submitButton.click()

    // Should show validation errors
    await page.waitForTimeout(1000)
    
    // Check for error messages (implementation dependent)
    const errorMessages = page.locator('text=/required|invalid|error/i')
    const errorCount = await errorMessages.count()
    
    // Should have at least one validation error
    expect(errorCount).toBeGreaterThan(0)
  })

  test('password validation', async ({ page }) => {
    await page.goto('/auth/register')

    // Fill form with weak password
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="password"]', 'weak')
    await page.fill('input[name="confirmPassword"]', 'weak')

    const submitButton = page.getByRole('button', { name: /register|sign up/i })
    await submitButton.click()

    // Should show password validation error
    await page.waitForTimeout(1000)
    const passwordError = page.locator('text=/password|strong|minimum/i')
    const hasError = await passwordError.isVisible().catch(() => false)
    
    expect(hasError).toBeTruthy()
  })

  test('password mismatch validation', async ({ page }) => {
    await page.goto('/auth/register')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="password"]', 'Test@123456')
    await page.fill('input[name="confirmPassword"]', 'Different@123456')

    const submitButton = page.getByRole('button', { name: /register|sign up/i })
    await submitButton.click()

    // Should show password mismatch error
    await page.waitForTimeout(1000)
    const mismatchError = page.locator('text=/match|mismatch|same/i')
    const hasError = await mismatchError.isVisible().catch(() => false)
    
    expect(hasError).toBeTruthy()
  })
})
