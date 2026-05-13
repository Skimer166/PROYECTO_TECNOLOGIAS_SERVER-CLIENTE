import { By, until, WebDriver } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import { APP_URL, TIMEOUT, NAV_TIMEOUT } from '../helpers';

const BASE_URL = APP_URL;
const PAUSE = 1000;

describe('Market-AI — Panel de Agentes', () => {
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
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/landing-page');
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

    const btnAgentes = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Panel de agentes")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btnAgentes.isDisplayed()).toBe(true);
  });

  // ── Panel de Agentes ────────────────────────────────────────────────────────

  it('Debe navegar al Panel de Agentes al presionar el botón correspondiente', async () => {
    // Cerrar cualquier overlay/dialog abierto (p.ej. snackbar de login)
    const overlays = await driver.findElements(By.css('.cdk-overlay-backdrop-showing'));
    for (const overlay of overlays) {
      try { await driver.executeScript('arguments[0].click()', overlay); } catch (e) { console.warn('overlay click failed', e); }
    }
    if (overlays.length > 0) await driver.sleep(500);

    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Panel de agentes")]')),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btn);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btn);
    await driver.wait(until.urlContains('/admin/agents'), TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/admin/agents');
  });

  it('Debe mostrar el título del Panel de Administración de Agentes', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Panel de Administración de Agentes")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el botón "Crear Agente"', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Crear Agente")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btn.isDisplayed()).toBe(true);
  });

  it('Debe mostrar las columnas de la tabla de agentes', async () => {
    const colNombre = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Nombre")]')),
      TIMEOUT
    );
    expect(await colNombre.isDisplayed()).toBe(true);

    const colCategoria = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Categoría")]')),
      TIMEOUT
    );
    expect(await colCategoria.isDisplayed()).toBe(true);

    const colDescripcion = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Descripción")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await colDescripcion.isDisplayed()).toBe(true);
  });

  // ── Formulario Crear Agente ─────────────────────────────────────────────────

  it('Debe abrir el formulario "Crear Nuevo Agente" al presionar el botón', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Crear Agente")]')),
      TIMEOUT
    );
    await btn.click();
    const dialog = await driver.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await dialog.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el título "Crear Nuevo Agente" en el formulario', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//*[contains(.,"Crear Nuevo Agente")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar los campos del formulario', async () => {
    const inputNombre = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. Experto Python"]')),
      TIMEOUT
    );
    expect(await inputNombre.isDisplayed()).toBe(true);

    const inputModelo = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. gpt-4o"]')),
      TIMEOUT
    );
    expect(await inputModelo.isDisplayed()).toBe(true);

    const inputIdioma = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. es, en"]')),
      TIMEOUT
    );
    expect(await inputIdioma.isDisplayed()).toBe(true);

    const textareas = await driver.findElements(By.xpath('//mat-dialog-container//textarea'));
    await driver.sleep(PAUSE);
    expect(textareas.length).toBeGreaterThanOrEqual(2);
  });

  it('Debe mostrar los botones "Cancelar" y "Crear Agente" en el formulario', async () => {
    const btnCancelar = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')),
      TIMEOUT
    );
    expect(await btnCancelar.isDisplayed()).toBe(true);

    const btnCrear = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Crear Agente")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btnCrear.isDisplayed()).toBe(true);
  });

  it('Debe llenar el formulario con datos válidos', async () => {
    const inputNombre = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. Experto Python"]')),
      TIMEOUT
    );
    await inputNombre.clear();
    await inputNombre.sendKeys('Agente Selenium Test');

    const inputModelo = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. gpt-4o"]')),
      TIMEOUT
    );
    await inputModelo.clear();
    await inputModelo.sendKeys('gpt-4o-mini');

    const inputIdioma = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. es, en"]')),
      TIMEOUT
    );
    await inputIdioma.clear();
    await inputIdioma.sendKeys('es');

    const textareas = await driver.findElements(By.xpath('//mat-dialog-container//textarea'));
    await textareas[0].clear();
    await textareas[0].sendKeys('Agente de prueba creado por Selenium para tests automatizados.');
    await textareas[1].clear();
    await textareas[1].sendKeys('Eres un asistente de prueba generado automáticamente por Selenium.');
    await driver.sleep(PAUSE);
  });

  it('Debe cerrar el formulario al presionar "Cancelar"', async () => {
    const btnCancelar = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')),
      TIMEOUT
    );
    await btnCancelar.click();
    await driver.sleep(PAUSE);
    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  it('Debe abrir el formulario de nuevo, llenarlo y presionar "Crear Agente"', async () => {
    const btnAbrirCrear = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Crear Agente")]')),
      TIMEOUT
    );
    await btnAbrirCrear.click();
    await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
    await driver.sleep(PAUSE);

    const inputNombre = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. Experto Python"]')),
      TIMEOUT
    );
    await inputNombre.clear();
    await inputNombre.sendKeys('Agente Selenium Demo');

    const textareas = await driver.findElements(By.xpath('//mat-dialog-container//textarea'));
    await textareas[0].clear();
    await textareas[0].sendKeys('Descripción del agente creado por Selenium.');
    await textareas[1].clear();
    await textareas[1].sendKeys('Eres un asistente demo generado por pruebas automatizadas.');
    await driver.sleep(PAUSE);

    const btnCrearFinal = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Crear Agente")]')),
      TIMEOUT
    );
    await btnCrearFinal.click();
    await driver.sleep(PAUSE * 3);
  });

  // ── Editar y Eliminar Agente ────────────────────────────────────────────────

  it('Debe encontrar el agente "Agente Selenium Demo" en la lista', async () => {
    const row = await driver.wait(
      until.elementLocated(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Demo")]]')
      ),
      NAV_TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await row.isDisplayed()).toBe(true);
  });

  it('Debe abrir el modo edición al presionar el botón Editar', async () => {
    const btnEditar = await driver.wait(
      until.elementLocated(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Demo")]]//button[@title="Editar"]')
      ),
      TIMEOUT
    );
    await btnEditar.click();
    await driver.sleep(PAUSE);
    const inputEditar = await driver.wait(
      until.elementLocated(By.xpath('//div[contains(@class,"list-row")]//input[@placeholder="Nombre"]')),
      TIMEOUT
    );
    expect(await inputEditar.isDisplayed()).toBe(true);
  });

  it('Debe modificar el nombre del agente y guardar los cambios', async () => {
    const inputNombre = await driver.wait(
      until.elementLocated(By.xpath('//div[contains(@class,"list-row")]//input[@placeholder="Nombre"]')),
      TIMEOUT
    );
    await inputNombre.clear();
    await inputNombre.sendKeys('Agente Selenium Editado');
    await driver.sleep(PAUSE);

    const btnGuardar = await driver.wait(
      until.elementLocated(By.xpath('//button[@title="Guardar"]')),
      TIMEOUT
    );
    await btnGuardar.click();
    await driver.sleep(PAUSE * 2);
  });

  it('Debe verificar que el agente fue actualizado con el nuevo nombre', async () => {
    const row = await driver.wait(
      until.elementLocated(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]')
      ),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await row.isDisplayed()).toBe(true);
  });

  it('Debe mostrar la confirmación "¿Seguro?" al presionar Eliminar', async () => {
    const btnEliminar = await driver.wait(
      until.elementLocated(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]//button[@title="Eliminar"]')
      ),
      TIMEOUT
    );
    await btnEliminar.click();
    await driver.sleep(PAUSE);

    const confirmLabel = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"¿Seguro?")]')),
      TIMEOUT
    );
    expect(await confirmLabel.isDisplayed()).toBe(true);
  });

  it('Debe confirmar la eliminación y quitar el agente de la lista', async () => {
    await driver.wait(async () => {
      const overlays = await driver.findElements(By.css('.cdk-overlay-backdrop-showing'));
      return overlays.length === 0;
    }, TIMEOUT).catch(() => {});

    const btnSi = await driver.wait(
      until.elementLocated(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]//button[contains(.,"Sí")]')
      ),
      TIMEOUT
    );
    await btnSi.click();
    await driver.wait(async () => {
      const items = await driver.findElements(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]')
      );
      return items.length === 0;
    }, NAV_TIMEOUT);

    const restantes = await driver.findElements(
      By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]')
    );
    expect(restantes.length).toBe(0);
  });

  // ── Regresar ────────────────────────────────────────────────────────────────

  it('Debe regresar al home-page desde el Panel de Agentes', async () => {
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