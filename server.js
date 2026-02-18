const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, displayName }) => {
    const room = io.sockets.adapter.rooms.get(roomId) || new Set();

    if (room.size >= 2) {
      socket.emit('room-full');
      return;
    }

    socket.data.roomId = roomId;
    socket.data.displayName = displayName;
    socket.join(roomId);

    const peerCount = (io.sockets.adapter.rooms.get(roomId) || new Set()).size;
    socket.emit('room-joined', { peerCount });
    socket.to(roomId).emit('peer-joined', { displayName });
  });

  socket.on('webrtc-offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('webrtc-offer', offer);
  });

  socket.on('webrtc-answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('webrtc-answer', answer);
  });

  socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('webrtc-ice-candidate', candidate);
  });

  socket.on('call-ended', ({ roomId }) => {
    socket.to(roomId).emit('call-ended');
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    const { roomId } = socket.data;
    if (roomId) {
      socket.to(roomId).emit('peer-left');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Free calling app running at http://localhost:${PORT}`);
});
