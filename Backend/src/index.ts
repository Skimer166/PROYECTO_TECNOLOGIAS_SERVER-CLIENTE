import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import swaggerJsDoc from 'swagger-jsdoc';
import { setup, serve } from 'swagger-ui-express';
import swaggerOptions from './swagger.config';
import { dbConnect } from './database';

import routes from './app/routes';
import passport from './app/auth/google';

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SupportSession } from './app/interfaces/support';

const app = express();

const httpServer = createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});
export { io };

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use(routes);

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

        if (currentUser.role === 'admin') {
            socket.join('admins');
            socket.emit('support:active-sessions', Object.values(activeSessions));
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  socket.on('support:join', () => {
    if (!currentUser) {
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
      io.to('admins').emit('support:new-session', activeSessions[currentUser.id]);
    }
    const sysMsg = { sender: 'System', text: `${currentUser.name} se ha unido al chat.`, time: new Date(), isSystem: true };
    
    activeSessions[currentUser.id].messages.push(sysMsg);
    
    io.to(roomId).emit('support:message', sysMsg);
  });

  socket.on('support:admin-join', (targetUserId: string) => {
    if (currentUser?.role !== 'admin') return;
    
    const roomId = `support-${targetUserId}`;
    socket.join(roomId);
    
    const session = activeSessions[targetUserId];
    if (session) {
        socket.emit('support:chat-history', session.messages);
    }
  });

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

app.get('/', (req, res) => {
    res.send('La api funciona (navegador)')
});

const PORT = process.env.PORT || 3000;

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