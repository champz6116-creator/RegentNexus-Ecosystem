# RegentNexus

A React Native app for item listings and transactions with real-time messaging.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy the environment template and configure your settings:
```bash
cp .env.example .env
```

Edit `.env` with your backend URL and credentials.

### 3. Start the App
```bash
# For local development
npm start

# For mobile hotspot testing (tunnel)
npm run start:tunnel
```

### 4. Start the Backend (in separate terminal)
```bash
cd backend
npm install
node server.js
```

## 📱 Testing on Mobile

1. Install **Expo Go** app on your phone
2. Scan the QR code shown in terminal
3. Test login/registration with OTP

## 🔧 Environment Configuration

The app uses environment variables for configuration. Default values are set in `app.json`:

- `API_BASE_URL`: Backend API URL (default: http://10.0.2.2:5000/api)
- `SOCKET_SERVER`: Socket.io server URL (default: http://10.0.2.2:5000)

For tunnel access (mobile hotspot), update these URLs in your `.env` file.

## 🔑 Default Admin Credentials

- **Email:** `rooney.uwho@regent.edu.gh`
- **Password:** `admin123`

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo development server (local) |
| `npm run start:tunnel` | Start Expo with tunnel for mobile hotspot |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run in web browser |

## 📞 Support

For issues, ensure:
- Backend server is running on port 5000
- Environment variables are correctly set
- Mobile device is on same network as development machine

### Admin routes
- `GET /api/admin/dashboard`
- `POST /api/admin/users/:id/verify`
- `POST /api/admin/users/:id/ban`
- `POST /api/admin/listings/:id/remove`

### Real-time
- Socket.io at `ws://localhost:4000/` with event `chat message`

## Firebase Storage
- Use `firebase-admin` credentials in `.env` to upload images for listings.
- Extend `backend/routes/items.js` to add image upload support as needed.
