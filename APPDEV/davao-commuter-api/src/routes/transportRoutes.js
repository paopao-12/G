const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all jeepney routes
router.get('/jeepney', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM jeepney_routes');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching jeepney routes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get fare between two locations
router.get('/fare', async (req, res) => {
    const { origin, destination } = req.query;
    try {
        const result = await db.query(
            'SELECT fare FROM fares WHERE origin = $1 AND destination = $2',
            [origin, destination]
        );
        res.json(result.rows[0] || { fare: 0 });
    } catch (error) {
        console.error('Error calculating fare:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 