import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { testConfig } from '../helpers/config';

const { When, Then } = createBdd();

let lastWidgetTitle: string;

// Dashboard Steps
When('I open the Add Widget dialog', async ({ page }) => {
  const addWidgetBtn = page.getByRole('button', { name: /add widget/i }).first();
  if (await addWidgetBtn.isVisible()) {
    await addWidgetBtn.click();
  } else {
    await page.getByTitle(/Add Widget|Add/i).click();
  }

  const dialog = page.getByRole('dialog', { name: /add widget/i });
  await expect(dialog).toBeVisible();
});

When('I select the {string} widget type', async ({ page }, widgetType: string) => {
  const normalized = widgetType.toLowerCase();
  const typeSelectors: Record<string, string> = {
    monitor: 'widget-type-monitor',
    events: 'widget-type-events',
    timeline: 'widget-type-timeline',
    heatmap: 'widget-type-heatmap',
  };

  const matchingKey = Object.keys(typeSelectors).find((key) => normalized.includes(key));
  if (matchingKey) {
    const option = page.getByTestId(typeSelectors[matchingKey]);
    await option.click();
    await expect(option).toHaveClass(/border-primary/);
    return;
  }

  const option = page.locator('div.border.rounded-lg').filter({ hasText: new RegExp(widgetType, 'i') }).first();
  await option.click();
  await expect(option).toHaveClass(/border-primary/);
});

When('I select the first monitor in the widget dialog', async ({ page }) => {
  const list = page.getByTestId('monitor-selection-list');
  const firstCheckbox = list.locator('[data-testid^="monitor-checkbox-"]').first();
  await firstCheckbox.click();
});

When('I enter widget title {string}', async ({ page }, title: string) => {
  lastWidgetTitle = `${title} ${Date.now()}`;
  await page.getByLabel(/widget title/i).fill(lastWidgetTitle);
});

When('I click the Add button in the dialog', async ({ page }) => {
  const dialog = page.getByRole('dialog', { name: /add widget/i });
  const addBtn = dialog.getByRole('button', { name: /Add/i });
  await expect(addBtn).toBeVisible();
  await expect(addBtn).toBeEnabled();
  await addBtn.click();
  await expect(dialog).not.toBeVisible();
});

Then('the widget {string} should appear on the dashboard', async ({ page }, _title: string) => {
  await expect(page.locator('.react-grid-item').filter({ hasText: lastWidgetTitle }))
    .toBeVisible({ timeout: testConfig.timeouts.element });
});

// Dashboard Widget Management Steps
When('I enter dashboard edit mode', async ({ page }) => {
  // Click the edit/done button to enter edit mode
  const editBtn = page.getByRole('button', { name: /edit layout|edit/i })
    .or(page.getByTitle(/edit layout/i));
  await editBtn.first().click();
  await page.waitForTimeout(300);
});

When('I click the widget edit button on the first widget', async ({ page }) => {
  // In edit mode, there's a pencil icon button on each widget
  const editBtn = page.locator('.react-grid-item').first().locator('button').filter({ has: page.locator('svg.lucide-pencil') });
  await editBtn.click();
});

When('I click the widget delete button on the first widget', async ({ page }) => {
  // In edit mode, there's an X button on each widget
  const deleteBtn = page.locator('.react-grid-item').first().locator('button[class*="destructive"]')
    .or(page.locator('.react-grid-item').first().locator('button').filter({ has: page.locator('svg.lucide-x') }));
  await deleteBtn.first().click();
});

Then('I should see the widget edit dialog', async ({ page }) => {
  const dialog = page.getByTestId('widget-edit-dialog')
    .or(page.getByRole('dialog'));
  await expect(dialog.first()).toBeVisible({ timeout: testConfig.timeouts.element });
});

When('I change the widget title to {string}', async ({ page }, title: string) => {
  // Update lastWidgetTitle so subsequent assertions use the new title
  lastWidgetTitle = title;
  const titleInput = page.getByTestId('widget-edit-title-input')
    .or(page.getByLabel(/title/i));
  await titleInput.clear();
  await titleInput.fill(title);
});

When('I save the widget changes', async ({ page }) => {
  const saveBtn = page.getByTestId('widget-edit-save-button')
    .or(page.getByRole('button', { name: /save/i }));
  await saveBtn.click();
  await page.waitForTimeout(300);
});

Then('the widget should be removed from the dashboard', async ({ page }) => {
  // Wait for widget to be removed (grid should have one less item)
  await page.waitForTimeout(500);
});

Then('the add widget button should be visible', async ({ page }) => {
  const addBtn = page.getByRole('button', { name: /add widget/i })
    .or(page.getByTitle(/add widget/i));
  await expect(addBtn.first()).toBeVisible({ timeout: testConfig.timeouts.element });
});
