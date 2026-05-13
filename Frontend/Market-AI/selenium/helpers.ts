import { WebDriver, By, until, WebElement } from 'selenium-webdriver';
import * as crypto from 'crypto';

export const APP_URL = 'http://localhost:4200';
// En CI Angular arranca más lento con varios browsers en paralelo
export const TIMEOUT     = process.env['CI'] ? 20_000 : 10_000;
export const NAV_TIMEOUT = process.env['CI'] ? 30_000 : 15_000;

// ─── JWT helpers ──────────────────────────────────────────────────────────────

const JWT_SECRET = process.env['JWT_KEY'] ?? 'holamundo';

function b64url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function makeJwt(payload: Record<string, unknown>): string {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = b64url(JSON.stringify(payload));
  const signing = `${header}.${body}`;
  const sig     = crypto.createHmac('sha256', JWT_SECRET)
    .update(signing)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${signing}.${sig}`;
}

// Token de usuario normal con expiración futura
// ID real de MongoDB: VickyTest (role: user)
export const FAKE_USER_TOKEN = makeJwt({
  sub: '69fe8dd6a2764f5e773b8440',
  id:  '69fe8dd6a2764f5e773b8440',
  name: 'VickyTest',
  email: 'gsdggdg842@gmail.com',
  credits: 500,
  role: 'user',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
});

// Token con expiración ya vencida (para GR-06)
export const EXPIRED_USER_TOKEN = makeJwt({
  sub: '69fe8dd6a2764f5e773b8440',
  id:  '69fe8dd6a2764f5e773b8440',
  name: 'VickyTest',
  email: 'gsdggdg842@gmail.com',
  credits: 500,
  role: 'user',
  iat: Math.floor(Date.now() / 1000) - 7200,
  exp: Math.floor(Date.now() / 1000) - 3600,  // ya expiró
});

// Token de admin (para EC / CD)
// ID real de MongoDB: Victoria Rivera (role: admin)
export const FAKE_ADMIN_TOKEN = makeJwt({
  sub: '6936f54e771a2960c813a7d9',
  id:  '6936f54e771a2960c813a7d9',
  name: 'Victoria Rivera',
  email: 'leli.perros@gmail.com',
  credits: 460,
  role: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
});

// ─── Storage helpers ──────────────────────────────────────────────────────────

async function ensureDomain(driver: WebDriver): Promise<void> {
  const url = await driver.getCurrentUrl().catch(() => '');
  if (!url.startsWith(APP_URL)) {
    await driver.get(APP_URL + '/landing-page');
    await sleep(500); // esperar que la pagina cargue antes de acceder a localStorage
  }
}

const SET_SCRIPT = `localStorage.setItem('token', arguments[0]);
                    sessionStorage.setItem('token', arguments[0]);`;
const CLEAR_SCRIPT = `localStorage.removeItem('token');
                      sessionStorage.removeItem('token');`;

/** Pone el token en localStorage Y sessionStorage.
 *  Si el acceso falla (p. ej. Edge en modo seguro con pagina de error),
 *  navega a landing-page y reintenta una vez. */
export async function setToken(driver: WebDriver, token: string): Promise<void> {
  await ensureDomain(driver);
  try {
    await driver.executeScript(SET_SCRIPT, token);
  } catch {
    // Reintentar con pagina limpia si localStorage fue denegado
    await driver.get(APP_URL + '/landing-page');
    await sleep(500);
    await driver.executeScript(SET_SCRIPT, token);
  }
}

/** Pone el token solo en sessionStorage (no en localStorage). */
export async function setSessionToken(driver: WebDriver, token: string): Promise<void> {
  await ensureDomain(driver);
  try {
    await driver.executeScript(
      `sessionStorage.setItem('token', arguments[0]);
       localStorage.removeItem('token');`,
      token
    );
  } catch {
    await driver.get(APP_URL + '/landing-page');
    await sleep(500);
    await driver.executeScript(
      `sessionStorage.setItem('token', arguments[0]);
       localStorage.removeItem('token');`,
      token
    );
  }
}

/** Elimina el token de ambos storages. */
export async function clearToken(driver: WebDriver): Promise<void> {
  try {
    await ensureDomain(driver);
    await driver.executeScript(CLEAR_SCRIPT);
  } catch {
    try {
      await driver.get(APP_URL + '/landing-page');
      await sleep(500);
      await driver.executeScript(CLEAR_SCRIPT);
    } catch { /* ignorar si el driver no puede recuperarse */ }
  }
}

// ─── Wait helpers ─────────────────────────────────────────────────────────────

export async function waitForEl(
  driver: WebDriver,
  locator: By,
  timeout = TIMEOUT
): Promise<WebElement> {
  return driver.wait(until.elementLocated(locator), timeout);
}

export async function waitVisible(
  driver: WebDriver,
  locator: By,
  timeout = TIMEOUT
): Promise<WebElement> {
  const el = await waitForEl(driver, locator, timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

export async function waitForUrl(
  driver: WebDriver,
  fragment: string,
  timeout = NAV_TIMEOUT
): Promise<void> {
  await driver.wait(until.urlContains(fragment), timeout);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
