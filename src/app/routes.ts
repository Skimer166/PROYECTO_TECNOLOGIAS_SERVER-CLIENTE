import { Router, json } from "express";
// import authRoutes from './auth/routes'

const router = Router();    //creamos instancia de router


router.use(json());     //todas las rutas de abajo tendran la funcion json que retorna el middleware
// router.use('/auth', authRoutes)

export default router;
