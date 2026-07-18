import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

// Helper utilities
import { setupDnsMock } from './utils/dnsMock.js';

// Setup DNS mock for MongoDB Atlas connectivity over DoH (must run before database connection)
setupDnsMock();

// Import routes
import authRouter from './routes/auth.js';
import foldersRouter from './routes/folders.js';
import filesRouter from './routes/files.js';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from the server directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : null;
app.use(cors({
  origin: allowedOrigins || true,
  credentials: true
}));
app.use(compression());
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/upload', filesRouter);
app.use('/api/files', filesRouter);



// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Seed admin user if it doesn't exist in the database
    try {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0) {
        const seedEmail = process.env.ADMIN_EMAIL || 'poongothai@irttech.ac.in';
        const seedPassword = process.env.ADMIN_PASSWORD || 'Admin@IRTT2026';
        
        const hashedPassword = await bcrypt.hash(seedPassword, 10);
        await User.create({
          email: seedEmail.toLowerCase(),
          password: hashedPassword,
          role: 'admin'
        });
        console.log(`Successfully seeded default admin user into database: ${seedEmail}`);
      }
    } catch (seedErr) {
      console.error('Error seeding admin user to database:', seedErr);
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    https.get('https://api.ipify.org', (res) => {
      let ip = '';
      res.on('data', chunk => ip += chunk);
      res.on('end', () => {
        console.log('\n--- IP WHITELIST DIAGNOSTIC ---');
        console.log(`Your current public IP is: ${ip}`);
        console.log('Please add this IP to MongoDB Atlas Network Access (Security -> Network Access) to authorize access.\n');
      });
    }).on('error', () => {
      console.log('\nCould not fetch public IP. Please verify your internet connection and Atlas IP whitelist settings.\n');
    });
  });
