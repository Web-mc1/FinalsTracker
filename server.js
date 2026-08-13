const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// The Finals App ID on Steam
const THE_FINALS_APP_ID = 2073850;

// Enable JSON middleware for parsing requests
app.use(express.json());

// Enable CORS so your future frontend website can talk to this backend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// ==========================================================
// Root Endpoint (Quick Health Check)
// ==========================================================
app.get('/', (req, res) => {
  res.send('The Finals Stat Tracker API is up and running!');
});

// ==========================================================
// 1. Fetch Steam Playtime for The Finals
// ==========================================================
app.get('/api/steam/playtime/:steamId', async (req, res) => {
  const { steamId } = req.params;

  if (!STEAM_API_KEY) {
    return res.status(500).json({ error: 'STEAM_API_KEY is missing from .env configuration.' });
  }

  try {
    const url = 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/';
    const response = await axios.get(url, {
      params: {
        key: STEAM_API_KEY,
        steamid: steamId,
        format: 'json',
        include_appinfo: true,
      },
    });

    const games = response.data.response.games || [];
    const finalsGame = games.find((game) => game.appid === THE_FINALS_APP_ID);

    if (!finalsGame) {
      return res.status(404).json({
        message: 'The Finals not found in this library. Check if the Steam profile or game stats are set to Private.',
      });
    }

    res.json({
      steamId,
      game: finalsGame.name,
      playtimeMinutes: finalsGame.playtime_forever,
      playtimeHours: (finalsGame.playtime_forever / 60).toFixed(1),
    });
  } catch (error) {
    console.error('Error fetching Steam stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch Steam stats.' });
  }
});

// ==========================================================
// 2. Fetch Leaderboard Data (Public API)
// ==========================================================
app.get('/api/leaderboard', async (req, res) => {
  try {
    // Queries the community leaderboard endpoint
    const response = await axios.get('https://api.thefinals-api.com/v1/leaderboard/crossplay');

    res.json({
      success: true,
      totalPlayersReturned: response.data.length,
      top10: response.data.slice(0, 10),
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard data.' });
  }
});

// ==========================================================
// Start the Web Server
// ==========================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running successfully!`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`📡 Steam Endpoint: http://localhost:${PORT}/api/steam/playtime/YOUR_STEAM_ID`);
  console.log(`📡 Leaderboard Endpoint: http://localhost:${PORT}/api/leaderboard\n`);
});
