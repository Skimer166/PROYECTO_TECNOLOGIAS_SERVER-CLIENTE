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
import { SupportSession } from './app/interfaces/support'; //interfaz para soporte

const app = express();

// conectar el http server y el socketio
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: 'http://localhost:4200',
    credentials: true,
  },
});
export { io };

const JWT_SECRET = process.env.SECRET_KEY ?? process.env.JWT_KEY ?? 'dev-secret';

let activeSessions: Record<string, SupportSession> = {};

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token as string | undefined;
  let currentUser: any = null;

  if (token) {
    try {
      const clean = token.replace('Bearer ', '');
      const decoded: any = jwt.verify(clean, JWT_SECRET);
      
      currentUser = {
        id: decoded.sub || decoded.id,
        name: decoded.name,
        role: decoded.role
      };

      if (currentUser.id) {
        socket.join(String(currentUser.id));
        console.log('Socket conectado para usuario', currentUser.id);

        // si eres admin...
        if (currentUser.role === 'admin') {
            socket.join('admins');
            //le damos lls chats abiertos
            socket.emit('support:active-sessions', Object.values(activeSessions));
        }
      }
    } catch (err) {
      console.log('Error verificando token en socket:', err);
    }
  }

  console.log('Cliente conectado', socket.id);
  // cuando el usuario abre el chat
  socket.on('support:join', () => {
    if (!currentUser) {
      console.log('Intento de soporte sin usuario autenticado. Socket ID:', socket.id);
      return;
    }

    const roomId = `support-${currentUser.id}`;
    socket.join(roomId);

    if (!activeSessions[currentUser.id]) {
      activeSessions[currentUser.id] = {
        userId: currentUser.id,
        userName: currentUser.name,
        messages: [],
        active: true
      };
      // avisamos a los administradores que hay un cliente en soporte
      io.to('admins').emit('support:new-session', activeSessions[currentUser.id]);
    }
    const sysMsg = { sender: 'System', text: `${currentUser.name} se ha unido al chat.`, time: new Date(), isSystem: true };
    
    activeSessions[currentUser.id].messages.push(sysMsg);
    
    io.to(roomId).emit('support:message', sysMsg);
  });

  // un admin se une al chat
  socket.on('support:admin-join', (targetUserId: string) => {
    if (currentUser?.role !== 'admin') return;
    
    const roomId = `support-${targetUserId}`;
    socket.join(roomId);
    
    const session = activeSessions[targetUserId];
    if (session) {
        socket.emit('support:chat-history', session.messages);
    }
  });

  // se envia algun mensaje
  socket.on('support:send-message', (data: { text: string, targetUserId?: string }) => {
    if (!currentUser) return;

    const targetId = (currentUser.role === 'admin' && data.targetUserId) ? data.targetUserId : currentUser.id;
    const roomId = `support-${targetId}`;

    const msg = { sender: currentUser.name, text: data.text, time: new Date(), isSystem: false };
    
    if (activeSessions[targetId]) {
      activeSessions[targetId].messages.push(msg);
    }

    io.to(roomId).emit('support:message', msg);
  });

  // un usuario da por terminado el soporte
  socket.on('support:close', () => {
    if (!currentUser) return;
    const roomId = `support-${currentUser.id}`;
    
    const sysMsg = { sender: 'System', text: `${currentUser.name} ha abandonado el chat.`, time: new Date(), isSystem: true };
    io.to(roomId).emit('support:message', sysMsg);
    
    socket.leave(roomId);
    
    delete activeSessions[currentUser.id];
    
    io.to('admins').emit('support:session-closed', currentUser.id);
  });

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
  httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(() => {
  console.log('Error al conectarse a la base de datos')
});