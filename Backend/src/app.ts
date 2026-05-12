import express from 'express';
import cors from 'cors';
import swaggerJsDoc from 'swagger-jsdoc';
import { setup, serve } from 'swagger-ui-express';
import swaggerOptions from './swagger.config';

import routes from './app/routes';
import passport from './app/auth/google';

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';

app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use(routes);

app.get('/', (_req, res) => {
  res.send('La api funciona (navegador)');
});

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.get('/swagger.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocs);
});
app.use('/swagger', serve, setup(swaggerDocs));

export default app;
