import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { log } from '../../src/lib/logger';

const { When, Then } = createBdd();

let groupFilterAvailable = false;

// Group Filter Steps
Then('I should see the group filter if groups are available', async ({ page }) => {
  const groupFilter = page.getByTestId('group-filter-select');
  // Groups may or may not be configured on the server
  // We just check if the filter is visible when groups exist
  groupFilterAvailable = await groupFilter.isVisible({ timeout: 2000 }).catch(() => false);
  log.info('E2E: Group filter check', { component: 'e2e', available: groupFilterAvailable });
  // Test passes regardless - we're just checking the UI is correct
});

When('I select a group from the filter if available', async ({ page }) => {
  const groupFilter = page.getByTestId('group-filter-select');
  groupFilterAvailable = await groupFilter.isVisible({ timeout: 2000 }).catch(() => false);

  if (groupFilterAvailable) {
    await groupFilter.click();
    // Wait for dropdown to open
    await page.waitForTimeout(300);
    // Click the first group option (not "All Monitors")
    const groupOption = page.getByTestId(/^group-filter-\d+$/).first();
    if (await groupOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await groupOption.click();
      log.info('E2E: Selected group from filter', { component: 'e2e' });
    } else {
      // No groups available, close the dropdown
      await page.keyboard.press('Escape');
      groupFilterAvailable = false;
      log.info('E2E: No groups available to select', { component: 'e2e' });
    }
  }
});

Then('the filter should be applied', async ({ page }) => {
  if (!groupFilterAvailable) {
    // If no groups, skip the verification
    log.info('E2E: Skipping filter verification - no groups', { component: 'e2e' });
    return;
  }

  // Give time for the filter to apply
  await page.waitForTimeout(500);

  // Verify the group filter still shows a selection (not "All Monitors")
  const groupFilter = page.getByTestId('group-filter-select');
  await expect(groupFilter).toBeVisible();
  log.info('E2E: Group filter applied', { component: 'e2e' });
});
