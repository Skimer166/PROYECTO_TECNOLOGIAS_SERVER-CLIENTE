// Tests E2E - Edit Credits Dialog (EC-01 a EC-16)
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  APP_URL,
  TIMEOUT,
  NAV_TIMEOUT,
  FAKE_ADMIN_TOKEN,
  setToken,
  clearToken,
  waitVisible,
  waitForEl,
  sleep,
} from '../helpers';

const BACKEND_URL = process.env['BACKEND_URL'] || 'http://localhost:3001';

describe('Edit Credits Dialog (E2E)', () => {
  let driver: WebDriver;
  let backendAvailable = false;
  let hasAdminAccess = false;

  beforeAll(async () => {
    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`Navegador detectado: ${browserUsed}\n`);

    try {
      const res = await fetch(`${BACKEND_URL}/agents`);
      backendAvailable = res.status < 500;
    } catch {
      backendAvailable = false;
    }
    console.log(`Backend disponible: ${backendAvailable}\n`);

    if (backendAvailable) {
      await driver.get(APP_URL + '/landing-page');
      await sleep(1000);
      await setToken(driver, FAKE_ADMIN_TOKEN);
      await driver.executeScript(`
        history.pushState(null, '', '/admin/users');
        window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
      `);
      await sleep(3000);
      const rows = await driver.findElements(By.css('.user-row:not(.user-row--header)'));
      hasAdminAccess = rows.length > 0;
    }
    console.log(`Acceso admin con lista de usuarios: ${hasAdminAccess}\n`);

    await driver.get(APP_URL + '/landing-page');
    await clearToken(driver);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  async function goToAdminUsers(): Promise<void> {
    const currentUrl = await driver.getCurrentUrl().catch(() => '');
    if (!currentUrl.startsWith(APP_URL)) {
      await driver.get(APP_URL + '/landing-page');
      await sleep(1000);
    }
    await driver.executeScript(`
      history.pushState(null, '', '/landing-page');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);
    await sleep(300);
    await setToken(driver, FAKE_ADMIN_TOKEN);
    await driver.executeScript(`
      history.pushState(null, '', '/admin/users');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);
    await driver.wait(
      async () => (await driver.getCurrentUrl()).includes('/admin/users'),
      NAV_TIMEOUT
    );
    await sleep(2500);
  }

  async function openCreditsDialog(): Promise<void> {
    await goToAdminUsers();
    const editBtn = await waitVisible(driver, By.css('.credits-edit-btn'));
    await editBtn.click();
    await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
    await sleep(300);
  }

  // ──────────────────────────────────────────────────────────────
  // EC-01: Dialog abre y muestra texto de agregar creditos [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir el dialog de edicion de creditos al hacer clic en el boton de editar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-01: sin acceso admin'); return; }
    await openCreditsDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    expect(await dialog.isDisplayed()).toBe(true);

    const dialogText = await dialog.getText();
    expect(dialogText).toContain('Agregar');
  });

  // ──────────────────────────────────────────────────────────────
  // EC-03: Cancelar cierra el dialog sin guardar [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar el dialog de creditos al hacer clic en Cancelar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-03: sin acceso admin'); return; }
    await openCreditsDialog();

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
    );
    await cancelBtn.click();
    await sleep(500);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // EC-04: El dialog tiene un titulo visible [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el titulo Agregar creditos en el dialog', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-04: sin acceso admin'); return; }
    await openCreditsDialog();

    const title = await driver.findElement(By.css('mat-dialog-container h2'));
    const text = await title.getText();
    expect(text.length).toBeGreaterThan(0);
    expect(text.toLowerCase()).toContain('agregar');
  });

  // ──────────────────────────────────────────────────────────────
  // EC-05: El input es de tipo number [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el input del dialog con type="number"', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-05: sin acceso admin'); return; }
    await openCreditsDialog();

    const input = await driver.findElement(By.css('mat-dialog-container input'));
    expect(await input.getAttribute('type')).toBe('number');
  });

  // ──────────────────────────────────────────────────────────────
  // EC-06: El input tiene un label descriptivo [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el label Cantidad a agregar en el dialog', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-06: sin acceso admin'); return; }
    await openCreditsDialog();

    const label = await driver.findElement(By.css('mat-dialog-container mat-label'));
    const text = await label.getText();
    expect(text.toLowerCase()).toContain('cantidad');
  });

  // ──────────────────────────────────────────────────────────────
  // EC-07: El dialog tiene exactamente 2 botones [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener exactamente 2 botones en el dialog de creditos', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-07: sin acceso admin'); return; }
    await openCreditsDialog();

    const buttons = await driver.findElements(
      By.css('mat-dialog-container mat-dialog-actions button')
    );
    expect(buttons.length).toBe(2);
  });

  // ──────────────────────────────────────────────────────────────
  // EC-08: El boton confirmar tiene texto afirmativo [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton confirmar con texto Guardar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-08: sin acceso admin'); return; }
    await openCreditsDialog();

    const saveBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Guardar")]')
    );
    expect(await saveBtn.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // EC-09: El boton cancelar tiene texto de cancelacion [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton cancelar con texto Cancelar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-09: sin acceso admin'); return; }
    await openCreditsDialog();

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
    );
    expect(await cancelBtn.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // EC-10: El input acepta valores numericos positivos [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe aceptar el valor 500 en el input sin error de validacion', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-10: sin acceso admin'); return; }
    await openCreditsDialog();

    const input = await waitVisible(driver, By.css('mat-dialog-container input[type="number"]'));
    await driver.executeScript(`
      const el = arguments[0];
      el.value = '500';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    `, input);
    await sleep(300);

    expect(await input.getAttribute('value')).toBe('500');
    const errors = await driver.findElements(By.css('mat-dialog-container mat-error'));
    expect(errors.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // EC-11: El boton confirmar se habilita con valor valido [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe habilitar el boton Guardar al ingresar un monto positivo', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-11: sin acceso admin'); return; }
    await openCreditsDialog();

    const input = await waitVisible(driver, By.css('mat-dialog-container input[type="number"]'));
    await driver.executeScript(`
      const el = arguments[0];
      el.value = '100';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    `, input);
    await sleep(300);

    const saveBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Guardar")]')
    );
    await driver.wait(async () => (await saveBtn.getAttribute('disabled')) === null, TIMEOUT);
    expect(await saveBtn.getAttribute('disabled')).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────
  // EC-12: El dialog tiene backdrop visible [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el overlay backdrop cuando el dialog esta abierto', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-12: sin acceso admin'); return; }
    await openCreditsDialog();

    const backdrops = await driver.findElements(By.css('.cdk-overlay-backdrop'));
    expect(backdrops.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // EC-13: El dialog esta centrado en la pantalla [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el dialog centrado horizontalmente en el viewport', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-13: sin acceso admin'); return; }
    await openCreditsDialog();

    const offset = await driver.executeScript(`
      const el = document.querySelector('mat-dialog-container');
      if (!el) return 999;
      const r = el.getBoundingClientRect();
      const center = r.left + r.width / 2;
      return Math.abs(center - window.innerWidth / 2);
    `) as number;
    expect(offset).toBeLessThan(100);
  });

  // ──────────────────────────────────────────────────────────────
  // EC-14: Cancelar no ejecuta ninguna accion de guardado [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar el dialog sin guardar al cancelar incluso con monto ingresado', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-14: sin acceso admin'); return; }
    await openCreditsDialog();

    const input = await waitVisible(driver, By.css('mat-dialog-container input[type="number"]'));
    await driver.executeScript(`
      const el = arguments[0];
      el.value = '999';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    `, input);
    await sleep(200);

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
    );
    await cancelBtn.click();
    await sleep(500);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // EC-15: El dialog tiene role="dialog" [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener role="dialog" en el contenedor del dialog de creditos', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-15: sin acceso admin'); return; }
    await openCreditsDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    const role = await dialog.getAttribute('role');
    expect(role).toBe('dialog');
  });

  // ──────────────────────────────────────────────────────────────
  // EC-16: El dialog se puede abrir y cerrar 3 veces sin errores [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir y cerrar el dialog de creditos 3 veces sin errores', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-16: sin acceso admin'); return; }
    await goToAdminUsers();

    for (let i = 0; i < 3; i++) {
      const editBtn = await waitVisible(driver, By.css('.credits-edit-btn'));
      await editBtn.click();
      await waitForEl(driver, By.css('mat-dialog-container'));
      await sleep(300);

      const dialog = await driver.findElement(By.css('mat-dialog-container'));
      expect(await dialog.isDisplayed()).toBe(true);

      const cancelBtn = await driver.findElement(
        By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
      );
      await cancelBtn.click();
      await sleep(500);

      const dialogs = await driver.findElements(By.css('mat-dialog-container'));
      expect(dialogs.length).toBe(0);
    }
  });
});
