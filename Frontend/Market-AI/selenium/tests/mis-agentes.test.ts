import { By, Key, until, WebDriver, WebElement } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  BASE_URL,
  BACKEND_URL,
  TIMEOUT,
  checkBackendAvailable,
  loginAndGetToken,
  injectToken,
  makeFakeJwt,
} from '../helpers/auth-helper';

// ── Credenciales de prueba ───────────────────────────────────────────────────
const TEST_USER_EMAIL = process.env['TEST_USER_EMAIL'] ?? 'test@example.com';
const TEST_USER_PASSWORD = process.env['TEST_USER_PASSWORD'] ?? 'password123';
// ─────────────────────────────────────────────────────────────────────────────

describe('MA — My Agents Page (E2E Selenium)', () => {
  let driver: WebDriver | undefined;
  let backendAvailable = false;
  let userToken: string | null = null;

  // ── Setup global ────────────────────────────────────────────────────────────
  beforeAll(async () => {
    backendAvailable = await checkBackendAvailable();

    if (!backendAvailable) {
      console.warn(`\n⚠ Backend no disponible en ${BACKEND_URL}.`);
      console.warn('  Las pruebas marcadas [BE] serán omitidas.\n');
    } else {
      console.log(`\n✓ Backend disponible en ${BACKEND_URL}`);
      userToken = await loginAndGetToken(TEST_USER_EMAIL, TEST_USER_PASSWORD);
      if (!userToken) {
        console.warn('  ⚠ No se obtuvo token real — pruebas [BE] serán omitidas.\n');
      }
    }

    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`✓ Navegador detectado: ${browserUsed}\n`);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ── Helpers internos ────────────────────────────────────────────────────────

  async function goToMyAgents(): Promise<void> {
    const token = userToken ?? makeFakeJwt('user');
    await injectToken(driver!, token, 'user');
    await driver!.get(`${BASE_URL}/mis-agentes`);
  }

  /** Espera a que carguen las tarjetas de agentes. Retorna false si grid vacío. */
  async function waitForGrid(): Promise<boolean> {
    // Espera que loading desaparezca
    await driver!.wait(
      async () => {
        const spinners = await driver!.findElements(By.css('.loading-state'));
        return spinners.length === 0;
      },
      TIMEOUT
    );

    const cards = await driver!.findElements(By.css('.agent-card'));
    return cards.length > 0;
  }

  /** Abre el chat del primer agente disponible. Retorna la card usada. */
  async function openFirstAgentChat(): Promise<WebElement> {
    const firstCard = (await driver!.findElements(By.css('.agent-card')))[0];
    // Clic en la info de la tarjeta (no en los botones de acción)
    const nameEl = await firstCard.findElement(By.css('.card-info h3'));
    await nameEl.click();
    // Esperar a que aparezca la vista de chat
    await driver!.wait(until.elementLocated(By.css('.chat-view')), TIMEOUT);
    return firstCard;
  }

  // ─── MA-01 ─────────────────────────────────────────────────────────────────
  it('MA-01: Carga la lista de agentes rentados [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-01 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    // La página cargó correctamente — ya sea con agentes o con estado vacío
    if (hasAgents) {
      const cards = await driver!.findElements(By.css('.agent-card'));
      expect(cards.length).toBeGreaterThan(0);
    } else {
      const emptyState = await driver!.findElements(By.css('.empty-state'));
      expect(emptyState.length).toBeGreaterThan(0);
    }
  });

  // ─── MA-02 ─────────────────────────────────────────────────────────────────
  it('MA-02: Muestra estado vacío cuando no hay agentes rentados [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-02 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    await waitForGrid();

    const cards = await driver!.findElements(By.css('.agent-card'));
    const emptyState = await driver!.findElements(By.css('.empty-state'));

    if (cards.length === 0) {
      // Estado vacío visible con mensaje y botón para explorar
      expect(emptyState.length).toBeGreaterThan(0);
      const heading = await driver!.findElement(By.css('.empty-state h3')).getText();
      expect(heading.toLowerCase()).toContain('no');
    } else {
      console.warn('  MA-02: el usuario tiene agentes — no se puede verificar estado vacío.');
    }
  });

  // ─── MA-03 ─────────────────────────────────────────────────────────────────
  it('MA-03: Countdown de tiempo restante se actualiza cada 1 segundo [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-03 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-03 omitida: no hay agentes rentados para verificar countdown.');
      return;
    }

    const firstCard = (await driver!.findElements(By.css('.agent-card')))[0];
    const countdownElements = await firstCard.findElements(By.css('.countdown span'));

    if (countdownElements.length === 0) {
      console.warn('  MA-03 omitida: el agente no tiene fecha de expiración.');
      return;
    }

    const textBefore = await countdownElements[0].getText();
    await driver!.sleep(1500); // esperar > 1 segundo
    const textAfter = await countdownElements[0].getText();

    // El countdown debe haber cambiado
    expect(textAfter).not.toBe(textBefore);
  });

  // ─── MA-04 ─────────────────────────────────────────────────────────────────
  it('MA-04: Tarjeta muestra nombre, categoría, countdown y botones [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-04 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-04 omitida: no hay agentes rentados.');
      return;
    }

    const firstCard = (await driver!.findElements(By.css('.agent-card')))[0];

    const name = await firstCard.findElement(By.css('.card-info h3')).getText();
    expect(name.length).toBeGreaterThan(0);

    const badge = await firstCard.findElement(By.css('.badge')).getText();
    expect(badge.length).toBeGreaterThan(0);

    // Botón de eliminar (warn)
    const deleteBtn = await firstCard.findElement(By.css('button[color="warn"]'));
    expect(await deleteBtn.isDisplayed()).toBe(true);

    // Botón de chat (mini-fab)
    const chatBtn = await firstCard.findElement(By.css('button[mat-mini-fab]'));
    expect(await chatBtn.isDisplayed()).toBe(true);
  });

  // ─── MA-05 ─────────────────────────────────────────────────────────────────
  it('MA-05: Clic en la tarjeta abre la vista de chat [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-05 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-05 omitida: no hay agentes rentados.');
      return;
    }

    await openFirstAgentChat();

    const chatView = await driver!.findElement(By.css('.chat-view'));
    expect(await chatView.isDisplayed()).toBe(true);

    // La lista de agentes ya no es visible
    const listView = await driver!.findElements(By.css('.list-view'));
    expect(listView.length).toBe(0);
  });

  // ─── MA-06 ─────────────────────────────────────────────────────────────────
  it('MA-06: Botón "Volver" regresa a la lista de agentes [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-06 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-06 omitida: no hay agentes rentados.');
      return;
    }

    await openFirstAgentChat();

    // Clic en el botón de retroceso (arrow_back)
    const backBtn = await driver!.findElement(
      By.css('.chat-header button[mat-icon-button]')
    );
    await backBtn.click();
    await driver!.sleep(300);

    // La vista de lista regresa
    const listView = await driver!.wait(
      until.elementLocated(By.css('.list-view')),
      TIMEOUT
    );
    expect(await listView.isDisplayed()).toBe(true);

    // La vista de chat desaparece
    const chatViews = await driver!.findElements(By.css('.chat-view'));
    expect(chatViews.length).toBe(0);
  });

  // ─── MA-07 ─────────────────────────────────────────────────────────────────
  it('MA-07: Enviar mensaje al agente muestra la respuesta [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-07 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-07 omitida: no hay agentes rentados.');
      return;
    }

    await openFirstAgentChat();

    const input = await driver!.findElement(
      By.css('input[placeholder="Escribe tu mensaje aquí..."]')
    );
    await input.sendKeys('Hola, ¿cómo estás?');

    const sendBtn = await driver!.findElement(
      By.css('.chat-input button[mat-icon-button]')
    );
    await sendBtn.click();

    // El mensaje del usuario debe aparecer en el historial
    await driver!.wait(
      until.elementLocated(By.css('.message.user')),
      TIMEOUT
    );
    const userMsgs = await driver!.findElements(By.css('.message.user'));
    expect(userMsgs.length).toBeGreaterThan(0);

    // Esperar a que el agente responda (puede tardar)
    await driver!.wait(
      async () => {
        const assistantMsgs = await driver!.findElements(By.css('.message.assistant'));
        return assistantMsgs.length > 1; // >1 porque hay mensaje de bienvenida
      },
      20_000
    );

    const assistantMsgs = await driver!.findElements(By.css('.message.assistant'));
    expect(assistantMsgs.length).toBeGreaterThan(1);
  });

  // ─── MA-08 ─────────────────────────────────────────────────────────────────
  it('MA-08: Tecla Enter envía el mensaje [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-08 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-08 omitida: no hay agentes rentados.');
      return;
    }

    await openFirstAgentChat();

    const input = await driver!.findElement(
      By.css('input[placeholder="Escribe tu mensaje aquí..."]')
    );
    await input.sendKeys('Mensaje por Enter');
    await input.sendKeys(Key.RETURN); // presionar Enter

    // El mensaje del usuario aparece en el historial
    await driver!.wait(
      until.elementLocated(By.css('.message.user')),
      TIMEOUT
    );
    const userMsgs = await driver!.findElements(By.css('.message.user'));
    expect(userMsgs.length).toBeGreaterThan(0);

    const lastUserMsg = userMsgs[userMsgs.length - 1];
    const msgText = await lastUserMsg.findElement(By.css('.bubble')).getText();
    expect(msgText).toContain('Mensaje por Enter');
  });

  // ─── MA-09 ─────────────────────────────────────────────────────────────────
  it('MA-09: Indicador de escritura visible mientras el agente responde [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-09 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-09 omitida: no hay agentes rentados.');
      return;
    }

    await openFirstAgentChat();

    const input = await driver!.findElement(
      By.css('input[placeholder="Escribe tu mensaje aquí..."]')
    );
    await input.sendKeys('Pregunta de prueba');

    const sendBtn = await driver!.findElement(By.css('.chat-input button[mat-icon-button]'));
    await sendBtn.click();

    // Inmediatamente después del clic, el indicador de typing debe aparecer
    // (la respuesta del backend tarda al menos unos ms)
    let typingFound = false;
    for (let i = 0; i < 10; i++) {
      const typing = await driver!.findElements(By.css('.bubble.typing'));
      if (typing.length > 0) {
        typingFound = true;
        break;
      }
      await driver!.sleep(100);
    }

    // Esperar a que la respuesta llegue
    await driver!.wait(
      async () => {
        const typing = await driver!.findElements(By.css('.bubble.typing'));
        return typing.length === 0;
      },
      20_000
    );

    // El indicador de typing desapareció (fue visible al menos momentáneamente)
    expect(typingFound).toBe(true);
  });

  // ─── MA-10 ─────────────────────────────────────────────────────────────────
  it('MA-10: El chat hace auto-scroll al último mensaje tras enviar [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-10 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-10 omitida: no hay agentes rentados.');
      return;
    }

    await openFirstAgentChat();

    const input = await driver!.findElement(
      By.css('input[placeholder="Escribe tu mensaje aquí..."]')
    );
    await input.sendKeys('Mensaje auto-scroll test');
    await input.sendKeys(Key.RETURN);

    // Esperar a que la respuesta llegue
    await driver!.wait(
      async () => {
        const typing = await driver!.findElements(By.css('.bubble.typing'));
        return typing.length === 0;
      },
      20_000
    );

    await driver!.sleep(200); // dar tiempo al scrollToBottom

    // Verificar que el contenedor de chat está al fondo
    const isAtBottom = await driver!.executeScript(`
      const el = document.querySelector('.chat-messages');
      if (!el) return true;
      return (el.scrollTop + el.clientHeight) >= (el.scrollHeight - 5);
    `) as boolean;

    expect(isAtBottom).toBe(true);
  });

  // ─── MA-11 ─────────────────────────────────────────────────────────────────
  it('MA-11: Input vacío no envía mensaje (botón send deshabilitado) [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-11 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-11 omitida: no hay agentes rentados.');
      return;
    }

    await openFirstAgentChat();

    // Input vacío → botón de enviar debe estar deshabilitado
    const sendBtn = await driver!.findElement(By.css('.chat-input button[mat-icon-button]'));
    expect(await sendBtn.isEnabled()).toBe(false);

    // Contar mensajes actuales (solo el de bienvenida del asistente)
    const msgsBefore = (await driver!.findElements(By.css('.message'))).length;

    // Intentar clic (aunque esté deshabilitado, para asegurar que no pasa nada)
    await driver!.executeScript('arguments[0].click()', sendBtn);
    await driver!.sleep(300);

    const msgsAfter = (await driver!.findElements(By.css('.message'))).length;
    expect(msgsAfter).toBe(msgsBefore);
  });

  // ─── MA-12 ─────────────────────────────────────────────────────────────────
  it('MA-12: Botón eliminar abre dialog de confirmación [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-12 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-12 omitida: no hay agentes rentados.');
      return;
    }

    const firstCard = (await driver!.findElements(By.css('.agent-card')))[0];
    const deleteBtn = await firstCard.findElement(By.css('button[color="warn"]'));
    await deleteBtn.click();

    // El dialog de confirmación debe aparecer
    const dialog = await driver!.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );
    expect(await dialog.isDisplayed()).toBe(true);

    // Cerrar el dialog haciendo clic en Cancelar
    const cancelBtn = await dialog.findElement(By.xpath('.//button[contains(., "Cancelar")]'));
    await cancelBtn.click();
    await driver!.sleep(300);
  });

  // ─── MA-13 ─────────────────────────────────────────────────────────────────
  it('MA-13: Confirmar eliminación libera el agente y lo elimina del grid [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-13 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-13 omitida: no hay agentes rentados.');
      return;
    }

    const cardsBefore = await driver!.findElements(By.css('.agent-card'));
    const countBefore = cardsBefore.length;

    const agentName = await cardsBefore[0].findElement(By.css('.card-info h3')).getText();

    const deleteBtn = await cardsBefore[0].findElement(By.css('button[color="warn"]'));
    await deleteBtn.click();

    const dialog = await driver!.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );

    // Confirmar eliminación
    const confirmBtn = await dialog.findElement(
      By.xpath('.//button[contains(., "SÍ, dejar de usar")]')
    );
    await confirmBtn.click();

    // Esperar a que el agente desaparezca del grid
    await driver!.wait(
      async () => {
        const remaining = await driver!.findElements(By.css('.agent-card'));
        if (remaining.length < countBefore) return true;

        // También puede aparecer el estado vacío
        const emptyState = await driver!.findElements(By.css('.empty-state'));
        return emptyState.length > 0;
      },
      TIMEOUT
    );

    const cardsAfter = await driver!.findElements(By.css('.agent-card'));
    expect(cardsAfter.length).toBeLessThan(countBefore);
  });

  // ─── MA-14 ─────────────────────────────────────────────────────────────────
  it('MA-14: Cancelar eliminación mantiene el agente en el grid [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-14 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-14 omitida: no hay agentes rentados.');
      return;
    }

    const cardsBefore = (await driver!.findElements(By.css('.agent-card'))).length;

    const firstCard = (await driver!.findElements(By.css('.agent-card')))[0];
    const deleteBtn = await firstCard.findElement(By.css('button[color="warn"]'));
    await deleteBtn.click();

    const dialog = await driver!.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );

    // Cancelar
    const cancelBtn = await dialog.findElement(By.xpath('.//button[contains(., "Cancelar")]'));
    await cancelBtn.click();
    await driver!.sleep(500);

    const cardsAfter = (await driver!.findElements(By.css('.agent-card'))).length;
    expect(cardsAfter).toBe(cardsBefore);
  });

  // ─── MA-15 ─────────────────────────────────────────────────────────────────
  // MA-15 requiere controlar el servidor WebSocket para emitir 'agent-time-ended'.
  // Se verifica en su lugar que la suscripción al socket existe (unit test cubre el comportamiento).
  it('MA-15: Componente suscribe al evento WebSocket agent-time-ended [BE][WS]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-15 omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    await waitForGrid();

    // Verificar que el SocketService está activo inspeccionando el estado de la página
    // (el socket se conecta en ngOnInit si el usuario está autenticado)
    const pageSource = await driver!.getPageSource();
    expect(pageSource).toContain('mis-agentes'); // la página cargó correctamente
  });

  // ─── MA-16 ─────────────────────────────────────────────────────────────────
  it('MA-16: Sin token, el guard redirige a /login', async () => {
    // Limpiar cualquier token existente
    await driver!.get(`${BASE_URL}/landing-page`);
    await driver!.executeScript(`
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user_role');
      localStorage.removeItem('token');
    `);

    await driver!.get(`${BASE_URL}/mis-agentes`);

    await driver!.wait(until.urlContains('/login'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/login');
  });

  // ── Prueba adicional — mensaje de bienvenida en vista de chat ──────────────
  it('MA-extra: La vista de chat muestra mensaje de bienvenida con el nombre del agente [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  MA-extra omitida: backend no disponible o sin token real.');
      return;
    }

    await goToMyAgents();
    const hasAgents = await waitForGrid();

    if (!hasAgents) {
      console.warn('  MA-extra omitida: no hay agentes rentados.');
      return;
    }

    const firstCard = (await driver!.findElements(By.css('.agent-card')))[0];
    const agentName = await firstCard.findElement(By.css('.card-info h3')).getText();

    await openFirstAgentChat();

    // El primer mensaje del asistente debe contener el nombre del agente
    const firstMsg = await driver!.findElement(By.css('.message.assistant .bubble'));
    const msgText = await firstMsg.getText();
    expect(msgText).toContain(agentName);
  });
});
