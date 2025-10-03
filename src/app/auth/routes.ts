import { Router } from "express";
import {login, signup} from "./controller";

const router = Router();

router.post('/login', login);    //se pone solamente login porque creamos la funcion en otro archivo
router.post('/signup', signup);

export default router;