import express from 'express';

import dotenv from 'dotenv';
dotenv.config();

import swaggerJsDoc from 'swagger-jsdoc'
import { setup, serve } from 'swagger-ui-express'
import swaggerOptions from '../swagger.config';
import routes from './app/routes';

const app = express();

app.use(routes); //aqui usamos el archivo que contiene todas las rutas

app.get('', (req, res) => {
    res.send('La api funciona (navegador)')
})

const port = process.env.PORT || 3000;

//obtenemos el documento
const swaggerDocs = swaggerJsDoc(swaggerOptions);
//creamos la ruta (en forma de middleware)
app.use('/swagger', serve, setup(swaggerDocs));

app.listen(port, () => {
console.log(`La api esta corriendo en tu puerto ${port}`)
})