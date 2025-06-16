const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { calculateDistance } = require('../utils/distance');

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

// Get route suggestions based on origin and destination coordinates
router.get('/suggestions', async (req, res) => {
    try {
        const { origin_lat, origin_lng, dest_lat, dest_lng, radius = 1 } = req.query;

        // Validate required parameters
        if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
            return res.status(400).json({ error: 'Missing required coordinates' });
        }

        // Find nearby stops for both origin and destination
        const nearbyStopsQuery = `
                SELECT 
                s.id as stop_id,
                    s.name,
                    s.latitude,
                    s.longitude,
                    CASE 
                    WHEN ST_Distance(
                        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                        ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography
                    ) <= $5 * 1000 THEN 'origin'
                    ELSE 'destination'
                    END as stop_type,
                ST_Distance(
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography
                ) as distance
                FROM stops s
            WHERE ST_Distance(
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography
            ) <= $5 * 1000
            OR ST_Distance(
                ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
                ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)::geography
            ) <= $5 * 1000
        `;

        const nearbyStops = await pool.query(nearbyStopsQuery, [
            origin_lng, origin_lat,
            dest_lng, dest_lat,
            radius
        ]);

        // Group stops by type
        const originStops = nearbyStops.rows.filter(stop => stop.stop_type === 'origin');
        const destinationStops = nearbyStops.rows.filter(stop => stop.stop_type === 'destination');

        if (originStops.length === 0 || destinationStops.length === 0) {
            return res.json({
                suggestions: [],
                nearby_origin_stops: originStops,
                nearby_destination_stops: destinationStops
            });
        }

        // Find routes that contain both origin and destination stops
        const routeQuery = `
            WITH route_pairs AS (
                SELECT 
                    r1.route_id,
                    r1.stop_id as origin_stop_id,
                    r2.stop_id as destination_stop_id,
                    r1.sequence_number as origin_sequence,
                    r2.sequence_number as destination_sequence
                FROM route_stops r1
                JOIN route_stops r2 ON r1.route_id = r2.route_id
                WHERE r1.stop_id = ANY($1)
                AND r2.stop_id = ANY($2)
                AND r1.sequence_number < r2.sequence_number
            )
            SELECT 
                r.id as route_id,
                r.name as route_name,
                o.id as origin_stop_id,
                o.name as origin_stop_name,
                o.latitude as origin_lat,
                o.longitude as origin_lng,
                d.id as destination_stop_id,
                d.name as destination_stop_name,
                d.latitude as dest_lat,
                d.longitude as dest_lng,
                COALESCE(SUM(dist.distance_km), 0) as total_distance
            FROM route_pairs rp
            JOIN routes r ON rp.route_id = r.id
            JOIN stops o ON rp.origin_stop_id = o.id
            JOIN stops d ON rp.destination_stop_id = d.id
            LEFT JOIN distances dist ON dist.route_id = r.id
            AND dist.origin_stop_id >= rp.origin_stop_id
            AND dist.destination_stop_id <= rp.destination_stop_id
            GROUP BY r.id, r.name, o.id, o.name, o.latitude, o.longitude, d.id, d.name, d.latitude, d.longitude
            ORDER BY total_distance ASC
        `;

        const routes = await pool.query(routeQuery, [
            originStops.map(stop => stop.stop_id),
            destinationStops.map(stop => stop.stop_id)
        ]);

        // Format the response
        const suggestions = routes.rows.map(route => {
            const distance = route.total_distance;
            const duration = Math.ceil((distance / 20) * 60); // Assuming 20 km/h average speed
            const fare = 13 + Math.max(0, (distance - 1) * 1.80); // Base fare ₱13 + ₱1.80 per km after first km

            return {
                route_id: route.route_id,
                route_name: route.route_name,
            origin: {
                    stop_id: route.origin_stop_id,
                    name: route.origin_stop_name,
                    latitude: route.origin_lat,
                    longitude: route.origin_lng
            },
            destination: {
                    stop_id: route.destination_stop_id,
                    name: route.destination_stop_name,
                    latitude: route.dest_lat,
                    longitude: route.dest_lng
            },
                distance: parseFloat(distance.toFixed(1)),
                duration: duration,
                fare: parseFloat(fare.toFixed(2))
            };
        });

        res.json({
            suggestions,
            nearby_origin_stops: originStops,
            nearby_destination_stops: destinationStops
        });

    } catch (error) {
        console.error('Error getting route suggestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// New endpoint to suggest jeepney routes based on origin and destination
router.get('/suggest-routes', async (req, res) => {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination are required' });
    }

    try {
        // Query to find routes that include both origin and destination stops
        // AND ensure the origin comes before the destination in the route sequence
        const query = `
            SELECT DISTINCT 
                r.name as route_name,
                rs1.sequence_number as origin_sequence,
                rs2.sequence_number as destination_sequence,
                CASE 
                    WHEN rs1.sequence_number < rs2.sequence_number THEN 'northbound'
                    ELSE 'southbound'
                END as direction
            FROM routes r
            JOIN route_stops rs1 ON r.id = rs1.route_id
            JOIN stops s1 ON rs1.stop_id = s1.id
            JOIN route_stops rs2 ON r.id = rs2.route_id
            JOIN stops s2 ON rs2.stop_id = s2.id
            WHERE s1.name = $1 
            AND s2.name = $2
            AND rs1.sequence_number < rs2.sequence_number
        `;

        const result = await pool.query(query, [origin, destination]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                message: 'No direct routes found for the given origin and destination. You may need to take multiple jeepneys.',
                suggestion: 'Try searching for routes in the opposite direction or consider alternative routes.'
            });
        }

        // Add additional route information
        const routesWithInfo = await Promise.all(result.rows.map(async (route) => {
            // Get all stops between origin and destination
            const stopsQuery = `
                SELECT s.name, rs.sequence_number
                FROM route_stops rs
                JOIN stops s ON rs.stop_id = s.id
                WHERE rs.route_id = (SELECT id FROM routes WHERE name = $1)
                AND rs.sequence_number >= $2
                AND rs.sequence_number <= $3
                ORDER BY rs.sequence_number
            `;
            const stopsResult = await pool.query(stopsQuery, [
                route.route_name,
                route.origin_sequence,
                route.destination_sequence
            ]);

            // Calculate total distance
            const distanceQuery = `
                SELECT SUM(d.distance_km) as total_distance
                FROM distances d
                JOIN routes r ON d.route_id = r.id
                JOIN stops s1 ON d.origin_stop_id = s1.id
                JOIN stops s2 ON d.destination_stop_id = s2.id
                WHERE r.name = $1
                AND s1.name IN (
                    SELECT s.name
                    FROM route_stops rs
                    JOIN stops s ON rs.stop_id = s.id
                    WHERE rs.route_id = (SELECT id FROM routes WHERE name = $1)
                    AND rs.sequence_number >= $2
                    AND rs.sequence_number < $3
                )
            `;
            const distanceResult = await pool.query(distanceQuery, [
                route.route_name,
                route.origin_sequence,
                route.destination_sequence
            ]);

            return {
                ...route,
                stops: stopsResult.rows,
                total_distance: distanceResult.rows[0].total_distance,
                estimated_time: Math.round(distanceResult.rows[0].total_distance * 5) // Rough estimate: 5 minutes per km
            };
        }));

        res.json({ 
            suggested_routes: routesWithInfo,
            message: 'Routes found. Please note the direction of travel.'
        });
    } catch (error) {
        console.error('Error suggesting routes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 