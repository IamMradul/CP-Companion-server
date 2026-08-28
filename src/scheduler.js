const cron = require('node-cron');
const { fetchAndStore } = require('./fetcher');

function startScheduler() {
  console.log("Starting cron scheduler...");
  
  // Run twice a day (every 12 hours: 00:00 and 12:00)
  cron.schedule('0 0,12 * * *', async () => {
    await fetchAndStore();
  });
  
  // Initial fetch on startup if needed (wait a few seconds)
  setTimeout(() => {
    fetchAndStore();
  }, 2000);
}

module.exports = {
  startScheduler
};
