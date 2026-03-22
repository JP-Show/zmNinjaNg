import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { log } from '../../src/lib/logger';

const { When, Then } = createBdd();

let openedDeleteDialog = false;

// Profile Steps
Then('I should see at least {int} profile cards', async ({ page }, count: number) => {
  const profileCount = await page.locator('[data-testid="profile-card"]').count();
  expect(profileCount).toBeGreaterThanOrEqual(count);
  log.info('E2E profiles found', { component: 'e2e', action: 'profiles_count', count: profileCount });
});

Then('I should see the active profile indicator', async ({ page }) => {
  await expect(page.getByTestId('profile-active-indicator')).toBeVisible();
});

Then('I should see profile management buttons', async ({ page }) => {
  const addButton = page.getByRole('button', { name: /add/i }).first();
  await expect(addButton).toBeVisible();
});

When('I open the edit dialog for the first profile', async ({ page }) => {
  const editButton = page.locator('[data-testid^="profile-edit-button-"]').first();
  await editButton.click();
});

Then('I should see the profile edit dialog', async ({ page }) => {
  await expect(page.getByTestId('profile-edit-dialog')).toBeVisible();
});

When('I cancel profile edits', async ({ page }) => {
  await page.getByTestId('profile-edit-cancel').click();
});

Then('I should see the profiles list', async ({ page }) => {
  await expect(page.getByTestId('profile-list')).toBeVisible();
});

When('I open the delete dialog for the first profile if possible', async ({ page }) => {
  const deleteButton = page.locator('[data-testid^="profile-delete-button-"]').first();
  openedDeleteDialog = await deleteButton.count() > 0;
  if (openedDeleteDialog) {
    await deleteButton.click();
  }
});

Then('I should see the profile delete dialog', async ({ page }) => {
  if (openedDeleteDialog) {
    await expect(page.getByTestId('profile-delete-dialog')).toBeVisible();
  }
});

When('I cancel profile deletion', async ({ page }) => {
  const cancelButton = page.getByTestId('profile-delete-cancel');
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
  }
});
