require('dotenv').config();
const axios = require('axios');
const { upsertContests, upsertPlatforms } = require('./db');

const CLIST_USERNAME = process.env.CLIST_USERNAME;
const CLIST_API_KEY = process.env.CLIST_API_KEY;

// Only fetch common/supported platforms by default or we can fetch a curated list.
// Or we can just fetch everything. Let's fetch everything by not specifying resource__in, 
// or fetching a curated list to avoid too much data.

async function fetchAndStore() {
  if (!CLIST_USERNAME || !CLIST_API_KEY) {
    console.error("Missing CLIST_USERNAME or CLIST_API_KEY in .env");
    return;
  }

  console.log(`[${new Date().toISOString()}] Fetching contests from Clist...`);

  try {
    const allContests = [];
    
    // We fetch individually for supported platforms to match the previous app behavior,
    // or we could do it in one big query if clist supports multiple resources.
    // Clist resource__in supports comma-separated values.
    
    const nowStr = new Date().toISOString().split('.')[0]; // YYYY-MM-DDTHH:mm:ss
    
    const url = `https://clist.by/api/v4/contest/?username=${CLIST_USERNAME}&api_key=${CLIST_API_KEY}&limit=300&order_by=start&end__gte=${nowStr}`;
    
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'CP-Companion-Server/1.0' }
    });

    if (response.status === 200 && response.data && response.data.objects) {
      for (const c of response.data.objects) {
        let startTime = c.start;
        if (!startTime.endsWith('Z')) {
          startTime = `${startTime}Z`;
        }

        allContests.push({
          id: c.id,
          name: c.event,
          platform: c.resource,
          start_time: startTime,
          duration_seconds: c.duration,
          url: c.href
        });
      }
      
      if (allContests.length > 0) {
        upsertContests(allContests);
        console.log(`[${new Date().toISOString()}] Successfully fetched and stored ${allContests.length} contests.`);
      } else {
        console.log(`[${new Date().toISOString()}] No upcoming contests found.`);
      }
    }

    // Also fetch all resources to populate the platforms list
    console.log(`[${new Date().toISOString()}] Fetching platforms from Clist...`);
    const platformsUrl = `https://clist.by/api/v4/resource/?username=${CLIST_USERNAME}&api_key=${CLIST_API_KEY}&limit=500`;
    const platformsResponse = await axios.get(platformsUrl, {
      headers: { 'User-Agent': 'CP-Companion-Server/1.0' }
    });

    if (platformsResponse.status === 200 && platformsResponse.data && platformsResponse.data.objects) {
      const allPlatforms = platformsResponse.data.objects.map(r => ({
        id: r.id,
        name: r.name
      }));
      
      if (allPlatforms.length > 0) {
        upsertPlatforms(allPlatforms);
        console.log(`[${new Date().toISOString()}] Successfully fetched and stored ${allPlatforms.length} platforms.`);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching from Clist API:`, error.message);
  }
}

module.exports = {
  fetchAndStore
};
