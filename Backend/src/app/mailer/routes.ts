import { Router } from "express";
import { sendEmail } from "./controller";

const router = Router();

router.get('/email', sendEmail);

export default router;