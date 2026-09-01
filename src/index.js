require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startScheduler } = require('./scheduler');
const routes = require('./routes');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.set('trust proxy', true);

const uniqueDevices = new Set();
let totalRequests = 0;

app.use((req, res, next) => {
  if (req.ip) {
    uniqueDevices.add(req.ip);
  }
  totalRequests++;
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} | IP: ${req.ip || 'unknown'}`);
  console.log(`Stats -> Total Requests: ${totalRequests} | Unique Devices: ${uniqueDevices.size}`);
  
  next();
});

// Routes
app.use('/api', routes);

// Fallback for root
app.get('/', (req, res) => {
  res.send('CP Companion API Server is running');
});

// Start scheduler
startScheduler();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`This is the test message for deployment`);
});
