const sendMailMock = jest.fn();

jest.mock('../app/mailer/model', () => ({
  mailer: {
    sendMail: sendMailMock,
    verify: jest.fn().mockResolvedValue(true),
  },
}));

import { Request, Response } from 'express';
import { sendEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../app/mailer/controller';

describe('Mailer Controller Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let sendResMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    sendResMock = jest.fn();
    res = { send: sendResMock } as unknown as Response;
  });

  // ─── sendEmail ───────────────────────────────────────────────────────────────

  describe('sendEmail()', () => {
    it('Debe llamar a mailer.sendMail y responder con "Correo enviado" en éxito', async () => {
      req = { query: { email: 'destino@test.com' } };
      sendMailMock.mockResolvedValue({});

      sendEmail(req as Request, res as Response);

      await new Promise(resolve => setImmediate(resolve));

      expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
        to: 'destino@test.com',
      }));
      expect(sendResMock).toHaveBeenCalledWith('Correo enviado');
    });

    it('Debe responder con "Error: ..." si mailer.sendMail falla', async () => {
      req = { query: { email: 'destino@test.com' } };
      sendMailMock.mockRejectedValue(new Error('SMTP timeout'));

      sendEmail(req as Request, res as Response);

      await new Promise(resolve => setImmediate(resolve));

      expect(sendResMock).toHaveBeenCalledWith(expect.stringContaining('Error:'));
    });

    it('Debe usar el correo del query como destinatario', async () => {
      req = { query: { email: 'usuario@empresa.com' } };
      sendMailMock.mockResolvedValue({});

      sendEmail(req as Request, res as Response);
      await new Promise(resolve => setImmediate(resolve));

      const callArgs = sendMailMock.mock.calls[0][0];
      expect(callArgs.to).toBe('usuario@empresa.com');
    });
  });

  // ─── sendWelcomeEmail ────────────────────────────────────────────────────────

  describe('sendWelcomeEmail()', () => {
    it('Debe llamar a mailer.sendMail con el destinatario correcto', async () => {
      sendMailMock.mockResolvedValue({});

      await sendWelcomeEmail('nuevo@test.com', 'Juan');

      expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
        to: 'nuevo@test.com',
        subject: 'Bienvenido a Market-AI',
      }));
    });

    it('Debe incluir el nombre del usuario en el HTML', async () => {
      sendMailMock.mockResolvedValue({});

      await sendWelcomeEmail('user@test.com', 'María');

      const callArgs = sendMailMock.mock.calls[0][0];
      expect(callArgs.html).toContain('María');
    });

    it('Debe propagar el error si mailer.sendMail falla', async () => {
      sendMailMock.mockRejectedValue(new Error('SMTP error'));

      await expect(sendWelcomeEmail('fail@test.com', 'Test')).rejects.toThrow('SMTP error');
    });
  });

  // ─── sendPasswordResetEmail ──────────────────────────────────────────────────

  describe('sendPasswordResetEmail()', () => {
    it('Debe llamar a mailer.sendMail con el asunto correcto', async () => {
      sendMailMock.mockResolvedValue({});

      await sendPasswordResetEmail('reset@test.com', 'Pedro', 'https://app.com/reset?token=abc');

      expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
        to: 'reset@test.com',
        subject: 'Restablecer tu contraseña - Market-AI',
      }));
    });

    it('Debe incluir el enlace de restablecimiento en el HTML', async () => {
      sendMailMock.mockResolvedValue({});
      const resetLink = 'https://app.com/reset?token=test123';

      await sendPasswordResetEmail('reset@test.com', 'Pedro', resetLink);

      const callArgs = sendMailMock.mock.calls[0][0];
      expect(callArgs.html).toContain(resetLink);
    });

    it('Debe incluir el nombre del usuario en el HTML', async () => {
      sendMailMock.mockResolvedValue({});

      await sendPasswordResetEmail('reset@test.com', 'Sofía', 'https://link.com');

      const callArgs = sendMailMock.mock.calls[0][0];
      expect(callArgs.html).toContain('Sofía');
    });

    it('Debe incluir el enlace de restablecimiento en el texto plano', async () => {
      sendMailMock.mockResolvedValue({});
      const resetLink = 'https://app.com/reset?token=abc';

      await sendPasswordResetEmail('reset@test.com', 'Luis', resetLink);

      const callArgs = sendMailMock.mock.calls[0][0];
      expect(callArgs.text).toContain(resetLink);
    });

    it('Debe propagar el error si mailer.sendMail falla', async () => {
      sendMailMock.mockRejectedValue(new Error('Connection refused'));

      await expect(
        sendPasswordResetEmail('fail@test.com', 'Test', 'https://link.com')
      ).rejects.toThrow('Connection refused');
    });
  });
});
