// Tests E2E - Confirm Delete Dialog (CD-01 a CD-16)
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
  sleep,
} from '../helpers';

const BACKEND_URL = process.env['BACKEND_URL'] || 'http://localhost:3001';

describe('Confirm Delete Dialog (E2E)', () => {
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

  // Abre el dialog de confirmacion de eliminacion del primer usuario
  async function openDeleteDialog(): Promise<void> {
    await goToAdminUsers();
    const deleteBtn = await waitVisible(driver, By.css('.user-btn-delete'));
    await deleteBtn.click();
    await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
    await sleep(300);
  }

  // ──────────────────────────────────────────────────────────────
  // CD-01: Dialog muestra mensaje de confirmacion [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir el dialog de confirmacion al hacer clic en Eliminar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-01: sin acceso admin'); return; }
    await openDeleteDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    expect(await dialog.isDisplayed()).toBe(true);

    const dialogText = await dialog.getText();
    expect(dialogText.toLowerCase()).toContain('eliminar');
  });

  // ──────────────────────────────────────────────────────────────
  // CD-02: Click en Cancelar cierra el dialog sin eliminar [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar el dialog de confirmacion al hacer clic en Cancelar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-02: sin acceso admin'); return; }
    await openDeleteDialog();

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
    );
    await cancelBtn.click();
    await sleep(500);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-03: Click en "Si, eliminar" confirma y cierra el dialog [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe confirmar y cerrar el dialog al hacer clic en Si eliminar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-03: sin acceso admin'); return; }
    await openDeleteDialog();

    const confirmBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"eliminar")]')
    );
    await confirmBtn.click();
    await sleep(1000);

    // El dialog de confirmacion cierra al confirmar, pero el backend puede abrir
    // un dialog de notificacion (mat-dialog-container diferente).
    // Verificamos que el Confirm Delete Dialog especificamente desaparecio:
    // ese dialog es el unico que tiene el boton con texto "eliminar".
    const eliminateButtons = await driver.findElements(
      By.xpath('//mat-dialog-container//button[contains(.,"eliminar")]')
    );
    expect(eliminateButtons.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-04: El dialog tiene un mensaje de confirmacion con texto [Requiere Backend activo y acceso de administrador]
  // El componente muestra data.message en .notify-title (h2)
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar un mensaje de confirmacion con texto no vacio en el dialog', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-04: sin acceso admin'); return; }
    await openDeleteDialog();

    const message = await driver.findElement(By.css('mat-dialog-container .notify-title'));
    const text = await message.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-05: El mensaje menciona la accion de eliminar [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el mensaje del dialog con texto que mencione eliminar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-05: sin acceso admin'); return; }
    await openDeleteDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    const text = (await dialog.getText()).toLowerCase();
    const mentionsDelete = text.includes('eliminar') || text.includes('borrar') || text.includes('delete');
    expect(mentionsDelete).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-06: El dialog tiene exactamente 2 botones [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener exactamente 2 botones en el dialog de confirmacion', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-06: sin acceso admin'); return; }
    await openDeleteDialog();

    const buttons = await driver.findElements(
      By.css('mat-dialog-container [mat-dialog-actions] button, mat-dialog-container .notify-actions button')
    );
    expect(buttons.length).toBe(2);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-07: El boton de confirmar tiene texto afirmativo [Requiere Backend activo y acceso de administrador]
  // El template usa "Si, eliminar"
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton de confirmar con texto afirmativo en el dialog', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-07: sin acceso admin'); return; }
    await openDeleteDialog();

    const confirmBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"eliminar") or contains(.,"Confirmar") or contains(.,"S")]')
    );
    const text = (await confirmBtn.getText()).toLowerCase();
    const isAffirmative = text.includes('eliminar') || text.includes('confirmar') || text.includes('sí') || text.includes('si');
    expect(isAffirmative).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-08: El boton de cancelar tiene texto negativo [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton de cancelar con texto negativo en el dialog', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-08: sin acceso admin'); return; }
    await openDeleteDialog();

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar") or contains(.,"No") or contains(.,"Cerrar")]')
    );
    const text = (await cancelBtn.getText()).toLowerCase();
    const isNegative = text.includes('cancelar') || text.includes('no') || text.includes('cerrar');
    expect(isNegative).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-09: El dialog tiene backdrop/overlay visible [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el overlay backdrop cuando el dialog de confirmacion esta abierto', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-09: sin acceso admin'); return; }
    await openDeleteDialog();

    const backdrops = await driver.findElements(By.css('.cdk-overlay-backdrop'));
    expect(backdrops.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-10: El dialog esta centrado en el viewport [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el dialog de confirmacion centrado horizontalmente en el viewport', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-10: sin acceso admin'); return; }
    await openDeleteDialog();

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
  // CD-11: El dialog tiene role="dialog" [Requiere Backend activo y acceso de administrador]
  // Angular Material agrega role="dialog" automaticamente
  // ──────────────────────────────────────────────────────────────
  it('Debe tener role="dialog" en el contenedor del dialog de confirmacion', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-11: sin acceso admin'); return; }
    await openDeleteDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    const role = await dialog.getAttribute('role');
    expect(role).toBe('dialog');
  });

  // ──────────────────────────────────────────────────────────────
  // CD-12: El boton confirmar tiene estilo de advertencia [Requiere Backend activo y acceso de administrador]
  // El template usa mat-raised-button color="warn"
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton de confirmar con estilo de advertencia warn', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-12: sin acceso admin'); return; }
    await openDeleteDialog();

    // El boton de confirmar es el unico con color="warn" en el template
    const warnBtns = await driver.findElements(
      By.css('mat-dialog-container button[color="warn"], mat-dialog-container .mat-warn')
    );
    expect(warnBtns.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-13: Confirmar cierra el dialog (mat-dialog-container desaparece) [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe desaparecer el mat-dialog-container al confirmar la eliminacion', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-13: sin acceso admin'); return; }
    await openDeleteDialog();

    const confirmBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"eliminar")]')
    );
    await confirmBtn.click();
    await sleep(800);

    // El dialog de confirmacion cierra al confirmar, pero el backend puede abrir
    // un dialog de notificacion (mat-dialog-container diferente).
    // Verificamos que el Confirm Delete Dialog especificamente desaparecio:
    // ese dialog es el unico que tiene el boton con texto "eliminar".
    const eliminateButtons = await driver.findElements(
      By.xpath('//mat-dialog-container//button[contains(.,"eliminar")]')
    );
    expect(eliminateButtons.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-14: Cancelar cierra el dialog (mat-dialog-container desaparece) [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe desaparecer el mat-dialog-container al cancelar la eliminacion', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-14: sin acceso admin'); return; }
    await openDeleteDialog();

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
    );
    await cancelBtn.click();
    await sleep(500);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // CD-15: El dialog se puede abrir y cerrar 3 veces sin errores [Requiere Backend activo y acceso de administrador]
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir y cerrar el dialog de confirmacion 3 veces sin errores', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-15: sin acceso admin'); return; }
    await goToAdminUsers();

    for (let i = 0; i < 3; i++) {
      const deleteBtn = await waitVisible(driver, By.css('.user-btn-delete'));
      await deleteBtn.click();
      await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
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

  // ──────────────────────────────────────────────────────────────
  // CD-16: El mensaje del dialog no esta vacio en ningun ciclo [Requiere Backend activo y acceso de administrador]
  // Verifica que .notify-title tiene texto en cada apertura
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar mensaje no vacio en el dialog en 3 aperturas consecutivas', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-16: sin acceso admin'); return; }
    await goToAdminUsers();

    for (let i = 0; i < 3; i++) {
      const deleteBtn = await waitVisible(driver, By.css('.user-btn-delete'));
      await deleteBtn.click();
      await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
      await sleep(300);

      const message = await driver.findElement(By.css('mat-dialog-container .notify-title'));
      const text = await message.getText();
      expect(text.length).toBeGreaterThan(0);

      const cancelBtn = await driver.findElement(
        By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
      );
      await cancelBtn.click();
      await sleep(500);
    }
  });
});
