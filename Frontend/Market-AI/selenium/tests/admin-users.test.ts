import { By, until, WebDriver } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import { APP_URL, TIMEOUT, NAV_TIMEOUT } from '../helpers';

const BASE_URL = APP_URL;
const PAUSE = 1000;
const TARGET_USER = 'Enrique';
const TARGET_EMAIL = 'kikeruv2004';

describe('Market-AI — Panel de Usuarios', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`Navegador detectado: ${browserUsed}`);
  }, 120000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ── Landing Page ────────────────────────────────────────────────────────────

  it('Debe abrir la landing page correctamente', async () => {
    await driver.get(`${BASE_URL}/landing-page`);
    await driver.wait(until.titleContains('Market'), TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/landing-page');
  });

  it('Debe mostrar el título principal', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"El marketplace donde encuentras")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el botón "Ingresar"', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")] | //a[contains(.,"Ingresar")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btn.isDisplayed()).toBe(true);
  });

  // ── Login ───────────────────────────────────────────────────────────────────

  it('Debe navegar a la página de login al presionar "Ingresar"', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")]')),
      TIMEOUT
    );
    await btn.click();
    await driver.wait(until.urlContains('/login'), TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/login');
  });

  it('Debe verificar que la página de login se muestra correctamente', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Inicia sesion en Market AI")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);

    const inputCorreo = await driver.wait(
      until.elementLocated(By.css('input[name="Correo"]')),
      TIMEOUT
    );
    expect(await inputCorreo.isDisplayed()).toBe(true);

    const inputContrasena = await driver.wait(
      until.elementLocated(By.css('input[name="Contrasena"]')),
      TIMEOUT
    );
    expect(await inputContrasena.isDisplayed()).toBe(true);
  });

  it('Debe llenar el formulario de login y presionar Enviar', async () => {
    const inputCorreo = await driver.wait(
      until.elementLocated(By.css('input[name="Correo"]')),
      TIMEOUT
    );
    await inputCorreo.clear();
    await inputCorreo.sendKeys('ianrdzwong@gmail.com');

    const inputContrasena = await driver.wait(
      until.elementLocated(By.css('input[name="Contrasena"]')),
      TIMEOUT
    );
    await inputContrasena.clear();
    await inputContrasena.sendKeys('123456789');
    await driver.sleep(PAUSE);

    const btnEnviar = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Enviar")]')),
      TIMEOUT
    );
    await btnEnviar.click();
    await driver.sleep(PAUSE);
  });

  // ── Home Page ───────────────────────────────────────────────────────────────

  it('Debe estar en el home-page después de iniciar sesión', async () => {
    await driver.wait(until.urlContains('/home-page'), NAV_TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/home-page');

    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Bienvenido a Market-AI")]')),
      TIMEOUT
    );
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el panel de administración con sus botones', async () => {
    const panel = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Panel de administración")]')),
      TIMEOUT
    );
    expect(await panel.isDisplayed()).toBe(true);

    const btnUsuarios = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Panel de usuarios")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btnUsuarios.isDisplayed()).toBe(true);
  });

  // ── Panel de Usuarios ───────────────────────────────────────────────────────

  it('Debe navegar al Panel de Usuarios al presionar el botón correspondiente', async () => {
    const overlays = await driver.findElements(By.css('.cdk-overlay-backdrop-showing'));
    for (const overlay of overlays) {
      try { await driver.executeScript('arguments[0].click()', overlay); } catch (e) { console.warn('overlay click failed', e); }
    }
    if (overlays.length > 0) await driver.sleep(500);

    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Panel de usuarios")]')),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btn);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btn);
    await driver.wait(until.urlContains('/admin/users'), TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/admin/users');
  });

  it('Debe mostrar el título del Panel de Administración de Usuarios', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Panel de Administración de Usuarios")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar las columnas de la tabla de usuarios', async () => {
    for (const col of ['Estado', 'Rol', 'Nombre', 'Correo', 'Créditos', 'Acciones']) {
      const el = await driver.wait(
        until.elementLocated(By.xpath(`//*[contains(@class,"user-row--header")]//*[contains(.,"${col}")]`)),
        TIMEOUT
      );
      expect(await el.isDisplayed()).toBe(true);
    }
    await driver.sleep(PAUSE);
  });

  it('Debe mostrar al menos un usuario en la lista', async () => {
    const userRow = await driver.wait(
      until.elementLocated(By.css('.user-row:not(.user-row--header)')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await userRow.isDisplayed()).toBe(true);
  });

  it(`Debe encontrar al usuario "${TARGET_USER}" en la lista`, async () => {
    const row = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]`)
      ),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await row.isDisplayed()).toBe(true);
  });

  // ── Botón Estado ────────────────────────────────────────────────────────────

  it(`Debe mostrar el botón de estado para "${TARGET_USER}"`, async () => {
    const btn = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"state-chip")]`)
      ),
      TIMEOUT
    );
    expect(await btn.isDisplayed()).toBe(true);
    const texto = await btn.getText();
    expect(['Activo', 'Bloqueado']).toContain(texto.trim());
  });

  it(`Debe cambiar el estado de "${TARGET_USER}" al presionar el botón`, async () => {
    const btn = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"state-chip")]`)
      ),
      TIMEOUT
    );
    const estadoOriginal = (await btn.getText()).trim();
    await driver.executeScript('arguments[0].click()', btn);
    await driver.sleep(PAUSE);

    const btnActualizado = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"state-chip")]`)
      ),
      TIMEOUT
    );
    const estadoNuevo = (await btnActualizado.getText()).trim();
    expect(estadoNuevo).not.toBe(estadoOriginal);
  });

  it(`Debe revertir el estado de "${TARGET_USER}" al valor original`, async () => {
    const btn = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"state-chip")]`)
      ),
      TIMEOUT
    );
    const estadoCambiado = (await btn.getText()).trim();
    await driver.executeScript('arguments[0].click()', btn);
    await driver.sleep(PAUSE);

    const btnRevertido = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"state-chip")]`)
      ),
      TIMEOUT
    );
    const estadoFinal = (await btnRevertido.getText()).trim();
    expect(estadoFinal).not.toBe(estadoCambiado);
  });

  // ── Dropdown Rol ────────────────────────────────────────────────────────────

  it(`Debe mostrar el dropdown de rol para "${TARGET_USER}"`, async () => {
    const select = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//mat-select`)
      ),
      TIMEOUT
    );
    expect(await select.isDisplayed()).toBe(true);
  });

  it(`Debe cambiar el rol de "${TARGET_USER}" a "Admin"`, async () => {
    const select = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//mat-select`)
      ),
      TIMEOUT
    );

    // Seleccionar 'Usuario' primero para garantizar cambio pendiente real (idempotente si DB es 'Admin')
    await driver.executeScript('arguments[0].click()', select);
    await driver.sleep(500);
    const usuarioOption = await driver.wait(
      until.elementLocated(By.xpath('//mat-option[.//span[contains(.,"Usuario")]]')),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].click()', usuarioOption);
    await driver.sleep(PAUSE);

    // Ahora seleccionar 'Admin' para crear el cambio pendiente Usuario → Admin
    await driver.executeScript('arguments[0].click()', select);
    await driver.sleep(500);

    const adminOption = await driver.wait(
      until.elementLocated(By.xpath('//mat-option[.//span[contains(.,"Admin")]]')),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', adminOption);
    await driver.sleep(200);
    await driver.executeScript('arguments[0].click()', adminOption);
    await driver.sleep(PAUSE);

    const selectActualizado = await driver.findElement(
      By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//mat-select`)
    );
    const textoRol = await selectActualizado.getText();
    expect(textoRol.trim()).toBe('Admin');
  });

  it(`Debe habilitar el botón "Revertir" al tener cambios pendientes en "${TARGET_USER}"`, async () => {
    await driver.wait(
      async () => {
        const btns = await driver.findElements(
          By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"user-btn-role")]`)
        );
        if (btns.length === 0) return false;
        const disabled = await btns[0].getAttribute('disabled');
        return disabled === null;
      },
      TIMEOUT
    );
    const btnRevertir = await driver.findElement(
      By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"user-btn-role")]`)
    );
    const disabled = await btnRevertir.getAttribute('disabled');
    expect(disabled).toBeNull();
  });

  it(`Debe revertir el rol de "${TARGET_USER}" al presionar "Revertir"`, async () => {
    const btnRevertir = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"user-btn-role")]`)
      ),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].click()', btnRevertir);
    await driver.sleep(PAUSE);

    const selectRevertido = await driver.findElement(
      By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//mat-select`)
    );
    const textoRol = await selectRevertido.getText();
    expect(textoRol.trim()).toBe('Usuario');
  });

  // ── Botón Editar Créditos ────────────────────────────────────────────────────

  it(`Debe mostrar el botón de editar créditos para "${TARGET_USER}"`, async () => {
    const btn = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"credits-edit-btn")]`)
      ),
      TIMEOUT
    );
    expect(await btn.isDisplayed()).toBe(true);
  });

  it('Debe abrir el diálogo de créditos al presionar el botón de editar', async () => {
    const btn = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"credits-edit-btn")]`)
      ),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].click()', btn);

    const dialog = await driver.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await dialog.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el título "Agregar créditos" en el diálogo', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//*[contains(.,"Agregar créditos")]')),
      TIMEOUT
    );
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el campo de cantidad y los botones Cancelar/Guardar', async () => {
    const input = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. 100"]')),
      TIMEOUT
    );
    expect(await input.isDisplayed()).toBe(true);

    const btnCancelar = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')),
      TIMEOUT
    );
    expect(await btnCancelar.isDisplayed()).toBe(true);

    const btnGuardar = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Guardar")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btnGuardar.isDisplayed()).toBe(true);
  });

  it('Debe cerrar el diálogo de créditos al presionar "Cancelar"', async () => {
    const btnCancelar = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')),
      TIMEOUT
    );
    await btnCancelar.click();
    await driver.sleep(PAUSE);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  // ── Botón Eliminar ──────────────────────────────────────────────────────────

  it(`Debe mostrar el botón "Eliminar" para "${TARGET_USER}"`, async () => {
    const btn = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"user-btn-delete")]`)
      ),
      TIMEOUT
    );
    expect(await btn.isDisplayed()).toBe(true);
  });

  it('Debe abrir el diálogo de confirmación al presionar "Eliminar"', async () => {
    const btn = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]//button[contains(@class,"user-btn-delete")]`)
      ),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].click()', btn);

    const confirmacion = await driver.wait(
      until.elementLocated(By.xpath(`//mat-dialog-container//*[contains(.,"¿Seguro que deseas eliminar")]`)),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await confirmacion.isDisplayed()).toBe(true);
  });

  it('Debe mostrar los botones "Cancelar" y "Sí, eliminar" en el diálogo', async () => {
    const btnCancelar = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')),
      TIMEOUT
    );
    expect(await btnCancelar.isDisplayed()).toBe(true);

    const btnSiEliminar = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Sí, eliminar")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btnSiEliminar.isDisplayed()).toBe(true);
  });

  it(`Debe cancelar la eliminación y mantener a "${TARGET_USER}" en la lista`, async () => {
    const btnCancelar = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')),
      TIMEOUT
    );
    await btnCancelar.click();
    await driver.sleep(PAUSE);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);

    const row = await driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@class,"user-row")][.//div[contains(@class,"user-col--email") and contains(.,"${TARGET_EMAIL}")]]`)
      ),
      TIMEOUT
    );
    expect(await row.isDisplayed()).toBe(true);
  });

  // ── Regresar ────────────────────────────────────────────────────────────────

  it('Debe regresar al home-page desde el Panel de Usuarios', async () => {
    const btnBack = await driver.wait(
      until.elementLocated(By.css('button[mat-icon-button][routerlink="/home-page"]')),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btnBack);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btnBack);
    await driver.wait(until.urlContains('/home-page'), TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/home-page');
  });
});