import type { Server } from 'socket.io';

let _io: Server | null = null;

export function initIo(instance: Server): void {
  _io = instance;
}

// Safe accessor — returns null if initIo has not been called (e.g. in tests)
export function getIo(): Server | null {
  return _io;
}
