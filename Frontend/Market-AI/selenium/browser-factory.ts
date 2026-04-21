import { Builder, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions, ServiceBuilder as ChromeService } from 'selenium-webdriver/chrome';
import { Options as EdgeOptions, ServiceBuilder as EdgeService } from 'selenium-webdriver/edge';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const chromedriverPath: string = require('chromedriver').path;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const edgedriverPath: string = require('msedgedriver').path;

// Rutas donde puede estar instalado cada navegador en Windows
const BRAVE_PATHS = [
  'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
];

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

const EDGE_PATHS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findBinary(paths: string[]): string | null {
  return paths.find(p => fs.existsSync(p)) ?? null;
}

export async function createDriver(): Promise<{ driver: WebDriver; browserUsed: string }> {
  const headlessArgs = ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'];

  // 1. Intentar Brave (usa ChromeDriver)
  const bravePath = findBinary(BRAVE_PATHS);
  if (bravePath) {
    try {
      const options = new ChromeOptions();
      options.addArguments(...headlessArgs);
      options.setBinaryPath(bravePath);
      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(new ChromeService(chromedriverPath))
        .build();
      return { driver, browserUsed: 'Brave' };
    } catch { /* intentar siguiente */ }
  }

  // 2. Intentar Chrome
  const chromePath = findBinary(CHROME_PATHS);
  if (chromePath) {
    try {
      const options = new ChromeOptions();
      options.addArguments(...headlessArgs);
      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(new ChromeService(chromedriverPath))
        .build();
      return { driver, browserUsed: 'Chrome' };
    } catch { /* intentar siguiente */ }
  }

  // 3. Intentar Edge (siempre disponible en Windows)
  const edgePath = findBinary(EDGE_PATHS);
  if (edgePath) {
    try {
      const options = new EdgeOptions();
      options.addArguments(...headlessArgs);
      const driver = await new Builder()
        .forBrowser('MicrosoftEdge')
        .setEdgeOptions(options)
        .setEdgeService(new EdgeService(edgedriverPath))
        .build();
      return { driver, browserUsed: 'Microsoft Edge' };
    } catch { /* intentar siguiente */ }
  }

  throw new Error(
    'No se encontró ningún navegador compatible (Brave, Chrome o Edge).\n' +
    'Instala al menos uno de ellos e intenta de nuevo.'
  );
}
