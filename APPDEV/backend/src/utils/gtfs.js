const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/sync');

const GTFS_DIR = path.join(__dirname, '../../gtfs_output');

function readCSV(filename) {
  const filePath = path.join(GTFS_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf8');
  return csvParse.parse(content, { columns: true });
}

function getRoutesWithPolylines() {
  const routes = readCSV('routes.txt');
  const trips = readCSV('trips.txt');
  const shapes = readCSV('shapes.txt');

  // Map shape_id to polyline points
  const shapeMap = {};
  for (const shape of shapes) {
    if (!shapeMap[shape.shape_id]) shapeMap[shape.shape_id] = [];
    shapeMap[shape.shape_id].push({
      lat: parseFloat(shape.shape_pt_lat),
      lon: parseFloat(shape.shape_pt_lon),
      seq: parseInt(shape.shape_pt_sequence, 10),
    });
  }
  // Sort points by sequence
  for (const sid in shapeMap) {
    shapeMap[sid].sort((a, b) => a.seq - b.seq);
  }

  // Map route_id to shape_id (use first trip for each route)
  const routeShapeMap = {};
  for (const trip of trips) {
    if (!routeShapeMap[trip.route_id]) {
      routeShapeMap[trip.route_id] = trip.shape_id;
    }
  }

  // Build output
  return routes.map(route => {
    const shape_id = routeShapeMap[route.route_id];
    const polyline = shape_id ? shapeMap[shape_id] : [];
    return {
      route_id: route.route_id,
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      route_type: route.route_type,
      route_color: route.route_color,
      polyline: polyline.map(pt => ({ latitude: pt.lat, longitude: pt.lon })),
    };
  });
}

module.exports = { getRoutesWithPolylines };
