const { Server } = require('socket.io');
const Message = require('./models/Message');

const userSockets = new Map();
let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', (socket) => {
    socket.on('register', async (profileId) => {
      userSockets.set(profileId, socket.id);

      const undeliveredMessages = await Message.find({ receiverId: profileId }).sort({ timestamp: 1 });

      // Ensure the timestamp is valid and convert to the local time
      undeliveredMessages.forEach((msg) => {
        const messageWithTime = {
          ...msg.toObject(),
          timestamp: formatToLocalTime(msg.timestamp), // Convert to local time
        };
        socket.emit('receiveMessage', messageWithTime);
      });

      await Message.deleteMany({ receiverId: profileId });
    });

    socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
      try {
        // Save the message with the current UTC timestamp
        const savedMessage = await Message.create({
          senderId,
          receiverId,
          content,
          timestamp: new Date(), // Store as UTC
        });

        const fetchedMessage = await Message.findById(savedMessage._id);

        // Convert the UTC timestamp to the receiver's local time zone
        const messageWithTime = {
          ...fetchedMessage.toObject(),
          timestamp: formatToLocalTime(fetchedMessage.timestamp), // Convert to local time
        };

        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', messageWithTime);
        }
      } catch (error) {
        console.error('Error saving or delivering message:', error);
      }
    });

    socket.on('disconnect', () => {
      for (let [profileId, socketId] of userSockets) {
        if (socketId === socket.id) {
          userSockets.delete(profileId);
          break;
        }
      }
    });
  });

  return io;
};

// Function to format timestamp to local time
const formatToLocalTime = (timestamp) => {
  // Convert the timestamp to a Date object if it's not already
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', timestamp);
    return '';
  }
  
  // Return the timestamp in a specific time format (HH:mm)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

module.exports = { initializeSocket, userSockets, io };
