// 1. Place this at the VERY TOP of server.js (Line 1)
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
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
const io = socketio(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// Dynamically pull allowed origins from environment properties, fallback cleanly on local
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL // 🌟 Ensure this points to your live frontend url (e.g., https://regentnexus.netlify.app)
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server requests or matching system origins cleanly
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Access denied by security policy. Origin not allowed: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Ensure global json interceptors handle sub-resource routes flawlessly
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global catch-all system node tracker to log rogue 404 paths
app.use((req, res, next) => {
  console.log(`📡 Inbound Request Logged -> Method: ${req.method} | Path: ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/listings', verifyToken, itemRoutes);
app.use('/api/reports', verifyToken, reportRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/transactions', verifyToken, transactionRoutes);

// ✅ MOUNTED PIPELINE: Attach message endpoints behind validation guards
app.use('/api/messages', messageRoutes);

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

// 2. Place this where your "start" function or connection logic is
const start = async () => {
    try {
        // Force the connection to use IPv4 and give it more time to find the Primary
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4, 
            serverSelectionTimeoutMS: 30000, // Increased to 30s for slow local networks
            heartbeatFrequencyMS: 10000     // Checks connection every 10s
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

// =========================================================================
// RENDER LIVE ANTI-SLEEP CHRONO SHIELD (Keeps container runtime hot)
// =========================================================================
setInterval(() => {
  const https = require('https');
  
  // Adjusted endpoint matching your true mounted router tree path
  https.get('https://regent-nexus-backend.onrender.com/api/listings', (res) => {
    if (res.statusCode === 200 || res.statusCode === 401) {
      console.log('📡 Keep-Alive Handshake: Cloud container runtime successfully kept hot.');
    } else {
      console.log(`📡 Keep-Alive Handshake: Ping hit server with status code ${res.statusCode}`);
    }
  }).on('error', (e) => {
    console.error('❌ Anti-sleep ping error payload:', e.message);
  });
}, 12 * 60 * 1000); // Fires reliably every 12 minutes to beat Render's 15-minute sleep timer
