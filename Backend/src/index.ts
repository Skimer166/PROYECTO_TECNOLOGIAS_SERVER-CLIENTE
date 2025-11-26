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

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

const app = express();

//conectar el http server y el socketio
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
});
export { io };

const JWT_SECRET = process.env.SECRET_KEY ?? process.env.JWT_KEY ?? 'dev-secret';

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token as string | undefined;

  if (token) {
    try {
      const clean = token.replace('Bearer ', '');
      const decoded: any = jwt.verify(clean, JWT_SECRET);
      const userId = decoded.sub || decoded.id;
      if (userId) {
        socket.join(String(userId));
        console.log('Socket conectado para usuario', userId);
      }
    } catch (err) {
      console.log('Error verificando token en socket:', err);
    }
  }

  console.log('Cliente conectado', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado', socket.id);
  });
});

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