const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// The Finals App ID on Steam
const THE_FINALS_APP_ID = 2073850;

// Middleware
app.use(express.json());

// Serves static files (index.html) from the "public" directory
app.use(express.static('public'));

// Enable CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
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
        message: 'The Finals not found in this library. Make sure your Steam profile stats are set to Public.',
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
// 2. Fetch Leaderboard Data (Community API)
// ==========================================================
app.get('/api/leaderboard', async (req, res) => {
  try {
    // Queries public community API endpoint for crossplay leaderboards
    const response = await axios.get('https://api.the-finals-leaderboard.com/v1/leaderboard/cb2');

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

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running! Open http://localhost:${PORT} in your browser.\n`);
});
