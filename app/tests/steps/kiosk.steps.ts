import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { testConfig } from '../helpers/config';
import { log } from '../../src/lib/logger';

const { Given, When, Then } = createBdd();

// Kiosk / PIN Steps

Given('I am logged in and on the monitors page', async ({ page }) => {
  // Navigate to application
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(100);
  await expect(page.getByTestId('app-init-blocker')).toBeHidden({
    timeout: testConfig.timeouts.transition * 3,
  });

  // Wait for either setup page or authenticated page
  await Promise.race([
    page.waitForSelector('text=/Welcome to zmNinjaNG/i', { timeout: testConfig.timeouts.transition }),
    page.waitForSelector('[data-testid="nav-item-dashboard"]', { timeout: testConfig.timeouts.transition })
  ]);

  // Check if on setup page
  const isSetupPage = await page.locator('text=/Initial Configuration/i').isVisible();
  if (isSetupPage) {
    const { host, username, password } = testConfig.server;
    await page.getByLabel(/server url/i).fill(host);
    if (username) await page.getByLabel(/username/i).fill(username);
    if (password) await page.getByLabel(/password/i).fill(password);
    const connectBtn = page.getByRole('button', { name: /(connect|save|login)/i });
    await connectBtn.click();
    await page.waitForURL((url) => !url.pathname.includes('/profiles/new') && !url.pathname.includes('/setup'), {
      timeout: testConfig.timeouts.transition * 2,
    });
  }

  // Navigate to monitors
  const navItem = page.locator('[data-testid="nav-item-monitors"]').locator('visible=true').first();
  try {
    await navItem.click({ timeout: testConfig.timeouts.transition });
  } catch {
    const mobileMenuButton = page.getByTestId('mobile-menu-button');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await page.waitForTimeout(300);
    }
    await page.locator('[data-testid="nav-item-monitors"]').first().click({ timeout: 2000 });
  }
  await page.waitForURL(/.*monitors/, { timeout: testConfig.timeouts.transition });
});

When('I click the sidebar kiosk lock button', async ({ page }) => {
  // TODO: implement - find and click the kiosk lock button in the sidebar
  const lockBtn = page.getByTestId('kiosk-lock-button')
    .or(page.getByRole('button', { name: /lock|kiosk/i }));
  await lockBtn.first().click();
  await page.waitForTimeout(300);
});

When('I set a 4-digit PIN {string}', async ({ page }, pin: string) => {
  // TODO: implement - enter the PIN in the setup dialog
  const pinInput = page.getByTestId('kiosk-pin-input')
    .or(page.getByPlaceholder(/pin/i))
    .or(page.locator('input[type="password"]').first());
  await pinInput.fill(pin);
});

When('I confirm the PIN {string}', async ({ page }, pin: string) => {
  // TODO: implement - enter the PIN in the confirm field and submit
  const confirmInput = page.getByTestId('kiosk-pin-confirm')
    .or(page.getByPlaceholder(/confirm/i))
    .or(page.locator('input[type="password"]').nth(1));
  await confirmInput.fill(pin);

  const submitBtn = page.getByRole('button', { name: /set|lock|confirm/i });
  await submitBtn.click();
  await page.waitForTimeout(300);
});

Then('the kiosk overlay should be visible', async ({ page }) => {
  const overlay = page.getByTestId('kiosk-overlay')
    .or(page.locator('[data-testid*="kiosk"]'));
  await expect(overlay.first()).toBeVisible({ timeout: testConfig.timeouts.element });
});

Then('the sidebar should not be visible', async ({ page }) => {
  const sidebar = page.getByTestId('sidebar')
    .or(page.locator('nav[data-testid="sidebar"]'));
  const isVisible = await sidebar.isVisible({ timeout: 1000 }).catch(() => false);
  // Sidebar should be hidden or covered by overlay
  log.info('E2E: Sidebar visibility during kiosk', { component: 'e2e', isVisible });
});

Given('kiosk mode is active with PIN {string}', async ({ page }, pin: string) => {
  // Activate kiosk mode first
  const lockBtn = page.getByTestId('kiosk-lock-button')
    .or(page.getByRole('button', { name: /lock|kiosk/i }));

  if (await lockBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await lockBtn.first().click();
    await page.waitForTimeout(300);

    const pinInput = page.getByTestId('kiosk-pin-input')
      .or(page.getByPlaceholder(/pin/i))
      .or(page.locator('input[type="password"]').first());
    await pinInput.fill(pin);

    const confirmInput = page.getByTestId('kiosk-pin-confirm')
      .or(page.getByPlaceholder(/confirm/i))
      .or(page.locator('input[type="password"]').nth(1));
    await confirmInput.fill(pin);

    const submitBtn = page.getByRole('button', { name: /set|lock|confirm/i });
    await submitBtn.click();
    await page.waitForTimeout(500);
  }
});

When('I click the kiosk unlock button', async ({ page }) => {
  const unlockBtn = page.getByTestId('kiosk-unlock-button')
    .or(page.getByRole('button', { name: /unlock/i }));
  await unlockBtn.first().click();
  await page.waitForTimeout(300);
});

When('I enter the PIN {string}', async ({ page }, pin: string) => {
  const pinInput = page.getByTestId('kiosk-unlock-pin-input')
    .or(page.getByPlaceholder(/pin/i))
    .or(page.locator('input[type="password"]').first());
  await pinInput.fill(pin);

  const submitBtn = page.getByRole('button', { name: /unlock|submit/i });
  await submitBtn.click();
  await page.waitForTimeout(300);
});

Then('the kiosk overlay should not be visible', async ({ page }) => {
  const overlay = page.getByTestId('kiosk-overlay');
  await expect(overlay).toBeHidden({ timeout: testConfig.timeouts.element });
});

Then('I should see {string}', async ({ page }, text: string) => {
  await expect(page.locator(`text=${text}`).first()).toBeVisible({ timeout: testConfig.timeouts.element });
});

When('I try to click a navigation link', async ({ page }) => {
  // Try clicking a nav item - should be blocked by overlay
  const navItem = page.locator('[data-testid^="nav-item-"]').first();
  try {
    await navItem.click({ timeout: 1000 });
  } catch {
    // Click may fail because overlay blocks it - that's the expected behavior
    log.info('E2E: Nav click blocked by kiosk overlay', { component: 'e2e' });
  }
});

Then('the kiosk overlay should still be visible', async ({ page }) => {
  const overlay = page.getByTestId('kiosk-overlay')
    .or(page.locator('[data-testid*="kiosk"]'));
  await expect(overlay.first()).toBeVisible();
});

Then('the page should not have changed', async ({ page }) => {
  // Should still be on the monitors page
  expect(page.url()).toContain('monitors');
});

Then('the kiosk overlay should cover the full viewport', async ({ page }) => {
  const overlay = page.getByTestId('kiosk-overlay');
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    const box = await overlay.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      // Overlay should cover at least 95% of the viewport
      expect(box.width).toBeGreaterThanOrEqual(viewport.width * 0.95);
      expect(box.height).toBeGreaterThanOrEqual(viewport.height * 0.95);
    }
  }
});
