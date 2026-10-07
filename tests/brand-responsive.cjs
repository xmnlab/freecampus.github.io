// Run after `mkdocs build`, with the build served at http://127.0.0.1:8000.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await fs.mkdir('test-results', { recursive: true });

  try {
    // Include both sides of the menu breakpoint and the narrowest supported width.
    for (const width of [320, 375, 760, 761, 820, 1024, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      for (const route of ['/', '/subjects/', '/about/', '/contribute/']) {
        await page.goto(`http://127.0.0.1:8000${route}`, { waitUntil: 'networkidle' });
        const result = await page.evaluate(() => {
          const header = document.querySelector('.site-header .brand');
          const nav = document.querySelector('.site-nav');
          const brand = header.getBoundingClientRect();
          const navigation = nav.getBoundingClientRect();
          return {
            viewport: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            brandRight: brand.right,
            navLeft: navigation.left,
            navVisible: getComputedStyle(nav).display !== 'none',
            logos: [...document.querySelectorAll('.brand-logo, .seal-logo')].map(svg => {
              const rect = svg.getBoundingClientRect();
              const ink = svg.querySelector('use').getBBox();
              return {
                width: rect.width,
                height: rect.height,
                expectedRatio: svg.viewBox.baseVal.width / svg.viewBox.baseVal.height,
                inkWidth: ink.width,
                inkHeight: ink.height,
                color: getComputedStyle(svg).color,
              };
            }),
            labels: [...document.querySelectorAll('a.brand')].map(a => a.getAttribute('aria-label')),
          };
        });
        const context = `${route} at ${width}px`;
        assert.ok(result.scrollWidth <= width + 1, `Horizontal overflow: ${context}`);
        assert.ok(result.brandRight <= width - 16, `Clipped header logo: ${context}`);
        if (result.navVisible) {
          assert.ok(result.brandRight + 16 <= result.navLeft, `Crowded header: ${context}`);
        }
        assert.equal(result.logos.length, route === '/' ? 3 : 2, context);
        for (const logo of result.logos) {
          assert.ok(logo.inkWidth > 0 && logo.inkHeight > 0, `Unloaded SVG sprite: ${context}`);
          assert.ok(Math.abs(logo.width / logo.height - logo.expectedRatio) < 0.02,
            `Distorted SVG: ${context}`);
        }
        assert.equal(result.logos[0].color, 'rgb(23, 63, 53)', context);
        assert.equal(result.logos.at(-1).color, 'rgb(245, 243, 237)', context);
        assert.deepEqual(result.labels, ['FreeCampus home', 'FreeCampus home'], context);

        if ([375, 761, 1440].includes(width)) {
          const slug = route === '/' ? 'home' : route.replaceAll('/', '');
          await page.screenshot({ path: `test-results/${slug}-${width}.png`, fullPage: true });
        }
        if (width <= 760) {
          const button = page.getByRole('button', { name: 'Open menu' });
          await button.click();
          assert.equal(await button.getAttribute('aria-expanded'), 'true', context);
          assert.equal(await page.locator('#site-navigation').isVisible(), true, context);
          await button.click();
          assert.equal(await button.getAttribute('aria-expanded'), 'false', context);
        }
        console.log(`PASS ${context}: logos, aspect ratios, contrast, navigation`);
      }
    }
    const favicon = await page.request.get('http://127.0.0.1:8000/assets/images/favicon.svg');
    assert.equal(favicon.status(), 200);
    assert.match(await favicon.text(), /viewBox="0 0 64 64"/);
    assert.deepEqual(errors, [], 'Browser or asset errors');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
