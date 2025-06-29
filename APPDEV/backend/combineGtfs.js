const fs = require('fs');
const csv = require('csv-parser');

const routes = {};
const trips = {};
const shapes = {};

function readCSV(filePath) {
  return new Promise((resolve) => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => data.push(row))
      .on('end', () => resolve(data));
  });
}

async function combineGTFS() {
  const routesData = await readCSV('routes.txt');
  const tripsData = await readCSV('trips.txt');
  const shapesData = await readCSV('shapes.txt');

  // Group shapes by shape_id
  shapesData.forEach(row => {
    const shapeId = row.shape_id;
    const lat = parseFloat(row.shape_pt_lat);
    const lon = parseFloat(row.shape_pt_lon);
    const seq = parseInt(row.shape_pt_sequence);
    if (!shapes[shapeId]) shapes[shapeId] = [];
    shapes[shapeId].push({ lat, lon, seq });
  });

  // Sort each shape by sequence
  for (const shapeId in shapes) {
    shapes[shapeId].sort((a, b) => a.seq - b.seq);
    shapes[shapeId] = shapes[shapeId].map(({ lat, lon }) => ({ lat, lon }));
  }

  // Map route_id → shape_id (via one trip per route)
  tripsData.forEach(trip => {
    const routeId = trip.route_id;
    if (!trips[routeId]) {
      trips[routeId] = trip.shape_id; // use the first shape_id seen
    }
  });

  // Combine all together
  const combinedRoutes = routesData.map(route => {
    const shapeId = trips[route.route_id];
    return {
      route_id: route.route_id,
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      shape_id: shapeId,
      shape: shapes[shapeId] || []
    };
  });

  fs.writeFileSync('combined_routes.json', JSON.stringify(combinedRoutes, null, 2));
  console.log('✅ combined_routes.json generated!');

  // --- New: shapes_with_names.json ---
  // Map shape_id to { route_short_name, route_long_name, shape: [...] }
  const shapeIdToRoute = {};
  combinedRoutes.forEach(route => {
    if (!route.shape_id) return;
    shapeIdToRoute[route.shape_id] = {
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      shape: route.shape
    };
  });
  fs.writeFileSync('shapes_with_names.json', JSON.stringify(shapeIdToRoute, null, 2));
  console.log('✅ shapes_with_names.json generated!');
}

combineGTFS();
