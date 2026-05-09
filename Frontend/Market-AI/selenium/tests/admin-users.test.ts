// Tests E2E - Admin Users: Edit Credits Dialog (EC-01 a EC-03)
//                           Confirm Delete Dialog (CD-01 a CD-03)
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

describe('Admin Users - Dialogs (E2E)', () => {
  let driver: WebDriver;
  let backendAvailable = false;
  // Se activa solo si el backend carga la lista de usuarios con el token actual
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

    // Verificar si el admin token tiene acceso real a la lista de usuarios
    if (backendAvailable) {
      await setToken(driver, FAKE_ADMIN_TOKEN);
      await driver.get(APP_URL + '/admin/users');
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

  // Helper: navega a /admin/users con token de admin
  async function goToAdminUsers(): Promise<void> {
    await setToken(driver, FAKE_ADMIN_TOKEN);
    await driver.get(APP_URL + '/admin/users');
    await sleep(2500);
  }

  // Helper: abre el dialog de edicion de creditos del primer usuario de la lista
  async function openCreditsDialog(): Promise<void> {
    await goToAdminUsers();
    // Primer boton de edicion de creditos (icono lapiz en columna creditos)
    const editBtn = await waitVisible(driver, By.css('.credits-edit-btn'));
    await editBtn.click();
    await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
    await sleep(300);
  }

  // Helper: abre el dialog de confirmacion de eliminacion del primer usuario
  async function openDeleteDialog(): Promise<void> {
    await goToAdminUsers();
    // Primer boton Eliminar de la lista
    const deleteBtn = await waitVisible(driver, By.css('.user-btn-delete'));
    await deleteBtn.click();
    await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
    await sleep(300);
  }

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-01: Dialog de creditos abre al hacer clic en el boton de edicion [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir el dialog de edicion de creditos al hacer clic en el boton de editar', async () => {
    if (!hasAdminAccess) {
      console.warn('SKIP EC-01: sin acceso admin (token falso no aceptado por el backend)');
      return;
    }
    await openCreditsDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    expect(await dialog.isDisplayed()).toBe(true);

    const dialogText = await dialog.getText();
    expect(dialogText).toContain('Agregar');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-02: Boton Guardar deshabilitado cuando amount es 0 o negativo [BE+admin]
  // El template usa [disabled]="!amount || amount <= 0"
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton Guardar deshabilitado cuando el monto es 0', async () => {
    if (!hasAdminAccess) {
      console.warn('SKIP EC-02: sin acceso admin');
      return;
    }
    await openCreditsDialog();

    // El valor inicial del input es 0 → Guardar debe estar deshabilitado
    const saveBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Guardar")]')
    );
    expect(await saveBtn.getAttribute('disabled')).not.toBeNull();
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-03: Click en Cancelar cierra el dialog sin guardar [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar el dialog de creditos al hacer clic en Cancelar', async () => {
    if (!hasAdminAccess) {
      console.warn('SKIP EC-03: sin acceso admin');
      return;
    }
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
  // PRUEBA CD-01: Dialog de confirmacion abre al hacer clic en Eliminar [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir el dialog de confirmacion al hacer clic en Eliminar', async () => {
    if (!hasAdminAccess) {
      console.warn('SKIP CD-01: sin acceso admin');
      return;
    }
    await openDeleteDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    expect(await dialog.isDisplayed()).toBe(true);

    const dialogText = await dialog.getText();
    expect(dialogText.toLowerCase()).toContain('eliminar');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA CD-02: Click en Cancelar cierra el dialog sin eliminar [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar el dialog de confirmacion al hacer clic en Cancelar', async () => {
    if (!hasAdminAccess) {
      console.warn('SKIP CD-02: sin acceso admin');
      return;
    }
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
  // PRUEBA CD-03: Click en "Si, eliminar" confirma y cierra el dialog [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe confirmar y cerrar el dialog al hacer clic en Si eliminar', async () => {
    if (!hasAdminAccess) {
      console.warn('SKIP CD-03: sin acceso admin');
      return;
    }
    await openDeleteDialog();

    const confirmBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"eliminar")]')
    );
    await confirmBtn.click();
    await sleep(1000);

    // El dialog se cierra despues de confirmar (con o sin exito en la peticion)
    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });
});
