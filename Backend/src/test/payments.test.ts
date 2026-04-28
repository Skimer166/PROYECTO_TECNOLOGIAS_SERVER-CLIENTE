const mockSessionCreate = jest.fn();
const mockSessionRetrieve = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: mockSessionCreate,
        retrieve: mockSessionRetrieve,
      },
    },
  }));
});

jest.mock('../app/users/model', () => ({
  UserModel: {
    findById: jest.fn(),
  },
}));

import { Request, Response } from 'express';
import { createCheckoutSession, verifyPaymentSuccess } from '../app/payments/controller';
import { UserModel } from '../app/users/model';

describe('Payments Controller Unit Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = {
      status: statusMock,
      json: jsonMock,
    } as unknown as Response;
  });

  // ─── createCheckoutSession ───────────────────────────────────────────────────

  describe('createCheckoutSession()', () => {
    it('Debe retornar 400 si no se proporciona amount', async () => {
      req = { body: {}, user: { id: 'user123' } } as unknown as Request;

      await createCheckoutSession(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'El monto mínimo es $10' });
    });

    it('Debe retornar 400 si amount es menor a 10', async () => {
      req = { body: { amount: 5 }, user: { id: 'user123' } } as unknown as Request;

      await createCheckoutSession(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'El monto mínimo es $10' });
    });

    it('Debe retornar 400 si amount es exactamente 0', async () => {
      req = { body: { amount: 0 }, user: { id: 'user123' } } as unknown as Request;

      await createCheckoutSession(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'El monto mínimo es $10' });
    });

    it('Debe retornar la URL de la sesión de Stripe si amount es válido', async () => {
      req = { body: { amount: 50 }, user: { id: 'user123' } } as unknown as Request;
      mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/test-session' });

      await createCheckoutSession(req as Request, res as Response);

      expect(mockSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
        mode: 'payment',
        payment_method_types: ['card'],
      }));
      expect(jsonMock).toHaveBeenCalledWith({ url: 'https://checkout.stripe.com/test-session' });
    });

    it('Debe incluir el userId y creditsAmount en los metadata de Stripe', async () => {
      req = { body: { amount: 100 }, user: { id: 'user456' } } as unknown as Request;
      mockSessionCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/abc' });

      await createCheckoutSession(req as Request, res as Response);

      const callArgs = mockSessionCreate.mock.calls[0][0];
      expect(callArgs.metadata.userId).toBe('user456');
      expect(callArgs.metadata.creditsAmount).toBe('100');
    });

    it('Debe retornar 500 si Stripe lanza error', async () => {
      req = { body: { amount: 20 }, user: { id: 'user123' } } as unknown as Request;
      mockSessionCreate.mockRejectedValue(new Error('Stripe API error'));

      await createCheckoutSession(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al crear sesión de pago' });
    });
  });

  // ─── verifyPaymentSuccess ────────────────────────────────────────────────────

  describe('verifyPaymentSuccess()', () => {
    it('Debe retornar 400 si no se proporciona session_id', async () => {
      req = { body: {} } as unknown as Request;

      await verifyPaymentSuccess(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Falta session_id' });
    });

    it('Debe retornar 400 si el pago no está marcado como "paid"', async () => {
      req = { body: { session_id: 'sess_test' } } as unknown as Request;
      mockSessionRetrieve.mockResolvedValue({
        payment_status: 'unpaid',
        metadata: { userId: 'user123', creditsAmount: '50' },
      });

      await verifyPaymentSuccess(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Pago no válido o no encontrado' });
    });

    it('Debe agregar créditos al usuario y retornar 200 si el pago fue exitoso', async () => {
      req = { body: { session_id: 'sess_paid' } } as unknown as Request;
      mockSessionRetrieve.mockResolvedValue({
        payment_status: 'paid',
        metadata: { userId: 'user123', creditsAmount: '100' },
      });

      const mockUser = { credits: 200, save: jest.fn().mockResolvedValue(true) };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      await verifyPaymentSuccess(req as Request, res as Response);

      expect(mockUser.credits).toBe(300);
      expect(mockUser.save).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ success: true, newCredits: 300 });
    });

    it('Debe retornar 400 si el usuario no existe en BD', async () => {
      req = { body: { session_id: 'sess_paid' } } as unknown as Request;
      mockSessionRetrieve.mockResolvedValue({
        payment_status: 'paid',
        metadata: { userId: 'noexiste', creditsAmount: '50' },
      });
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await verifyPaymentSuccess(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Pago no válido o no encontrado' });
    });

    it('Debe retornar 500 si Stripe lanza error al recuperar sesión', async () => {
      req = { body: { session_id: 'sess_error' } } as unknown as Request;
      mockSessionRetrieve.mockRejectedValue(new Error('Stripe retrieve error'));

      await verifyPaymentSuccess(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Error verificando pago' });
    });
  });
});
