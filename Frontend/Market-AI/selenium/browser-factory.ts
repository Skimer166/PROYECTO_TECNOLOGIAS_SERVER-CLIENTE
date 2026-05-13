import { Builder, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { Options as EdgeOptions } from 'selenium-webdriver/edge';
import * as fs from 'node:fs';

const BRAVE_PATHS = [
  String.raw`C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`,
  String.raw`C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe`,
];

const CHROME_PATHS = [
  String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  String.raw`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
  // Linux (GitHub Actions ubuntu-latest)
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
];

const EDGE_PATHS = [
  String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
  String.raw`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
  // Linux (GitHub Actions ubuntu-latest)
  '/usr/bin/microsoft-edge',
  '/usr/bin/microsoft-edge-stable',
  '/usr/bin/msedge',
];

function findBinary(paths: string[]): string | null {
  return paths.find(p => fs.existsSync(p)) ?? null;
}

export async function createDriver(): Promise<{ driver: WebDriver; browserUsed: string }> {
  const isHeadless = process.env['HEADLESS'] !== 'false';
  const headlessArgs = isHeadless
    ? ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    : ['--no-sandbox', '--disable-dev-shm-usage'];

  // 1. Intentar Chrome/Brave (Chromium-based, Linux y Windows)
  const chromePath = findBinary(CHROME_PATHS);
  if (chromePath) {
    try {
      const options = new ChromeOptions();
      options.setBinaryPath(chromePath);
      options.addArguments(...headlessArgs);
      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
      return { driver, browserUsed: 'Chrome' };
    } catch { /* intentar siguiente */ }
  }

  // 2. Intentar Edge (Windows y Linux)
  const edgePath = findBinary(EDGE_PATHS);
  if (edgePath) {
    try {
      const options = new EdgeOptions();
      options.setBinaryPath(edgePath);
      options.addArguments(...headlessArgs);
      const driver = await new Builder()
        .forBrowser('MicrosoftEdge')
        .setEdgeOptions(options)
        .build();
      return { driver, browserUsed: 'Microsoft Edge' };
    } catch { /* intentar siguiente */ }
  }

  // 3. Intentar Brave (solo Windows local)
  const bravePath = findBinary(BRAVE_PATHS);
  if (bravePath) {
    try {
      const options = new ChromeOptions();
      options.setBinaryPath(bravePath);
      options.addArguments(...headlessArgs);
      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
      return { driver, browserUsed: 'Brave' };
    } catch { /* intentar siguiente */ }
  }

  throw new Error(
    'No se encontró ningún navegador compatible (Chrome, Edge o Brave).\n' +
    'Instala al menos uno de ellos e intenta de nuevo.'
  );
}
