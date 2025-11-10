import express from 'express';

import dotenv from 'dotenv';
dotenv.config();

import swaggerJsDoc from 'swagger-jsdoc'
import { setup, serve } from 'swagger-ui-express'
import swaggerOptions from '../swagger.config';
import { dbConnect } from './database';

import routes from './app/routes';

const app = express();

app.use(routes); //aqui usamos el archivo que contiene todas las rutas

app.get('', (req, res) => {
    res.send('La api funciona (navegador)')
})

const PORT = process.env.PORT || 3000;
//obtenemos el documento
const swaggerDocs = swaggerJsDoc(swaggerOptions);
//creamos la ruta (en forma de middleware)
app.use('/swagger', serve, setup(swaggerDocs));

dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(() => {
  console.log('Error al conectarse a la base de datos')
})

const server = app.listen(PORT, () => {
  console.log(`app is running in port ${PORT}`) //app.listen me retorna un tipo de dato llamado server
})