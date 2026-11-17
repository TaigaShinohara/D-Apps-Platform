import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { apps, appDetails } from '../../src/lib/catalog';
import { readRevocations } from '../../src/lib/catalog-data.mjs';
import { scriptIntegrity, securityHeaders } from '../../src/lib/security.mjs';
const oneclipAvailable = apps.some((app) => app.id === 'oneclip');

for (const lang of ['ja', 'en']) {
  test(`${lang}: discover, switch language, verify download and privacy`, async ({
    page,
    context,
    request,
  }) => {
    test.skip(!oneclipAvailable, 'OneClip distribution is currently stopped');
    const external: string[] = [];
    const errors: string[] = [];
    page.on('request', (req) => {
      if (!req.url().startsWith('http://127.0.0.1:4321/'))
        external.push(req.url());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(`/${lang}/`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-filters]')).toHaveCount(0);
    await page
      .getByRole('heading', { name: 'OneClip', exact: true })
      .getByRole('link')
      .click();
    await expect(page).toHaveURL(new RegExp(`/${lang}/apps/oneclip/`));
    const other = lang === 'ja' ? 'en' : 'ja';
    await page.locator(`.language-switch a[lang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${other}/apps/oneclip/`));
    const download = page.locator('a[download]');
    const href = await download.getAttribute('href');
    expect(href).toBe('/downloads/oneclip/1.0.1/OneClip-1.0.1.zip');
    const response = await request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-disposition']).toContain('attachment');
    expect(
      createHash('sha256')
        .update(await response.body())
        .digest('hex'),
    ).toBe('231818840a6e122cc5eb7a2743cf236a1608a62472a6df6140f167e4114e29ed');
    expect(await context.cookies()).toEqual([]);
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
      })),
    ).toEqual({ local: 0, session: 0 });
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });
  test(`${lang}: accessible structure and layout at narrow widths and enlarged text`, async ({
    page,
    context,
    browserName,
  }) => {
    test.setTimeout(120_000);
    const external: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:4321')
        external.push(request.url());
    });
    for (const path of [
      `/${lang}/`,
      ...appDetails.map((app) => `/${lang}/apps/${app.id}/`),
      ...['about', 'privacy', 'safety', 'license', 'support'].map(
        (slug) => `/${lang}/${slug}/`,
      ),
    ]) {
      const response = await page.goto(path);
      expect(response!.status(), path).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://deepledeeple.com${path}`,
      );
      const other = lang === 'ja' ? 'en' : 'ja';
      await expect(
        page.locator(`.language-switch a[lang="${other}"]`),
      ).toHaveAttribute('href', path.replace(`/${lang}/`, `/${other}/`));
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(result.violations, path).toEqual([]);
      await page.keyboard.press(
        browserName === 'webkit' && process.platform === 'darwin'
          ? 'Alt+Tab'
          : 'Tab',
      );
      await expect(page.locator('.skip-link')).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('#content')).toBeFocused();
      await page.setViewportSize({ width: 320, height: 720 });
      // Test actual text reflow, including the site's longest legal paragraphs.
      for (const enlarged of [false, true]) {
        if (enlarged)
          await page.evaluate(() => {
            document.documentElement.style.fontSize = '32px';
            document.documentElement.style.fontFamily = 'Verdana, sans-serif';
          });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          path,
        ).toBe(true);
      }
      await expect(page.locator('h1')).toBeVisible();
      await expect(
        page.locator(`.language-switch a[lang="${other}"]`),
      ).toBeVisible();
      expect(
        await page.evaluate(() => ({
          local: localStorage.length,
          session: sessionStorage.length,
        })),
        path,
      ).toEqual({ local: 0, session: 0 });
    }
    expect(await context.cookies()).toEqual([]);
    expect(external).toEqual([]);
  });
}
test('file verification disclosure works from the keyboard', async ({
  page,
}) => {
  test.skip(!oneclipAvailable, 'OneClip distribution is currently stopped');
  await page.goto('/ja/apps/oneclip/');
  const summary = page.locator('summary');
  await summary.focus();
  await summary.press('Enter');
  await expect(page.locator('details')).toHaveAttribute('open', '');
  await expect(page.locator('.hash')).toHaveText(
    '231818840a6e122cc5eb7a2743cf236a1608a62472a6df6140f167e4114e29ed',
  );
  await summary.press('Space');
  await expect(page.locator('details')).not.toHaveAttribute('open', '');
});
test('404 offers both language homes without tracking', async ({ page }) => {
  const response = await page.goto('/missing-page');
  expect(response!.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex',
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'English home', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/$/);
});
test('critical navigation and download work without JavaScript', async ({
  browser,
}) => {
  test.skip(!oneclipAvailable, 'OneClip distribution is currently stopped');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/ja/');
  await page
    .getByRole('heading', { name: 'OneClip', exact: true })
    .getByRole('link')
    .click();
  await expect(page.locator('a[download]')).toBeVisible();
  await page.locator('.language-switch a[lang="en"]').click();
  await expect(page).toHaveURL(/\/en\/apps\/oneclip\//);
  await context.close();
});
test('skip link, CSP, 404 and write rejection', async ({
  page,
  request,
  browserName,
}) => {
  const response = await page.goto('/ja/');
  expect(response!.headers()['content-security-policy']).toContain(
    "connect-src 'none'",
  );
  // WebKit on macOS follows Safari's default: Option-Tab includes links.
  await page.keyboard.press(
    browserName === 'webkit' && process.platform === 'darwin'
      ? 'Alt+Tab'
      : 'Tab',
  );
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#content')).toBeFocused();
  expect((await request.get('/not-a-page')).status()).toBe(404);
  expect((await request.post('/ja/', { data: 'not-accepted' })).status()).toBe(
    405,
  );
});
test('filter behavior supports six apps without network or persistence', async ({
  page,
}) => {
  await page.goto('/ja/');
  // The production script is tested against an isolated six-card fixture.
  await page.route('http://127.0.0.1:4321/filter-fixture', async (route) => {
    const html = `<html lang="en"><meta charset="utf-8"><title>Filter fixture</title><div data-filters hidden><label>Category<select data-category><option value="">All</option><option value="utilities">Utilities</option></select></label><label>Platform<select data-platform><option value="">All</option><option value="macOS">macOS</option></select></label></div>${Array.from({ length: 6 }, (_, i) => `<article data-app-card data-category="${i < 3 ? 'utilities' : 'creative'}" data-platforms="${i % 2 ? 'Windows' : 'macOS'}">App ${i}</article>`).join('')}<p data-result-status role="status"></p><script src="/scripts/filter.js" integrity="${scriptIntegrity}" defer></script></html>`;
    await route.fulfill({
      contentType: 'text/html',
      headers: securityHeaders,
      body: html,
    });
  });
  await page.goto('/filter-fixture');
  await page
    .getByRole('combobox', { name: 'Category' })
    .selectOption('utilities');
  await expect(page.locator('[data-app-card]:visible')).toHaveCount(3);
  await page.getByRole('combobox', { name: 'Platform' }).selectOption('macOS');
  await expect(page.locator('[data-app-card]:visible')).toHaveCount(2);
  await expect(page.getByRole('status')).toHaveText('2 apps');
});
test('revoked URLs cannot be downloaded or linked from public app pages', async ({
  page,
  request,
}) => {
  const revoked = readRevocations();
  for (const path of revoked) {
    expect((await request.get(path)).status()).toBe(404);
    expect((await request.head(path)).status()).toBe(404);
  }
  for (const lang of ['ja', 'en'])
    for (const path of [
      `/${lang}/`,
      ...appDetails.map((app) => `/${lang}/apps/${app.id}/`),
    ]) {
      await page.goto(path);
      const targets = await page
        .locator('a[download]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
      expect(targets.some((target) => revoked.includes(target))).toBe(false);
    }
});
test('direct release bytes available for deterministic download test', async () => {
  expect((await readFile('.artifacts/releases/OneClip-1.0.1.zip')).length).toBe(
    3821021,
  );
});
