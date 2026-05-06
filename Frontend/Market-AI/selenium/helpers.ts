import { WebDriver, By, until, WebElement } from 'selenium-webdriver';

export const APP_URL = 'http://localhost:4200';
export const TIMEOUT = 10_000;
export const NAV_TIMEOUT = 15_000;

// ─── JWT helpers ──────────────────────────────────────────────────────────────

function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function makeJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = base64url(JSON.stringify(payload));
  return `${header}.${body}.fakesig`;
}

// Token de usuario normal con expiración futura
export const FAKE_USER_TOKEN = makeJwt({
  sub: '507f1f77bcf86cd799439011',
  id:  '507f1f77bcf86cd799439011',
  name: 'Vicky Test',
  email: 'vicky@test.com',
  credits: 100,
  role: 'user',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
});

// Token con expiración ya vencida (para GR-06)
export const EXPIRED_USER_TOKEN = makeJwt({
  sub: '507f1f77bcf86cd799439011',
  id:  '507f1f77bcf86cd799439011',
  name: 'Vicky Test',
  email: 'vicky@test.com',
  credits: 100,
  role: 'user',
  iat: Math.floor(Date.now() / 1000) - 7200,
  exp: Math.floor(Date.now() / 1000) - 3600,  // ya expiró
});

// Token de admin (para EC / CD)
export const FAKE_ADMIN_TOKEN = makeJwt({
  sub: '507f1f77bcf86cd799439012',
  id:  '507f1f77bcf86cd799439012',
  name: 'Admin Test',
  email: 'admin@test.com',
  credits: 1000,
  role: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
});

// ─── Storage helpers ──────────────────────────────────────────────────────────

async function ensureDomain(driver: WebDriver): Promise<void> {
  const url = await driver.getCurrentUrl().catch(() => '');
  if (!url.startsWith(APP_URL)) {
    await driver.get(APP_URL + '/landing-page');
  }
}

/** Pone el token en localStorage Y sessionStorage. */
export async function setToken(driver: WebDriver, token: string): Promise<void> {
  await ensureDomain(driver);
  await driver.executeScript(
    `localStorage.setItem('token', arguments[0]);
     sessionStorage.setItem('token', arguments[0]);`,
    token
  );
}

/** Pone el token solo en sessionStorage (no en localStorage). */
export async function setSessionToken(driver: WebDriver, token: string): Promise<void> {
  await ensureDomain(driver);
  await driver.executeScript(
    `sessionStorage.setItem('token', arguments[0]);
     localStorage.removeItem('token');`,
    token
  );
}

/** Elimina el token de ambos storages. */
export async function clearToken(driver: WebDriver): Promise<void> {
  try {
    await ensureDomain(driver);
    await driver.executeScript(
      `localStorage.removeItem('token');
       sessionStorage.removeItem('token');`
    );
  } catch { /* ignorar si el driver aún no está en dominio */ }
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
