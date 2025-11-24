import { Router } from 'express';
import { chatWithAgent } from './controller';
import { verifyToken } from '../middlewares/auth';

const router = Router();


router.post('/', verifyToken, chatWithAgent);

export default router;