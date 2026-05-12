import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

const BASE_URL = 'http://localhost:4200';
const PAUSE = 1000;

describe('Market-AI — Panel de Agentes', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const options = new chrome.Options();
    options.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--start-maximized');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }, 60000);

  afterAll(async () => {
    await driver.sleep(PAUSE);
    if (driver) await driver.quit();
  });

  // ── Landing Page ────────────────────────────────────────────────────────────

  it('Debe abrir la landing page correctamente', async () => {
    await driver.get(`${BASE_URL}/landing-page`);
    await driver.wait(until.titleContains('Market'), 10000);
    await driver.sleep(PAUSE);
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/landing-page');
  });

  it('Debe mostrar el título principal', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"El marketplace donde encuentras")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el botón "Ingresar"', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")] | //a[contains(.,"Ingresar")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await btn.isDisplayed()).toBe(true);
  });

  // ── Login ───────────────────────────────────────────────────────────────────

  it('Debe navegar a la página de login al presionar "Ingresar"', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")]')),
      10000
    );
    await btn.click();
    await driver.wait(until.urlContains('/login'), 10000);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/login');
  });

  it('Debe verificar que la página de login se muestra correctamente', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Inicia sesion en Market AI")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);

    const inputCorreo = await driver.wait(
      until.elementLocated(By.css('input[name="Correo"]')),
      10000
    );
    expect(await inputCorreo.isDisplayed()).toBe(true);

    const inputContrasena = await driver.wait(
      until.elementLocated(By.css('input[name="Contrasena"]')),
      10000
    );
    expect(await inputContrasena.isDisplayed()).toBe(true);
  });

  it('Debe llenar el formulario de login y presionar Enviar', async () => {
    const inputCorreo = await driver.wait(
      until.elementLocated(By.css('input[name="Correo"]')),
      10000
    );
    await inputCorreo.clear();
    await inputCorreo.sendKeys('ianrdzwong@gmail.com');

    const inputContrasena = await driver.wait(
      until.elementLocated(By.css('input[name="Contrasena"]')),
      10000
    );
    await inputContrasena.clear();
    await inputContrasena.sendKeys('123456789');
    await driver.sleep(PAUSE);

    const btnEnviar = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Enviar")]')),
      10000
    );
    await btnEnviar.click();
    await driver.sleep(PAUSE);
  });

  // ── Home Page ───────────────────────────────────────────────────────────────

  it('Debe estar en el home-page después de iniciar sesión', async () => {
    await driver.wait(until.urlContains('/home-page'), 15000);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/home-page');

    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Bienvenido a Market-AI")]')),
      10000
    );
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el panel de administración con sus botones', async () => {
    const panel = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Panel de administración")]')),
      10000
    );
    expect(await panel.isDisplayed()).toBe(true);

    const btnAgentes = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Panel de agentes")]')),
      10000
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
      10000
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btn);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btn);
    await driver.wait(until.urlContains('/admin/agents'), 10000);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/admin/agents');
  });

  it('Debe mostrar el título del Panel de Administración de Agentes', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Panel de Administración de Agentes")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el botón "Crear Agente"', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Crear Agente")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await btn.isDisplayed()).toBe(true);
  });

  it('Debe mostrar las columnas de la tabla de agentes', async () => {
    const colNombre = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Nombre")]')),
      10000
    );
    expect(await colNombre.isDisplayed()).toBe(true);

    const colCategoria = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Categoría")]')),
      10000
    );
    expect(await colCategoria.isDisplayed()).toBe(true);

    const colDescripcion = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Descripción")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await colDescripcion.isDisplayed()).toBe(true);
  });

  // ── Formulario Crear Agente ─────────────────────────────────────────────────

  it('Debe abrir el formulario "Crear Nuevo Agente" al presionar el botón', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Crear Agente")]')),
      10000
    );
    await btn.click();
    const dialog = await driver.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await dialog.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el título "Crear Nuevo Agente" en el formulario', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//*[contains(.,"Crear Nuevo Agente")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar los campos del formulario', async () => {
    const inputNombre = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. Experto Python"]')),
      10000
    );
    expect(await inputNombre.isDisplayed()).toBe(true);

    const inputModelo = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. gpt-4o"]')),
      10000
    );
    expect(await inputModelo.isDisplayed()).toBe(true);

    const inputIdioma = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. es, en"]')),
      10000
    );
    expect(await inputIdioma.isDisplayed()).toBe(true);

    const textareas = await driver.findElements(By.xpath('//mat-dialog-container//textarea'));
    await driver.sleep(PAUSE);
    expect(textareas.length).toBeGreaterThanOrEqual(2);
  });

  it('Debe mostrar los botones "Cancelar" y "Crear Agente" en el formulario', async () => {
    const btnCancelar = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')),
      10000
    );
    expect(await btnCancelar.isDisplayed()).toBe(true);

    const btnCrear = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//button[contains(.,"Crear Agente")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await btnCrear.isDisplayed()).toBe(true);
  });

  it('Debe llenar el formulario con datos válidos', async () => {
    const inputNombre = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. Experto Python"]')),
      10000
    );
    await inputNombre.clear();
    await inputNombre.sendKeys('Agente Selenium Test');

    const inputModelo = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. gpt-4o"]')),
      10000
    );
    await inputModelo.clear();
    await inputModelo.sendKeys('gpt-4o-mini');

    const inputIdioma = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. es, en"]')),
      10000
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
      10000
    );
    await btnCancelar.click();
    await driver.sleep(PAUSE);
    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  it('Debe abrir el formulario de nuevo, llenarlo y presionar "Crear Agente"', async () => {
    const btnAbrirCrear = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Crear Agente")]')),
      10000
    );
    await btnAbrirCrear.click();
    await driver.wait(until.elementLocated(By.css('mat-dialog-container')), 10000);
    await driver.sleep(PAUSE);

    const inputNombre = await driver.wait(
      until.elementLocated(By.xpath('//mat-dialog-container//input[@placeholder="Ej. Experto Python"]')),
      10000
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
      10000
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
      15000
    );
    await driver.sleep(PAUSE);
    expect(await row.isDisplayed()).toBe(true);
  });

  it('Debe abrir el modo edición al presionar el botón Editar', async () => {
    const btnEditar = await driver.wait(
      until.elementLocated(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Demo")]]//button[@title="Editar"]')
      ),
      10000
    );
    await btnEditar.click();
    await driver.sleep(PAUSE);
    const inputEditar = await driver.wait(
      until.elementLocated(By.xpath('//div[contains(@class,"list-row")]//input[@placeholder="Nombre"]')),
      10000
    );
    expect(await inputEditar.isDisplayed()).toBe(true);
  });

  it('Debe modificar el nombre del agente y guardar los cambios', async () => {
    const inputNombre = await driver.wait(
      until.elementLocated(By.xpath('//div[contains(@class,"list-row")]//input[@placeholder="Nombre"]')),
      10000
    );
    await inputNombre.clear();
    await inputNombre.sendKeys('Agente Selenium Editado');
    await driver.sleep(PAUSE);

    const btnGuardar = await driver.wait(
      until.elementLocated(By.xpath('//button[@title="Guardar"]')),
      10000
    );
    await btnGuardar.click();
    await driver.sleep(PAUSE * 2);
  });

  it('Debe verificar que el agente fue actualizado con el nuevo nombre', async () => {
    const row = await driver.wait(
      until.elementLocated(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]')
      ),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await row.isDisplayed()).toBe(true);
  });

  it('Debe mostrar la confirmación "¿Seguro?" al presionar Eliminar', async () => {
    const btnEliminar = await driver.wait(
      until.elementLocated(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]//button[@title="Eliminar"]')
      ),
      10000
    );
    await btnEliminar.click();
    await driver.sleep(PAUSE);

    const confirmLabel = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"¿Seguro?")]')),
      10000
    );
    expect(await confirmLabel.isDisplayed()).toBe(true);
  });

  it('Debe confirmar la eliminación y quitar el agente de la lista', async () => {
    await driver.wait(async () => {
      const overlays = await driver.findElements(By.css('.cdk-overlay-backdrop-showing'));
      return overlays.length === 0;
    }, 10000).catch(() => {});

    const btnSi = await driver.wait(
      until.elementLocated(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]//button[contains(.,"Sí")]')
      ),
      10000
    );
    await btnSi.click();
    await driver.wait(async () => {
      const items = await driver.findElements(
        By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]')
      );
      return items.length === 0;
    }, 15000);

    const restantes = await driver.findElements(
      By.xpath('//div[contains(@class,"list-row")][.//span[contains(.,"Agente Selenium Editado")]]')
    );
    expect(restantes.length).toBe(0);
  });

  // ── Regresar ────────────────────────────────────────────────────────────────

  it('Debe regresar al home-page desde el Panel de Agentes', async () => {
    const btnBack = await driver.wait(
      until.elementLocated(By.css('button[mat-icon-button][routerlink="/home-page"]')),
      10000
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btnBack);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btnBack);
    await driver.wait(until.urlContains('/home-page'), 10000);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/home-page');
  });
});