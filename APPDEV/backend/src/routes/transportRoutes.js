const express = require('express');
const router = express.Router();
const { getRoutesWithPolylines } = require('../utils/gtfs');

// Remove /stops endpoint (no longer needed)

// Get all routes with polylines (for map display)
router.get('/routes', (req, res) => {
  try {
    const routes = getRoutesWithPolylines();
    res.json(routes);
  } catch (err) {
    console.error('Error reading GTFS data:', err);
    res.status(500).json({ error: 'Failed to load routes from GTFS.' });
  }
});

// (Optional) Keep fare endpoint if still needed
router.get('/fare', (req, res) => {
  const { distance_km } = req.query;
  if (!distance_km || isNaN(distance_km)) {
    return res.status(400).json({ error: 'distance_km query parameter is required and must be a number.' });
  }
  const distance = parseFloat(distance_km);
  const fare = Math.max(13, 13 + Math.ceil((distance - 1) * 1.80));
  res.json({ distance_km: distance, fare });
});

module.exports = router;