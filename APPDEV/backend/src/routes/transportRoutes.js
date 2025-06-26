const express = require('express');
const router = express.Router();
const { calculateDistance } = require('../utils/distance');


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