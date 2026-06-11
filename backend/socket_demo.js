require('dotenv').config({ path: './.env' });
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:5000';

const waitFor = (emitter, ev) => new Promise((resolve) => emitter.once(ev, resolve));

(async () => {
  try {
    console.log('Socket demo starting...');

    // 1) Register buyer and seller
    const reg = async (first) => {
      const res = await fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: first,
          lastName: 'Demo',
          schoolId: `${first.toUpperCase().slice(0,1)}${Date.now()%100000}`,
          schoolMail: `${first.toLowerCase()}${Math.floor(Math.random()*9000)+1000}@regent.edu.gh`,
          phone: '+2335' + (Math.floor(Math.random()*90000000)+10000000),
          password: 'Password123!'
        })
      });
      const data = await res.json();
      if (!data || !data.user) throw new Error('Registration failed: ' + JSON.stringify(data));
      return data.user;
    };

    const buyer = await reg('Buyer');
    const seller = await reg('Seller');
    console.log('Registered', buyer.schoolMail, '->', buyer._id);
    console.log('Registered', seller.schoolMail, '->', seller._id);

    // 2) Create JWTs locally (for testing) so API auth passes
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const buyerToken = jwt.sign({ id: buyer._id, role: buyer.role || 'student' }, secret, { expiresIn: '7d' });
    const sellerToken = jwt.sign({ id: seller._id, role: seller.role || 'student' }, secret, { expiresIn: '7d' });

    // 3) Start socket clients
    const buyerSocket = io('http://localhost:5000', { transports: ['polling','websocket'] });
    const sellerSocket = io('http://localhost:5000', { transports: ['polling','websocket'] });

    buyerSocket.on('connect', () => {
      console.log('Buyer socket connected', buyerSocket.id);
      buyerSocket.emit('join_room', buyer._id.toString());
    });
    sellerSocket.on('connect', () => {
      console.log('Seller socket connected', sellerSocket.id);
      sellerSocket.emit('join_room', seller._id.toString());
    });

    sellerSocket.on('receive_message', (msg) => {
      console.log('SELLER RECEIVED:', msg);
    });
    buyerSocket.on('receive_message', (msg) => {
      console.log('BUYER RECEIVED:', msg);
    });

    // wait until both sockets connected
    await Promise.all([
      waitFor(buyerSocket, 'connect'),
      waitFor(sellerSocket, 'connect')
    ]);

    // 4) Trigger a message from buyer -> seller via API (authenticated)
    const payload = { recipientId: seller._id, text: 'Hello seller, is the item available?', contextItem: 'Demo Item' };
    const resp = await fetch(`${BASE}/api/messages/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + buyerToken },
      body: JSON.stringify(payload)
    });
    const sent = await resp.json();
    console.log('API send response:', sent);

    // wait a short while to allow socket events to be delivered
    await new Promise(r => setTimeout(r, 2500));

    // cleanup
    buyerSocket.disconnect();
    sellerSocket.disconnect();
    console.log('Socket demo finished.');
    process.exit(0);
  } catch (err) {
    console.error('Socket demo error:', err.message || err);
    process.exit(2);
  }
})();