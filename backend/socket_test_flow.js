require('dotenv').config({ path: './.env' });
const jwt = require('jsonwebtoken');

const backendUrl = 'http://localhost:5000/api';

const fetchJson = async (path, opts={}) => {
  const res = await fetch(`${backendUrl}${path}`, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch(e){ return { status: res.status, text }; }
};

(async ()=>{
  try {
    console.log('Starting simulated chat flow test...');
    // 1) Register two users (buyer and seller)
    const u1 = await fetchJson('/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ firstName: 'Buyer', lastName: 'Test', schoolId: 'B' + Date.now()%100000, schoolMail: `buyer${Date.now()%10000}@regent.edu.gh`, phone: '+2335' + Math.floor(10000000+Math.random()*89999999), password: 'Password123!' }) });
    const u2 = await fetchJson('/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ firstName: 'Seller', lastName: 'Test', schoolId: 'S' + (Date.now()%100000), schoolMail: `seller${Date.now()%10000}@regent.edu.gh`, phone: '+2335' + Math.floor(10000000+Math.random()*89999999), password: 'Password123!' }) });

    const buyer = u1.user || u1;
    const seller = u2.user || u2;
    console.log('Registered buyer:', buyer.schoolMail, buyer._id);
    console.log('Registered seller:', seller.schoolMail, seller._id);

    // 2) Create JWTs for both (bypass verification/login for test)
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const buyerToken = jwt.sign({ id: buyer._id, role: buyer.role || 'student' }, secret, { expiresIn: '7d' });
    const sellerToken = jwt.sign({ id: seller._id, role: seller.role || 'student' }, secret, { expiresIn: '7d' });

    console.log('Generated JWTs for buyer and seller (lengths):', buyerToken.length, sellerToken.length);

    // 3) Buyer sends initial message to seller via initialize endpoint
    const payload = { recipientId: seller._id, text: 'Hi, is this item still available?', contextItem: 'Test Item', itemId: null };
    const sendResp = await fetchJson('/messages/initialize', { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': 'Bearer ' + buyerToken }, body: JSON.stringify(payload) });
    console.log('Initialize response:', sendResp);

    // 4) Seller fetches channel to confirm message stored
    const channel = await fetchJson(`/messages/channel/${buyer._id}`, { method: 'GET', headers: { 'Authorization': 'Bearer ' + sellerToken } });
    console.log('Seller channel messages length:', Array.isArray(channel) ? channel.length : JSON.stringify(channel));

    console.log('Test complete. Check server logs for emitted events and verify recipients received `receive_message` via socket listeners.');
  } catch (err) {
    console.error('Test flow error:', err);
    process.exit(2);
  }
})();