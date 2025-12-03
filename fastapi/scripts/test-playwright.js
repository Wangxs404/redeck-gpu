const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  console.log('Playwright OK!');
  await browser.close();
})();
