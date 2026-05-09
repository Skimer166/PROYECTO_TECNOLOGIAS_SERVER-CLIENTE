import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import app from './app';
import { dbConnect } from './database';
import { initIo } from './io-instance';
import { SupportSession } from './app/interfaces/support';

const httpServer = createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});

initIo(io);

const JWT_SECRET = process.env.SECRET_KEY ?? process.env.JWT_KEY ?? 'dev-secret';

const activeSessions: Record<string, SupportSession> = {};

io.on('connection', (socket) => {
  const token = socket.handshake.auth?.token as string | undefined;
  interface SocketUser { id: string; name?: string; role?: string; }
  let currentUser: SocketUser | null = null;

  if (token) {
    try {
      const clean = token.replace('Bearer ', '');
      const decoded = jwt.verify(clean, JWT_SECRET) as { sub?: string; id?: string; name?: string; role?: string };

      const userId = decoded.sub || decoded.id;
      if (userId) {
        currentUser = {
          id: userId,
          name: decoded.name,
          role: decoded.role
        };

        socket.join(userId);

        if (decoded.role === 'admin') {
          socket.join('admins');
          socket.emit('support:active-sessions', Object.values(activeSessions));
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  socket.on('support:join', () => {
    if (!currentUser) return;

    const roomId = `support-${currentUser.id}`;
    socket.join(roomId);

    if (!activeSessions[currentUser.id]) {
      activeSessions[currentUser.id] = {
        userId: currentUser.id,
        userName: currentUser.name ?? '',
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

    const msg = { sender: currentUser.name ?? '', text: data.text, time: new Date(), isSystem: false };

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

const PORT = process.env.PORT || 3000;

dbConnect().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(() => {
  console.log('Error al conectarse a la base de datos');
});
