import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

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
app.use(cors());
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/upload', filesRouter);
app.use('/api/files', filesRouter);

// Mock dns.resolveSrv globally to resolve SRV records over DoH
dns.resolveSrv = function (hostname, callback) {
  const url = `https://dns.google/resolve?name=${hostname}&type=SRV`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.Answer && json.Answer.length > 0) {
          const records = json.Answer.map(item => {
            const parts = item.data.split(' ');
            return {
              priority: parseInt(parts[0], 10),
              weight: parseInt(parts[1], 10),
              port: parseInt(parts[2], 10),
              name: parts[3].endsWith('.') ? parts[3].slice(0, -1) : parts[3]
            };
          });
          return callback(null, records);
        }
        callback(new Error(`DNS SRV resolution failed for ${hostname}`));
      } catch (err) {
        callback(err);
      }
    });
  }).on('error', (err) => {
    callback(err);
  });
};

// Mock dns.resolveTxt globally to resolve TXT records over DoH
dns.resolveTxt = function (hostname, callback) {
  const url = `https://dns.google/resolve?name=${hostname}&type=TXT`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.Answer && json.Answer.length > 0) {
          const records = json.Answer.map(item => {
            const cleanData = item.data.replace(/^"|"$/g, '');
            return [cleanData];
          });
          return callback(null, records);
        }
        callback(new Error(`DNS TXT resolution failed for ${hostname}`));
      } catch (err) {
        callback(err);
      }
    });
  }).on('error', (err) => {
    callback(err);
  });
};

// Mock dns.lookup globally to resolve IP addresses over DoH
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Resolve dns.google using originalLookup to avoid recursive DNS lookups
  if (hostname === 'dns.google') {
    return originalLookup(hostname, options, callback);
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return originalLookup(hostname, options, callback);
  }

  const url = `https://dns.google/resolve?name=${hostname}&type=A`;
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.Answer && json.Answer.length > 0) {
          const aRecord = json.Answer.find(item => item.type === 1);
          if (aRecord) {
            if (options && options.all) {
              return callback(null, [{ address: aRecord.data, family: 4 }]);
            }
            return callback(null, aRecord.data, 4);
          }
          const cnameRecord = json.Answer.find(item => item.type === 5);
          if (cnameRecord) {
            return dns.lookup(cnameRecord.data, options, callback);
          }
        }
        originalLookup(hostname, options, callback);
      } catch (err) {
        originalLookup(hostname, options, callback);
      }
    });
  }).on('error', (err) => {
    originalLookup(hostname, options, callback);
  });
};

// Mock dns.promises methods to support node's promise-based resolveSrv, resolveTxt, and lookup
dns.promises.resolveSrv = function (hostname) {
  return new Promise((resolve, reject) => {
    dns.resolveSrv(hostname, (err, records) => {
      if (err) return reject(err);
      resolve(records);
    });
  });
};

dns.promises.resolveTxt = function (hostname) {
  return new Promise((resolve, reject) => {
    dns.resolveTxt(hostname, (err, records) => {
      if (err) return reject(err);
      resolve(records);
    });
  });
};

dns.promises.lookup = function (hostname, options) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, options, (err, address, family) => {
      if (err) return reject(err);
      if (options && options.all) {
        return resolve(address);
      }
      resolve({ address, family });
    });
  });
};

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
