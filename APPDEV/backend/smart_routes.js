// backend/smart_routes.js
// Express backend for smart route suggestions using GTFS data

const express = require('express');
const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');
const { parse: csvParse } = require('csv-parse/sync');

const app = express();
const PORT = process.env.PORT || 4000;

// Load GTFS files
const GTFS_DIR = path.join(__dirname, 'gtfs_output');
const routes = csvParse(fs.readFileSync(path.join(GTFS_DIR, 'routes.txt')), {columns: true});
const shapes = csvParse(fs.readFileSync(path.join(GTFS_DIR, 'shapes.txt')), {columns: true});

// Build a map of shape_id to array of [lon, lat]
const shapeMap = {};
shapes.forEach(row => {
  if (!shapeMap[row.shape_id]) shapeMap[row.shape_id] = [];
  shapeMap[row.shape_id].push([
    parseFloat(row.shape_pt_lon),
    parseFloat(row.shape_pt_lat)
  ]);
});

// Build a map of route_id to shape_id
const routeShapeMap = {};
routes.forEach(route => {
  // Find a shape_id for this route (from trips.txt if available, else assume shape_id = route_id)
  // For simplicity, assume shape_id = shape_id in shapes.txt
  routeShapeMap[route.route_id] = `shape_${route.route_id.split('_')[1]}`;
});

// Helper: find routes near a point
function findRoutesNear(lat, lon, radiusMeters = 200) {
  const pt = turf.point([lon, lat]);
  const results = [];
  for (const [route_id, shape_id] of Object.entries(routeShapeMap)) {
    const coords = shapeMap[shape_id];
    if (!coords) continue;
    const line = turf.lineString(coords);
    const dist = turf.pointToLineDistance(pt, line, {units: 'meters'});
    if (dist <= radiusMeters) {
      results.push({route_id, dist});
    }
  }
  return results.sort((a, b) => a.dist - b.dist);
}

// Helper: find stops near a point (using stops.txt with lat/lon)
function findStopsNear(lat, lon, stops, radiusMeters = 500) {
  const pt = turf.point([lon, lat]);
  return stops.filter(stop => {
    const stopPt = turf.point([parseFloat(stop.stop_lon)], [parseFloat(stop.stop_lat)]);
    const dist = turf.distance(pt, stopPt, { units: 'meters' });
    return dist <= radiusMeters;
  });
}

// Helper: build stop-to-route map
function buildStopRouteMap(trips, stopTimes) {
  const stopRouteMap = {};
  stopTimes.forEach(st => {
    const trip = trips.find(t => t.trip_id === st.trip_id);
    if (!trip) return;
    if (!stopRouteMap[st.stop_id]) stopRouteMap[st.stop_id] = new Set();
    stopRouteMap[st.stop_id].add(trip.route_id);
  });
  return stopRouteMap;
}

// API: Find routes near a location
app.get('/routes/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) return res.status(400).json({error: 'Invalid coordinates'});
  const nearby = findRoutesNear(lat, lon);
  res.json(nearby.map(r => ({route_id: r.route_id, distance_m: r.dist})));
});

// API: Suggest best route(s) between two points
app.get('/routes/suggest', (req, res) => {
  const originLat = parseFloat(req.query.originLat);
  const originLon = parseFloat(req.query.originLon);
  const destLat = parseFloat(req.query.destLat);
  const destLon = parseFloat(req.query.destLon);
  if ([originLat, originLon, destLat, destLon].some(isNaN))
    return res.status(400).json({error: 'Invalid coordinates'});

  // Load GTFS stops, stop_times, trips
  const stops = csvParse(fs.readFileSync(path.join(GTFS_DIR, 'stops.txt')), {columns: true});
  const stopTimes = csvParse(fs.readFileSync(path.join(GTFS_DIR, 'stop_times.txt')), {columns: true});
  const trips = csvParse(fs.readFileSync(path.join(GTFS_DIR, 'trips.txt')), {columns: true});

  // 1. If destination is within walking distance, suggest walking
  const destPt = turf.point([destLon, destLat]);
  const originPt = turf.point([originLon, originLat]);
  const walkDist = turf.distance(originPt, destPt, { units: 'meters' });
  if (walkDist <= 500) {
    // Optionally, use a directions API for turn-by-turn
    return res.json({
      type: 'walk',
      message: `Please walk ${(walkDist).toFixed(0)}m to your destination.`
    });
  }

  // 2. Find all stops near origin and destination
  const originStops = findStopsNear(originLat, originLon, stops);
  const destStops = findStopsNear(destLat, destLon, stops);

  // 3. Build stop-to-route map
  const stopRouteMap = buildStopRouteMap(trips, stopTimes);

  // 4. Find direct routes
  const originRouteIds = new Set();
  originStops.forEach(stop => {
    (stopRouteMap[stop.stop_id] || []).forEach(rid => originRouteIds.add(rid));
  });
  const destRouteIds = new Set();
  destStops.forEach(stop => {
    (stopRouteMap[stop.stop_id] || []).forEach(rid => destRouteIds.add(rid));
  });
  const directRoutes = [...originRouteIds].filter(rid => destRouteIds.has(rid));
  if (directRoutes.length > 0) {
    // Return the first direct route with stop info
    return res.json({
      type: 'direct',
      route_id: directRoutes[0],
      origin_stop: originStops[0],
      destination_stop: destStops[0]
    });
  }

  // 5. Find transfer routes (one transfer)
  for (const originStop of originStops) {
    const originRoutes = stopRouteMap[originStop.stop_id] || [];
    for (const destStop of destStops) {
      const destRoutes = stopRouteMap[destStop.stop_id] || [];
      for (const oRoute of originRoutes) {
        for (const dRoute of destRoutes) {
          // Find transfer stops (stops served by both oRoute and dRoute)
          for (const stopId in stopRouteMap) {
            if (stopRouteMap[stopId].has(oRoute) && stopRouteMap[stopId].has(dRoute)) {
              // Found a transfer stop
              return res.json({
                type: 'transfer',
                origin_route: oRoute,
                transfer_stop: stops.find(s => s.stop_id === stopId),
                destination_route: dRoute,
                origin_stop: originStop,
                destination_stop: destStop
              });
            }
          }
        }
      }
    }
  }

  res.json({type: 'none', message: 'No route found (direct or with one transfer).'});
});

// API: Get shape coordinates for a route
app.get('/route_shape', (req, res) => {
  const { route_id } = req.query;
  if (!route_id || typeof route_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid route_id' });
  }
  const shape_id = routeShapeMap[route_id];
  const coords = shapeMap[shape_id];
  if (!coords) {
    return res.status(404).json({ error: 'Shape not found for this route' });
  }
  // Return as array of {latitude, longitude}
  const shape = coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
  res.json({ shape });
});

app.listen(PORT, () => {
  console.log(`Smart routes backend running on port ${PORT}`);
});
