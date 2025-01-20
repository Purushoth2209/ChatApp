require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { initializeSocket } = require('./socketio');

// Use the PORT environment variable provided by Render
const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

// Configure CORS to allow requests from your frontend URL
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Use environment variable or fallback to localhost
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(bodyParser.json());

// MongoDB URI from environment variable
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB and start the server
mongoose.connect(mongoURI)
  .then(() => {
    // Set up routes after successful connection to MongoDB
    app.use('/api/auth', authRoutes);
    app.use('/api/messages', messageRoutes);
    initializeSocket(server);
    // Start the server on the specified port
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err);
  });
