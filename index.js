const express = require('express');
const dotenv = require('dotenv');
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

const sequelize = require('./models/index'); // Sequelize setup
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

const app = express();

// ---------- CORS setup ----------
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-frontend.vercel.app' // Replace with your live frontend
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // respond immediately to preflight
  }

  next();
});

// ---------- Body parser ----------
app.use(express.json());

// ---------- Health check ----------
app.get('/', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

// ---------- Start server ----------
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection authenticated');
    await sequelize.sync();
    console.log('Database synced');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start application', err);
    process.exit(1);
  }
}

start();
