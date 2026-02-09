import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

await page.goto(`${base}/auth/login`, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'output/playwright/01-login.png', fullPage: true });

await page.getByRole('button', { name: /continue with openai/i }).click();
await page.waitForTimeout(1200);

if (page.url().includes('/workspaces/select')) {
  await page.getByRole('button', { name: /owner/i }).first().click();
}

await page.waitForURL(/\/app\/.*\/projects/, { timeout: 15000 });
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'output/playwright/02-projects.png', fullPage: true });

const projectTableRows = page.locator('section button').filter({ hasText: /Not compiled|Local/ });
if ((await projectTableRows.count()) > 0) {
  await projectTableRows.first().click();
} else {
  await page.getByRole('button', { name: '+ New', exact: true }).click();
  await page.getByLabel('Project Name').fill('UI Refinement Showcase');
  await page.getByRole('button', { name: 'Create Project' }).click();
}

await page.waitForURL(/\/editor$/, { timeout: 15000 });
await page.waitForLoadState('networkidle');
await page.screenshot({ path: 'output/playwright/03-editor.png', fullPage: true });

await browser.close();

