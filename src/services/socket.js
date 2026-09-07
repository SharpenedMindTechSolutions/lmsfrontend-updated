import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL;

let socket;

export const initiateSocketConnection = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinSessionRoom = (sessionId) => {
  if (socket && sessionId) {
    socket.emit('join_session', sessionId);
  }
};

export const leaveSessionRoom = (sessionId) => {
  if (socket && sessionId) {
    socket.emit('leave_session', sessionId);
  }
};
