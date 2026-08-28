require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'contests.db');
const db = new Database(dbPath, { verbose: null });

db.exec(`
  CREATE TABLE IF NOT EXISTS contests (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    start_time TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    url TEXT NOT NULL,
    fetched_at TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS platforms (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );
`);

const insertContest = db.prepare(`
  INSERT INTO contests (id, name, platform, start_time, duration_seconds, url, fetched_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    platform = excluded.platform,
    start_time = excluded.start_time,
    duration_seconds = excluded.duration_seconds,
    url = excluded.url,
    fetched_at = excluded.fetched_at
`);

function upsertContests(contests) {
  const now = new Date().toISOString();
  const transaction = db.transaction((contests) => {
    for (const contest of contests) {
      insertContest.run(
        contest.id,
        contest.name,
        contest.platform,
        contest.start_time, // ISO string expected
        contest.duration_seconds,
        contest.url,
        now
      );
    }
  });
  transaction(contests);
}

const insertPlatform = db.prepare(`
  INSERT INTO platforms (id, name)
  VALUES (?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name
`);

function upsertPlatforms(platforms) {
  const transaction = db.transaction((platforms) => {
    for (const platform of platforms) {
      insertPlatform.run(platform.id, platform.name);
    }
  });
  transaction(platforms);
}

function getUpcomingContests(platforms) {
  // platforms is an array of strings like ["codeforces.com", "leetcode.com"]
  const now = new Date().toISOString();
  let query = "SELECT id, name, platform, start_time AS startTime, duration_seconds AS durationSeconds, url FROM contests WHERE datetime(start_time, '+' || duration_seconds || ' seconds') >= datetime(?)";
  let params = [now];

  if (platforms && platforms.length > 0) {
    const placeholders = platforms.map(() => '?').join(',');
    query += ` AND platform IN (${placeholders})`;
    params.push(...platforms);
  }

  query += ' ORDER BY start_time ASC';

  const stmt = db.prepare(query);
  return stmt.all(params);
}

function getAvailablePlatforms() {
  const stmt = db.prepare('SELECT name FROM platforms ORDER BY name ASC');
  return stmt.all().map(row => row.name);
}

module.exports = {
  db,
  upsertContests,
  upsertPlatforms,
  getUpcomingContests,
  getAvailablePlatforms
};
