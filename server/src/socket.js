const { Server } = require('socket.io');

function initSignalingServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // Allows connections from your client on Vercel
      methods: ['GET', 'POST'],
    },
  });

  // Track connected user emails to their active socket IDs for instant calling
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    // 1. Register user terminal session upon opening workspace
    socket.on('register-user', (userEmail) => {
      if (userEmail) {
        const cleanEmail = userEmail.toLowerCase().trim();
        connectedUsers.set(cleanEmail, socket.id);
        socket.userEmail = cleanEmail;
      }
    });

    // 2. Handle immediate call initiation (rings partner instantly)
    socket.on('initiate-call', ({ targetEmail, callerEmail, topic, roomToken }) => {
      if (!targetEmail) return;
      const cleanTarget = targetEmail.toLowerCase().trim();
      const targetSocketId = connectedUsers.get(cleanTarget);

      const callPayload = {
        callerEmail,
        topic: topic || 'Direct Mentorship Review',
        roomToken: roomToken || `room-${Date.now()}`,
      };

      if (targetSocketId) {
        io.to(targetSocketId).emit('incoming-call', callPayload);
      } else {
        // Fallback broadcast channel for offline or reloading targets
        io.emit(`incoming-call-${cleanTarget}`, callPayload);
      }
    });

    // 3. When mentor or mentee joins a call room
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

      // User disconnects from room
      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', { socketId: socket.id });
      });
    });

    // Clean up mapping on total disconnect
    socket.on('disconnect', () => {
      if (socket.userEmail) {
        connectedUsers.delete(socket.userEmail);
      }
    });
  });

  return io;
}

module.exports = initSignalingServer;