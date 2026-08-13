// ==========================================================
// 2. Fetch Leaderboard Data (Community API with Fallback)
// ==========================================================
app.get('/api/leaderboard', async (req, res) => {
  try {
    // Current active endpoint for crossplay leaderboards
    const primaryUrl = 'https://api.the-finals-leaderboard.com/v1/leaderboard/crossplay';
    
    const response = await axios.get(primaryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });

    if (!Array.isArray(response.data)) {
      throw new Error('Invalid data format received');
    }

    res.json({
      success: true,
      totalPlayersReturned: response.data.length,
      top10: response.data.slice(0, 10),
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error.message);
    
    // Fallback attempt in case the main domain is migrating
    try {
      const fallbackUrl = 'https://raw.githubusercontent.com/community-apis/the-finals-leaderboard/main/current.json';
      const fallbackResponse = await axios.get(fallbackUrl, { timeout: 5000 });
      
      return res.json({
        success: true,
        totalPlayersReturned: fallbackResponse.data.length,
        top10: fallbackResponse.data.slice(0, 10),
      });
    } catch (fallbackError) {
      console.error('Fallback leaderboard error:', fallbackError.message);
      res.status(502).json({ 
        error: 'Failed to fetch leaderboard data.',
        details: error.message 
      });
    }
  }
});
