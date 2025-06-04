const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get routes near user location
router.get('/routes', async (req, res) => {
    try {
        const { latitude, longitude, radius = 2 } = req.query; // radius in kilometers

        if (!latitude || !longitude) {
            // If no location provided, return all routes
            const result = await db.query(`
                SELECT r.id, r.name, 
                       json_agg(
                           json_build_object(
                               'stop_id', s.id,
                               'stop_name', s.name,
                               'latitude', s.latitude,
                               'longitude', s.longitude,
                               'sequence', rs.sequence_number
                           ) ORDER BY rs.sequence_number
                       ) as stops
                FROM routes r
                JOIN route_stops rs ON r.id = rs.route_id
                JOIN stops s ON rs.stop_id = s.id
                GROUP BY r.id, r.name
                ORDER BY r.name
            `);
            return res.json(result.rows);
        }

        // Find routes with stops within radius of user location
        const result = await db.query(`
            WITH nearby_stops AS (
                SELECT s.id, s.name, s.latitude, s.longitude,
                       (6371 * acos(cos(radians($1)) * cos(radians(s.latitude)) * 
                        cos(radians(s.longitude) - radians($2)) + 
                        sin(radians($1)) * sin(radians(s.latitude)))) AS distance
                FROM stops s
                HAVING distance <= $3
            )
            SELECT DISTINCT r.id, r.name,
                   json_agg(
                       json_build_object(
                           'stop_id', s.id,
                           'stop_name', s.name,
                           'latitude', s.latitude,
                           'longitude', s.longitude,
                           'sequence', rs.sequence_number,
                           'distance_from_user', (
                               SELECT distance 
                               FROM nearby_stops ns 
                               WHERE ns.id = s.id
                           )
                       ) ORDER BY rs.sequence_number
                   ) as stops
            FROM routes r
            JOIN route_stops rs ON r.id = rs.route_id
            JOIN stops s ON rs.stop_id = s.id
            WHERE EXISTS (
                SELECT 1 FROM nearby_stops ns 
                WHERE ns.id = s.id
            )
            GROUP BY r.id, r.name
            ORDER BY r.name
        `, [latitude, longitude, radius]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all stops
router.get('/stops', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM stops ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching stops:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get distance and calculate fare between two stops
router.get('/fare', async (req, res) => {
    const { origin_id, destination_id } = req.query;
    try {
        // Get the distance between stops
        const result = await db.query(`
            SELECT d.distance_km, r.name as route_name
            FROM distances d
            JOIN routes r ON d.route_id = r.id
            WHERE d.origin_stop_id = $1 AND d.destination_stop_id = $2
            ORDER BY d.distance_km ASC
            LIMIT 1
        `, [origin_id, destination_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No direct route found between these stops' });
        }

        const distance = result.rows[0].distance_km;
        const routeName = result.rows[0].route_name;

        // Calculate fare based on distance
        // Base fare: ₱13.00 for first kilometer
        // Additional ₱1.80 per kilometer after the first kilometer
        const fare = Math.max(13, 13 + Math.ceil((distance - 1) * 1.80));

        res.json({
            distance_km: distance,
            fare: fare,
            route_name: routeName
        });
    } catch (error) {
        console.error('Error calculating fare:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get route details including all stops and distances
router.get('/routes/:routeId', async (req, res) => {
    try {
        const routeId = req.params.routeId;
        
        // Get route details with stops and distances
        const result = await db.query(`
            WITH route_stops AS (
                SELECT 
                    rs.route_id,
                    rs.stop_id,
                    s.name as stop_name,
                    rs.sequence_number,
                    d.distance_km
                FROM route_stops rs
                JOIN stops s ON rs.stop_id = s.id
                LEFT JOIN distances d ON 
                    d.route_id = rs.route_id AND 
                    d.origin_stop_id = rs.stop_id AND 
                    d.destination_stop_id = (
                        SELECT stop_id 
                        FROM route_stops 
                        WHERE route_id = rs.route_id 
                        AND sequence_number = rs.sequence_number + 1
                    )
                WHERE rs.route_id = $1
                ORDER BY rs.sequence_number
            )
            SELECT 
                r.id,
                r.name as route_name,
                json_agg(
                    json_build_object(
                        'stop_id', stop_id,
                        'stop_name', stop_name,
                        'sequence', sequence_number,
                        'distance_to_next', distance_km
                    )
                ) as stops
            FROM routes r
            JOIN route_stops rs ON r.id = rs.route_id
            WHERE r.id = $1
            GROUP BY r.id, r.name
        `, [routeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching route details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get nearby stops
router.get('/stops/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 1 } = req.query; // radius in kilometers

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const result = await db.query(`
            SELECT 
                s.id,
                s.name,
                s.latitude,
                s.longitude,
                (6371 * acos(cos(radians($1)) * cos(radians(s.latitude)) * 
                 cos(radians(s.longitude) - radians($2)) + 
                 sin(radians($1)) * sin(radians(s.latitude)))) AS distance
            FROM stops s
            HAVING distance <= $3
            ORDER BY distance
        `, [latitude, longitude, radius]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching nearby stops:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 