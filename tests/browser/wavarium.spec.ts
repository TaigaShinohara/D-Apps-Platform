import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startFirebasePreview } from '../../scripts/firebase-preview.mjs';

let hosting: Awaited<ReturnType<typeof startFirebasePreview>>;
test.beforeAll(async () => {
  hosting = await startFirebasePreview();
});
test.afterAll(async () => {
  await hosting?.close();
});

test('WAV/ARIUM works with the generated Firebase headers', async ({
  page,
  context,
}) => {
  const external: string[] = [];
  const errors: string[] = [];
  const fonts = new Set<string>();
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin === hosting.baseURL) {
      await route.continue();
    } else {
      external.push(route.request().url());
      await route.abort();
    }
  });
  page.on('response', (response) => {
    if (response.request().resourceType() === 'font' && response.ok())
      fonts.add(response.url());
  });
  page.on('requestfailed', (request) =>
    errors.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.clock.setFixedTime(new Date('2026-11-24T12:00:00+09:00'));
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  const response = await page.goto(hosting.baseURL + '/wavarium/');
  expect(response?.status()).toBe(200);
  const metaPolicy = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(response?.headers()['content-security-policy']).toBe(
    metaPolicy + "; frame-ancestors 'none'",
  );
  await expect(page.locator('#bfCountdown')).toHaveText('あと3日');

  const done = page.getByRole('button', { name: '済んだ' });
  await done.press('Enter');
  await expect(done).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.phase:visible')).toHaveCount(3);
  await expect(page.getByRole('status')).toHaveText('9件中3件を表示');

  const disclosure = page.locator('.phase:visible details');
  await disclosure.locator('summary').press('Enter');
  await expect(disclosure).toHaveAttribute('open', '');
  await expect(disclosure.locator('.phase-detail')).toBeVisible();

  for (const artwork of await page
    .locator('main img, header img, .goal img')
    .all()) {
    await artwork.scrollIntoViewIfNeeded();
    await expect(artwork).toHaveJSProperty('complete', true);
    expect(
      await artwork.evaluate((img: HTMLImageElement) => img.naturalWidth),
    ).toBeGreaterThan(0);
  }
  await page.evaluate(async () => void (await document.fonts.ready));
  expect(fonts.size).toBeGreaterThan(0);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  expect(await context.cookies()).toEqual([]);

  await page.getByRole('button', { name: 'すべて' }).click();
  for (const detail of await page.locator('.phase-card details').all()) {
    if ((await detail.getAttribute('open')) === null)
      await detail.locator('summary').press('Enter');
  }
  await page.setViewportSize({ width: 320, height: 720 });
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations).toEqual([]);
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  for (const [at, text] of [
    ['2026-11-27T00:00:00+09:00', '本日'],
    ['2026-11-28T00:00:00+09:00', '終了'],
  ]) {
    await page.clock.setFixedTime(new Date(at));
    await page.reload();
    await expect(page.locator('#bfCountdown')).toHaveText(text);
  }
});

test('both catalogs link to WAV/ARIUM and the page can be read without JavaScript', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 720 },
  });
  try {
    const page = await context.newPage();
    for (const lang of ['ja', 'en']) {
      await page.goto(`${hosting.baseURL}/${lang}/`);
      const projects = page.locator('.header-links a').filter({
        hasText: lang === 'ja' ? '作品' : 'Projects',
      });
      await projects.click();
      await expect(page).toHaveURL(`${hosting.baseURL}/${lang}/#projects`);
      await expect(page.locator('#projects h2')).toBeInViewport();
      await page.getByRole('link', { name: /WAV\/ARIUM/ }).click();
      await expect(page).toHaveURL(hosting.baseURL + '/wavarium/');
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'WAV/ARIUM',
      );
    }
    await expect(page.getByRole('button', { name: '済んだ' })).toHaveCount(0);
    await expect(page.locator('#bfCountdown')).toHaveText('11月27日（金）');
    await page.locator('.phase-toggle').first().press('Enter');
    await expect(page.locator('.phase-detail').first()).toBeVisible();
    await page.locator('.catalog-link').click();
    await expect(page).toHaveURL(hosting.baseURL + '/ja/');

    const sitemap = await request.get(hosting.baseURL + '/sitemap.xml');
    expect(await sitemap.text()).toContain(
      '<loc>https://dobulab.com/wavarium/</loc>',
    );
  } finally {
    await context.close();
  }
});
