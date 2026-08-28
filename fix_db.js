const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(process.env.LOCALAPPDATA, 'com.mradul.cp-companion', 'cp_companion.db');

try {
  const db = new Database(dbPath);
  db.exec("UPDATE app_settings SET server_url = 'http://localhost:3000/api' WHERE id = 1");
  console.log("Successfully updated the server_url to include /api!");
} catch(e) {
  console.log("Could not update database (maybe locked, or doesn't exist): " + e.message);
}
