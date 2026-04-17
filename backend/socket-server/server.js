const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 1) return false; // Stop retrying after 1 attempt for fallback
      return 500;
    }
  }
});

redisClient.on('error', (err) => {
  if (err.code !== 'ECONNREFUSED') console.log('Redis Client Error', err);
});

async function startServer() {
  let redisEnabled = false;
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis');
    redisEnabled = true;

    // Subscribe to Redis channels for cross-service events
    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    await subscriber.subscribe('advisory_ready', (message) => {
      const data = JSON.parse(message);
      io.to(`user_${data.user_id}`).emit('advisory_ready', data);
    });

    await subscriber.subscribe('sos_alert', (message) => {
      const data = JSON.parse(message);
      io.emit('sos_alert', data); // Broadcast to all (officers will filter)
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  Redis connection failed. Running in HTTP FALLBACK MODE.');
      console.warn('Backend will sync with this server via internal REST calls.');
    }
  }

  // --- HTTP Fallback Endpoint ---
  app.post('/api/internal/publish', (req, res) => {
    const { channel, message } = req.body;
    if (!channel || !message) return res.status(400).send('Missing channel or message');

    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      if (channel === 'advisory_ready') {
        io.to(`user_${data.user_id}`).emit('advisory_ready', data);
      } else if (channel === 'sos_alert') {
        io.emit('sos_alert', data);
      }
      res.send({ status: 'ok', source: 'http-fallback' });
    } catch (e) {
      res.status(500).send('Event processing failed');
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
  });
}

startServer();
