// 1. Place this at the VERY TOP of server.js (Line 1)
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const path = require('path'); // 🌟 ADDED: For serving static assets
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

global.io = io;

// 🌟 FIX FOR STEP 1: Relaxed CORS array for easy production pairing
app.use(cors({
  origin: function (origin, callback) {
    // Allows server-to-server requests or any campus domain variant seamlessly
    if (!origin || origin.includes('localhost') || origin.includes('onrender.com')) {
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/listings', verifyToken, itemRoutes);
app.use('/api/reports', verifyToken, reportRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/transactions', verifyToken, transactionRoutes);
app.use('/api/messages', messageRoutes);

// =========================================================================
// 🌟 FIX FOR STEP 2: MOUNT FRONTEND STATIC ASSET ROUTING
// =========================================================================
// Serves your built assets from your build folder
app.use(express.static(path.join(__dirname, '../web/dist')));

// The universal catch-all fallback route: sends unknown traffic to index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../web', 'dist', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

// Start function logic
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

// =========================================================================
// RENDER LIVE ANTI-SLEEP CHRONO SHIELD (Keeps container runtime hot)
// =========================================================================
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
