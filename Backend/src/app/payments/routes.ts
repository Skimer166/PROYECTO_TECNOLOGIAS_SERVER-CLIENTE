import { Router } from 'express';
import { createCheckoutSession, verifyPaymentSuccess } from './controller';
import { verifyToken } from '../middlewares/auth';

const router = Router();

router.post('/create-checkout-session', verifyToken, createCheckoutSession);
router.post('/verify-success', verifyToken, verifyPaymentSuccess);

export default router;