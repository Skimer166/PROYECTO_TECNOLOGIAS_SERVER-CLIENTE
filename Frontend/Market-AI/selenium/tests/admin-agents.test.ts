// Tests E2E - Admin Agents
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const BASE_URL = 'http://localhost:4200';
const BACKEND_URL = process.env['BACKEND_URL'] ?? 'https://market-ai-api.onrender.com';
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? '';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? '';
const TIMEOUT = process.env['CI'] ? 30000 : 10000;

// Inicia sesión como admin y espera la redirección al home
async function loginAsAdmin(driver: WebDriver): Promise<void> {
  await driver.get(`${BASE_URL}/login`);
  await driver.findElement(By.css('input[formControlName="Correo"]')).sendKeys(ADMIN_EMAIL);
  await driver.findElement(By.css('input[formControlName="Contrasena"]')).sendKeys(ADMIN_PASSWORD);
  await driver.findElement(By.xpath('//button[contains(.,"Enviar")]')).click();
  await driver.wait(until.urlContains('/home-page'), TIMEOUT);
}

describe('Admin — Agentes (E2E)', () => {
  let driver: WebDriver | undefined;
  let backendAvailable = false;
  let adminCredentialsAvailable = false;

  beforeAll(async () => {
    // Verificar si el backend está disponible
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(`${BACKEND_URL}/auth/login`, { signal: controller.signal });
      clearTimeout(timeoutId);
      backendAvailable = true;
    } catch {
      backendAvailable = false;
    }

    adminCredentialsAvailable = backendAvailable && !!ADMIN_EMAIL && !!ADMIN_PASSWORD;

    if (!backendAvailable) {
      console.warn('\nBackend no disponible. Las pruebas que requieren backend serán omitidas.\n');
    } else if (!adminCredentialsAvailable) {
      console.warn('\nCredenciales de admin no configuradas (ADMIN_EMAIL / ADMIN_PASSWORD).');
      console.warn('Las pruebas que requieren autenticación serán omitidas.\n');
    } else {
      console.log(`\nBackend disponible en ${BACKEND_URL}\n`);
    }

    const options = new chrome.Options();
    options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    console.log('Navegador detectado: Chrome\n');
  }, 60000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 1: Solo frontend — no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe redirigir al login si no hay sesión activa', async () => {
    // Limpiar cualquier sesión previa
    await driver!.get(`${BASE_URL}/login`);
    await driver!.executeScript('localStorage.clear(); sessionStorage.clear();');

    await driver!.get(`${BASE_URL}/admin/agents`);
    await driver!.wait(until.urlContains('/login'), TIMEOUT);

    const currentUrl = await driver!.getCurrentUrl();
    expect(currentUrl).toContain('/login');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 2: Requiere backend + credenciales de admin
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el título del panel de administración de agentes', async () => {
    if (!adminCredentialsAvailable) {
      console.warn('  Prueba omitida: credenciales de admin no disponibles.');
      return;
    }

    await loginAsAdmin(driver!);
    await driver!.get(`${BASE_URL}/admin/agents`);

    const heading = await driver!.wait(
      until.elementLocated(By.xpath('//h1[contains(.,"Panel de Administración de Agentes")]')),
      TIMEOUT
    );
    expect(await heading.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 3: Requiere backend + credenciales de admin
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el botón "Crear Agente" habilitado', async () => {
    if (!adminCredentialsAvailable) {
      console.warn('  Prueba omitida: credenciales de admin no disponibles.');
      return;
    }

    const createBtn = await driver!.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Crear Agente")]')),
      TIMEOUT
    );
    expect(await createBtn.isDisplayed()).toBe(true);
    expect(await createBtn.isEnabled()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 4: Requiere backend + credenciales de admin
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar las columnas de encabezado o el mensaje de lista vacía', async () => {
    if (!adminCredentialsAvailable) {
      console.warn('  Prueba omitida: credenciales de admin no disponibles.');
      return;
    }

    // Esperar a que termine la carga
    await driver!.wait(
      until.elementLocated(
        By.xpath('//*[contains(@class,"agent-list-container")] | //*[contains(.,"No hay agentes registrados")]')
      ),
      TIMEOUT
    );

    const containers = await driver!.findElements(By.css('.agent-list-container'));

    if (containers.length > 0) {
      const nombreCol = await driver!.findElement(
        By.xpath('//div[contains(@class,"col-name") and contains(.,"Nombre")]')
      );
      const categoriaCol = await driver!.findElement(
        By.xpath('//div[contains(@class,"col-category") and contains(.,"Categoría")]')
      );
      const descCol = await driver!.findElement(
        By.xpath('//div[contains(@class,"col-desc") and contains(.,"Descripción")]')
      );
      const accionesCol = await driver!.findElement(
        By.xpath('//div[contains(@class,"col-actions") and contains(.,"Acciones")]')
      );

      expect(await nombreCol.isDisplayed()).toBe(true);
      expect(await categoriaCol.isDisplayed()).toBe(true);
      expect(await descCol.isDisplayed()).toBe(true);
      expect(await accionesCol.isDisplayed()).toBe(true);
    } else {
      const emptyMsg = await driver!.findElement(
        By.xpath('//*[contains(.,"No hay agentes registrados")]')
      );
      expect(await emptyMsg.isDisplayed()).toBe(true);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 5: Requiere backend + credenciales de admin
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar botones de editar y eliminar en la primera fila', async () => {
    if (!adminCredentialsAvailable) {
      console.warn('  Prueba omitida: credenciales de admin no disponibles.');
      return;
    }

    const rows = await driver!.findElements(By.css('.list-row'));
    if (rows.length === 0) {
      console.log('  No hay agentes en la lista, prueba omitida.');
      return;
    }

    const firstRow = rows[0];
    const editBtn = await firstRow.findElement(By.css('button.btn-icon-edit'));
    const deleteBtn = await firstRow.findElement(By.css('button.btn-icon-delete'));

    expect(await editBtn.isDisplayed()).toBe(true);
    expect(await deleteBtn.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 6: Requiere backend + credenciales de admin
  // ──────────────────────────────────────────────────────────────
  it('Debe activar modo edición al hacer clic en el botón editar', async () => {
    if (!adminCredentialsAvailable) {
      console.warn('  Prueba omitida: credenciales de admin no disponibles.');
      return;
    }

    const rows = await driver!.findElements(By.css('.list-row'));
    if (rows.length === 0) {
      console.log('  No hay agentes, prueba omitida.');
      return;
    }

    const editBtn = await rows[0].findElement(By.css('button.btn-icon-edit'));
    await editBtn.click();

    // Debe aparecer un input en la columna de nombre
    const nameInput = await driver!.wait(
      until.elementLocated(By.css('.col-name mat-form-field input')),
      TIMEOUT
    );
    expect(await nameInput.isDisplayed()).toBe(true);

    // Deben aparecer los botones de guardar y cancelar
    const updatedRow = (await driver!.findElements(By.css('.list-row')))[0];
    const cancelBtn = await updatedRow.findElement(By.css('button[title="Cancelar"]'));
    const saveBtn = await updatedRow.findElement(By.css('button[title="Guardar"]'));
    expect(await cancelBtn.isDisplayed()).toBe(true);
    expect(await saveBtn.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 7: Requiere backend + credenciales de admin
  // ──────────────────────────────────────────────────────────────
  it('Debe cancelar la edición y restaurar el estado de visualización', async () => {
    if (!adminCredentialsAvailable) {
      console.warn('  Prueba omitida: credenciales de admin no disponibles.');
      return;
    }

    const rows = await driver!.findElements(By.css('.list-row'));
    if (rows.length === 0) {
      console.log('  No hay agentes, prueba omitida.');
      return;
    }

    // Si no estamos en modo edición, entrar a él
    const nameInputs = await driver!.findElements(By.css('.col-name mat-form-field input'));
    if (nameInputs.length === 0) {
      await rows[0].findElement(By.css('button.btn-icon-edit')).click();
      await driver!.wait(
        until.elementLocated(By.css('.col-name mat-form-field input')),
        TIMEOUT
      );
    }

    // Hacer clic en cancelar
    const currentRow = (await driver!.findElements(By.css('.list-row')))[0];
    await currentRow.findElement(By.css('button[title="Cancelar"]')).click();

    // Debe volver a mostrar el texto (span.text-display)
    await driver!.wait(
      until.elementLocated(By.css('.col-name span.text-display')),
      TIMEOUT
    );
    const displaySpans = await driver!.findElements(By.css('.col-name span.text-display'));
    expect(displaySpans.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 8: Requiere backend + credenciales de admin
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar confirmación ¿Seguro? al hacer clic en eliminar', async () => {
    if (!adminCredentialsAvailable) {
      console.warn('  Prueba omitida: credenciales de admin no disponibles.');
      return;
    }

    const rows = await driver!.findElements(By.css('.list-row'));
    if (rows.length === 0) {
      console.log('  No hay agentes, prueba omitida.');
      return;
    }

    const deleteBtn = await rows[0].findElement(By.css('button.btn-icon-delete'));
    await deleteBtn.click();

    // Debe aparecer el texto "¿Seguro?" y los botones Sí / No
    const confirmLabel = await driver!.wait(
      until.elementLocated(By.xpath('//*[contains(.,"¿Seguro?")]')),
      TIMEOUT
    );
    expect(await confirmLabel.isDisplayed()).toBe(true);

    const updatedRow = (await driver!.findElements(By.css('.list-row')))[0];
    const noBtn = await updatedRow.findElement(By.xpath('.//button[contains(.,"No")]'));
    const yesBtn = await updatedRow.findElement(By.xpath('.//button[contains(.,"Sí")]'));
    expect(await noBtn.isDisplayed()).toBe(true);
    expect(await yesBtn.isDisplayed()).toBe(true);

    // Cancelar la eliminación para no modificar datos reales
    await noBtn.click();
    await driver!.wait(
      until.elementLocated(By.css('button.btn-icon-edit')),
      TIMEOUT
    );
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 9: Requiere backend + credenciales de admin
  // ──────────────────────────────────────────────────────────────
  it('El botón de regreso debe navegar a /home-page', async () => {
    if (!adminCredentialsAvailable) {
      console.warn('  Prueba omitida: credenciales de admin no disponibles.');
      return;
    }

    await driver!.get(`${BASE_URL}/admin/agents`);

    // El botón contiene el ícono arrow_back
    const backBtn = await driver!.wait(
      until.elementLocated(By.xpath('//button[.//mat-icon[contains(.,"arrow_back")]]')),
      TIMEOUT
    );
    await backBtn.click();

    await driver!.wait(until.urlContains('/home-page'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/home-page');
  });
});
