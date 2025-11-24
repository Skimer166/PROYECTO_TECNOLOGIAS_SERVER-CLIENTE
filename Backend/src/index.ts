import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import swaggerJsDoc from 'swagger-jsdoc';
import { setup, serve } from 'swagger-ui-express';
import swaggerOptions from '../swagger.config';
import { dbConnect } from './database';

import routes from './app/routes';
import passport from './app/auth/google';

const app = express();

// google Auth
app.use(passport.initialize());

// middlewares
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use(routes); 

app.get('/', (req, res) => {
    res.send('La api funciona (navegador)')
});

const PORT = process.env.PORT || 3000;

//swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});
app.use('/swagger', serve, setup(swaggerDocs));

dbConnect().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(() => {
  console.log('Error al conectarse a la base de datos')
});