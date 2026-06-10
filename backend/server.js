// 1. Place this at the VERY TOP of server.js (Line 1)
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const path = require('path'); 
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const transactionRoutes = require('./routes/transactions');
const messageRoutes = require('./routes/messageRoutes');
const { verifyToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// 🌟 Single Source of Truth for Security Operations
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

// Attached with secure dynamic origin matching for credentialed WebSockets handshakes
const io = socketio(server, { 
  cors: { 
    origin: ALLOWED_ORIGIN, 
    methods: ['GET', 'POST'],
    credentials: true 
  },
  transports: ['polling', 'websocket']
});

// DUAL-LAYER BRIDGE: Ensures structural compatibility across all backend architecture paradigms
global.io = io;
app.set('io', io);

// Express Middleware Layer CORS Synchronization
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`📡 Inbound Request Logged -> Method: ${req.method} | Path: ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/listings', verifyToken, itemRoutes);
app.use('/api/reports', verifyToken, reportRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/transactions', verifyToken, transactionRoutes);
app.use('/api/messages', messageRoutes);

// Frontend static asset serving
app.use(express.static(path.join(__dirname, '../web/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../web', 'dist', 'index.html'));
});

// =========================================================================
// 🌟 SOCKET.IO ENGINE CONFIGURATION (ISOLATED PEER COMMUNICATIONS PIPELINE)
// =========================================================================
io.on('connection', (socket) => {
  console.log(`🔌 Socket Connected: ${socket.id}`);

  // Secure identity mapping using clean type casting wrappers
  socket.on('join_room', (userId) => {
    if (userId) {
      const cleanUserId = userId.toString().trim();
      socket.join(cleanUserId);
      console.log(`👤 User [${cleanUserId}] securely joined their private communication room.`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket Disconnected: ${socket.id}`);
  });
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4, 
      serverSelectionTimeoutMS: 30000, 
      heartbeatFrequencyMS: 10000     
    });
    console.log('✅ Mongo connected successfully');
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
};

start();

// Container runtime keep-alive chronoshield
setInterval(() => {
  const https = require('https');
  
  https.get('https://regent-nexus-backend.onrender.com/api/listings', (res) => {
    if (res.statusCode === 200 || res.statusCode === 401) {
      console.log('📡 Keep-Alive Handshake: Cloud container runtime successfully kept hot.');
    } else {
      console.log(`📡 Keep-Alive Handshake: Ping hit server with status code ${res.statusCode}`);
    }
  }).on('error', (e) => {
    console.error('❌ Anti-sleep ping error payload:', e.message);
  });
}, 12 * 60 * 1000);