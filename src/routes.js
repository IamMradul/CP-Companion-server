const express = require('express');
const { getUpcomingContests, getAvailablePlatforms } = require('./db');

const router = express.Router();

router.get('/contests', (req, res) => {
  try {
    const platformsParam = req.query.platforms;
    let platforms = [];
    
    if (platformsParam) {
      platforms = platformsParam.split(',').map(p => p.trim()).filter(p => p.length > 0);
    }
    
    const contests = getUpcomingContests(platforms);
    res.json(contests);
  } catch (error) {
    console.error("Error serving /contests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/platforms', (req, res) => {
  try {
    const platforms = getAvailablePlatforms();
    // Return format similar to Clist platform response if needed, 
    // or just array of strings. We'll return objects for compatibility.
    const platformObjects = platforms.map((name, index) => ({
      id: index + 1,
      name: name
    }));
    res.json(platformObjects);
  } catch (error) {
    console.error("Error serving /platforms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = router;
