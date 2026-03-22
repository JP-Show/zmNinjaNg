import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Then } = createBdd();

Then('no element should overflow the viewport horizontally', async ({ page }) => {
  const overflows = await page.evaluate(() => {
    const vw = window.innerWidth;
    return Array.from(document.querySelectorAll('*'))
      .filter((el) => el.getBoundingClientRect().right > vw + 1)
      .map((el) => `${el.tagName}.${el.className}`.slice(0, 80));
  });
  expect(overflows).toHaveLength(0);
});

Then('the page should match the visual baseline', async ({ page }) => {
  // Placeholder — will be connected to TestActions.compareScreenshot in a later task
  await page.waitForTimeout(500);
});
