const { chromium } = require(process.env.MERCURY_PLAYWRIGHT_PATH || 'playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

(async () => {
  const root = path.resolve(__dirname, '..');
  const frames = process.env.MERCURY_FRAMES_DIR || '/tmp/yatinkare-mercury-frames';
  await fs.mkdir(frames, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-certificate-errors', '--allow-file-access-from-files'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 740 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => { throw error; });
    await page.goto(pathToFileURL(path.join(root, 'concepts/mercury-card.html')).href, { timeout: 120000 });
    await page.waitForFunction(() => typeof window.mercuryFrame === 'function', null, { timeout: 120000 });
    await page.locator('.avatar').evaluate(image => image.decode());
    const bounds = await page.locator('.composition').boundingBox();
    // Crop empty margins, retaining the full moving surface at the card's edges.
    const clip = { x: Math.floor(bounds.width * .05), y: Math.floor(bounds.height * .075), width: Math.ceil(bounds.width * .90), height: Math.ceil(bounds.height * .85) };
    const fps = 20, duration = 16, count = fps * duration;
    for (let i = 0; i < count; i++) {
      await page.evaluate(t => window.mercuryFrame(t), i / fps);
      await page.screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.png`), clip, omitBackground: true });
      if (i % 40 === 0) console.log(`Rendered ${i}/${count} frames`);
    }
    await fs.copyFile(path.join(frames, '0000.png'), path.join(root, 'assets/mercury-card.png'));
  } finally { await browser.close(); }
  const output = path.join(root, 'assets/mercury-card.webp');
  const files = Array.from({ length: 320 }, (_, i) => path.join(frames, `${String(i).padStart(4, '0')}.png`));
  const result = spawnSync(process.env.IMG2WEBP_PATH || 'img2webp', ['-min_size', '-loop', '0', '-lossy', '-q', '85', '-d', '50', ...files, '-o', output], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('WebP encoding failed; install the WebP command-line tools');
  console.log(`Exported ${output}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
