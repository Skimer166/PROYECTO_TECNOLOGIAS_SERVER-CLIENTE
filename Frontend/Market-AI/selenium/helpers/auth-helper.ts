import { WebDriver } from 'selenium-webdriver';

export const BASE_URL = 'http://localhost:4200';
export const BACKEND_URL = process.env['BACKEND_URL'] ?? 'https://market-ai-api.onrender.com';
export const TIMEOUT = 20_000;

/** Verifica si el backend responde. */
export async function checkBackendAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${BACKEND_URL}/agents?available=true`, {
      signal: controller.signal,
    });
    clearTimeout(id);
    return res.status < 500;
  } catch {
    return false;
  }
}

/** Hace login real contra el backend y retorna el JWT. */
export async function loginAndGetToken(
  email: string,
  password: string
): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Inyecta un token en sessionStorage/localStorage del navegador.
 * Navega primero a /landing-page para estar en el mismo origen.
 */
export async function injectToken(
  driver: WebDriver,
  token: string,
  role: 'user' | 'admin' = 'user'
): Promise<void> {
  await driver.get(`${BASE_URL}/landing-page`);
  await driver.executeScript(
    `sessionStorage.setItem('token', arguments[0]);
     sessionStorage.setItem('user_role', arguments[1]);
     localStorage.setItem('token', arguments[0]);`,
    token,
    role
  );
}

/**
 * Crea un JWT con estructura válida (base64 estándar) pero sin firma real.
 * Suficiente para pasar el authActivateGuard que solo verifica presencia del token,
 * y para que el componente lea el role del payload.
 */
export function makeFakeJwt(role: 'user' | 'admin' = 'user'): string {
  const enc = (obj: object): string =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '');

  const header = enc({ alg: 'HS256', typ: 'JWT' });
  const payload = enc({ role, exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${header}.${payload}.fake_signature`;
}
