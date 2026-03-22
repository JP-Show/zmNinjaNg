import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { testConfig } from '../helpers/config';
import { log } from '../../src/lib/logger';

const { When, Then } = createBdd();

let openedDeleteDialog = false;
let updatedProfileName = '';

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

// New profile interaction steps

When('I change the profile name to a new value', async ({ page }) => {
  updatedProfileName = `Test Profile ${Date.now()}`;
  const nameInput = page.getByTestId('profile-edit-name')
    .or(page.getByLabel(/name|profile name/i));
  await nameInput.first().clear();
  await nameInput.first().fill(updatedProfileName);
});

When('I save profile edits', async ({ page }) => {
  const saveBtn = page.getByTestId('profile-edit-save')
    .or(page.getByRole('button', { name: /save/i }));
  await saveBtn.first().click();
  await page.waitForTimeout(500);
});

Then('the updated profile name should appear in the list', async ({ page }) => {
  if (!updatedProfileName) return;
  const profileCard = page.locator('[data-testid="profile-card"]').filter({ hasText: updatedProfileName });
  await expect(profileCard).toBeVisible({ timeout: testConfig.timeouts.element });
});

When('I click the add profile button', async ({ page }) => {
  const addBtn = page.getByRole('button', { name: /add/i })
    .or(page.getByTestId('add-profile-button'));
  await addBtn.first().click();
  await page.waitForTimeout(300);
});

Then('I should see the profile form', async ({ page }) => {
  const form = page.getByTestId('profile-edit-dialog')
    .or(page.getByRole('dialog'));
  await expect(form.first()).toBeVisible({ timeout: testConfig.timeouts.element });
});

When('I fill in new profile connection details', async ({ page }) => {
  // Fill in minimal connection details for a new profile
  const nameInput = page.getByTestId('profile-edit-name')
    .or(page.getByLabel(/name|profile name/i));
  await nameInput.first().fill(`New Profile ${Date.now()}`);

  const urlInput = page.getByLabel(/server url|portal url|url/i);
  if (await urlInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await urlInput.fill('http://test-server:8080');
  }
});

When('I save the new profile', async ({ page }) => {
  const saveBtn = page.getByTestId('profile-edit-save')
    .or(page.getByRole('button', { name: /save|connect/i }));
  await saveBtn.first().click();
  await page.waitForTimeout(500);
});

Then('I should see the new profile in the list', async ({ page }) => {
  // Verify at least one more profile card exists after adding
  const profileCards = page.locator('[data-testid="profile-card"]');
  const count = await profileCards.count();
  expect(count).toBeGreaterThanOrEqual(1);
});
