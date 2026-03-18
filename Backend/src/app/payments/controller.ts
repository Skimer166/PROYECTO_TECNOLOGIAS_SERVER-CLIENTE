import { Request, Response } from 'express';
import Stripe from 'stripe';
import { UserModel } from '../users/model';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const { amount } = req.body;
    const userId = req.user?.id;

    if (!amount || amount < 10) { 
      return res.status(400).json({ message: 'El monto mínimo es $10' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Créditos Market-AI',
              description: `Recarga de ${amount} créditos`,
            },
            unit_amount: amount * 100, 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/home-page`,
      metadata: {
        userId: userId ?? null,
        creditsAmount: amount.toString()
      }
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error('Error Stripe:', error);
    res.status(500).json({ message: 'Error al crear sesión de pago' });
  }
}

export async function verifyPaymentSuccess(req: Request, res: Response) {
  try {
    const { session_id } = req.body;

    if (!session_id) return res.status(400).json({ message: 'Falta session_id' });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const userId = session.metadata?.['userId'];
      const creditsToAdd = Number(session.metadata?.['creditsAmount']);

      if (userId && creditsToAdd) {
        const user = await UserModel.findById(userId);
        if (user) {
          user.credits = (user.credits || 0) + creditsToAdd;
          await user.save();
          
          return res.json({ success: true, newCredits: user.credits });
        }
      }
    }

    res.status(400).json({ message: 'Pago no válido o no encontrado' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verificando pago' });
  }
}