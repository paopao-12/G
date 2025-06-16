const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Get route metrics for a specific route and date range
router.get('/metrics/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;
        const { startDate, endDate } = req.query;

        const query = `
            SELECT date, hour, estimated_travel_time
            FROM route_metrics
            WHERE route_id = $1
            AND date BETWEEN $2 AND $3
            ORDER BY date, hour
        `;

        const result = await pool.query(query, [routeId, startDate, endDate]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching route metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get safety information for a route
router.get('/safety/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;

        const query = `
            SELECT safety_score, last_incident_date, incident_count, police_presence, well_lit
            FROM route_safety
            WHERE route_id = $1
        `;

        const result = await pool.query(query, [routeId]);
        res.json(result.rows[0] || {});
    } catch (error) {
        console.error('Error fetching safety information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get accessibility information for a route
router.get('/accessibility/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;

        const query = `
            SELECT wheelchair_accessible, has_elevator, has_escalator, has_stairs, ramp_available
            FROM route_accessibility
            WHERE route_id = $1
        `;

        const result = await pool.query(query, [routeId]);
        res.json(result.rows[0] || {});
    } catch (error) {
        console.error('Error fetching accessibility information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get route schedule
router.get('/schedule/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;
        const { dayOfWeek } = req.query;

        const query = `
            SELECT day_of_week, start_time, end_time, frequency
            FROM route_schedule
            WHERE route_id = $1
            ${dayOfWeek ? 'AND day_of_week = $2' : ''}
            ORDER BY day_of_week, start_time
        `;

        const params = dayOfWeek ? [routeId, dayOfWeek] : [routeId];
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching route schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get alternative routes
router.get('/alternatives/:routeId', async (req, res) => {
    try {
        const { routeId } = req.params;

        const query = `
            SELECT r.id, r.name, r.description, ra.walking_distance
            FROM route_alternatives ra
            JOIN routes r ON r.id = ra.alternative_route_id
            WHERE ra.route_id = $1
            ORDER BY ra.walking_distance
        `;

        const result = await pool.query(query, [routeId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching alternative routes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update route metrics (admin only)
router.post('/metrics/:routeId', authenticateToken, async (req, res) => {
    try {
        const { routeId } = req.params;
        const { date, hour, estimated_travel_time } = req.body;

        const query = `
            INSERT INTO route_metrics (route_id, date, hour, estimated_travel_time)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (route_id, date, hour) DO UPDATE
            SET estimated_travel_time = $4,
                updated_at = CURRENT_TIMESTAMP
        `;

        await pool.query(query, [routeId, date, hour, estimated_travel_time]);
        res.json({ message: 'Route metrics updated successfully' });
    } catch (error) {
        console.error('Error updating route metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update safety information (admin only)
router.post('/safety/:routeId', authenticateToken, async (req, res) => {
    try {
        const { routeId } = req.params;
        const { safety_score, last_incident_date, incident_count, police_presence, well_lit } = req.body;

        const query = `
            INSERT INTO route_safety (route_id, safety_score, last_incident_date, incident_count, police_presence, well_lit)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (route_id) DO UPDATE
            SET safety_score = $2,
                last_incident_date = $3,
                incident_count = $4,
                police_presence = $5,
                well_lit = $6,
                updated_at = CURRENT_TIMESTAMP
        `;

        await pool.query(query, [routeId, safety_score, last_incident_date, incident_count, police_presence, well_lit]);
        res.json({ message: 'Safety information updated successfully' });
    } catch (error) {
        console.error('Error updating safety information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update accessibility information (admin only)
router.post('/accessibility/:routeId', authenticateToken, async (req, res) => {
    try {
        const { routeId } = req.params;
        const { wheelchair_accessible, has_elevator, has_escalator, has_stairs, ramp_available } = req.body;

        const query = `
            INSERT INTO route_accessibility (route_id, wheelchair_accessible, has_elevator, has_escalator, has_stairs, ramp_available)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (route_id) DO UPDATE
            SET wheelchair_accessible = $2,
                has_elevator = $3,
                has_escalator = $4,
                has_stairs = $5,
                ramp_available = $6,
                updated_at = CURRENT_TIMESTAMP
        `;

        await pool.query(query, [routeId, wheelchair_accessible, has_elevator, has_escalator, has_stairs, ramp_available]);
        res.json({ message: 'Accessibility information updated successfully' });
    } catch (error) {
        console.error('Error updating accessibility information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update route schedule (admin only)
router.post('/schedule/:routeId', authenticateToken, async (req, res) => {
    try {
        const { routeId } = req.params;
        const { day_of_week, start_time, end_time, frequency } = req.body;

        const query = `
            INSERT INTO route_schedule (route_id, day_of_week, start_time, end_time, frequency)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (route_id, day_of_week) DO UPDATE
            SET start_time = $3,
                end_time = $4,
                frequency = $5,
                updated_at = CURRENT_TIMESTAMP
        `;

        await pool.query(query, [routeId, day_of_week, start_time, end_time, frequency]);
        res.json({ message: 'Route schedule updated successfully' });
    } catch (error) {
        console.error('Error updating route schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add alternative route (admin only)
router.post('/alternatives/:routeId', authenticateToken, async (req, res) => {
    try {
        const { routeId } = req.params;
        const { alternative_route_id, walking_distance } = req.body;

        const query = `
            INSERT INTO route_alternatives (route_id, alternative_route_id, walking_distance)
            VALUES ($1, $2, $3)
            ON CONFLICT (route_id, alternative_route_id) DO UPDATE
            SET walking_distance = $3,
                updated_at = CURRENT_TIMESTAMP
        `;

        await pool.query(query, [routeId, alternative_route_id, walking_distance]);
        res.json({ message: 'Alternative route added successfully' });
    } catch (error) {
        console.error('Error adding alternative route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 