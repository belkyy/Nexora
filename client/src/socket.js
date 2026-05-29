import { io } from 'socket.io-client';

// Sunucunun çalıştığı adrese bağlandığından emin ol
export const socket = io('http://localhost:3001');