const { Server } = require('socket.io');

function initSignalingServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Allows connections from your client on Vercel
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    // When mentor or mentee joins a call room
    socket.on('join-room', ({ roomId, userEmail }) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', { socketId: socket.id, userEmail });

      // Forward WebRTC Offer
      socket.on('offer', ({ sdp, to }) => {
        io.to(to).emit('offer', { sdp, from: socket.id });
      });

      // Forward WebRTC Answer
      socket.on('answer', ({ sdp, to }) => {
        io.to(to).emit('answer', { sdp, from: socket.id });
      });

      // Forward ICE Candidate (Network routing)
      socket.on('ice-candidate', ({ candidate, to }) => {
        io.to(to).emit('ice-candidate', { candidate, from: socket.id });
      });

      // User disconnects
      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', { socketId: socket.id });
      });
    });
  });

  return io;
}

module.exports = initSignalingServer;