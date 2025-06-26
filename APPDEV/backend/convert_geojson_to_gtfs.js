// convert_geojson_to_gtfs.js
// Script to convert GeoJSON-like FeatureCollection in 'sample' to GTFS files
// Usage: node convert_geojson_to_gtfs.js

const fs = require('fs');
const path = require('path');

// Path to the sample file
const SAMPLE_PATH = path.join(__dirname, 'sample');
// Output directory for GTFS files
const OUTPUT_DIR = path.join(__dirname, 'gtfs_output');

// Read the sample file
const sampleContent = fs.readFileSync(SAMPLE_PATH, 'utf8');

let featureCollection;

// Try to parse as JSON if file starts with '{'
if (sampleContent.trim().startsWith('{')) {
  try {
    featureCollection = JSON.parse(sampleContent);
  } catch (e) {
    console.error('Failed to parse sample file as JSON:', e.message);
    process.exit(1);
  }
} else {
  // Try to extract from variable assignment (e.g., var xy = {...}; or const xy = {...}; or , xy = {...};)
  // Find the start of 'xy = {'
  const xyStart = sampleContent.indexOf('xy = {');
  if (xyStart === -1) {
    console.error('Could not find "xy = {" in sample file.');
    process.exit(1);
  }
  // Find the full object by matching braces
  let braceCount = 0;
  let objStart = sampleContent.indexOf('{', xyStart);
  let objEnd = objStart;
  for (let i = objStart; i < sampleContent.length; i++) {
    if (sampleContent[i] === '{') braceCount++;
    if (sampleContent[i] === '}') braceCount--;
    if (braceCount === 0) {
      objEnd = i + 1;
      break;
    }
  }
  const objectString = sampleContent.slice(objStart, objEnd);
  try {
    featureCollection = eval('(' + objectString + ')');
  } catch (e) {
    console.error('Failed to eval FeatureCollection:', e.message);
    process.exit(1);
  }
}

if (!featureCollection.features) {
  console.error('No features found in FeatureCollection.');
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Prepare GTFS data arrays
const routes = [
  'route_id,route_short_name,route_long_name,route_type,route_color'
];
const shapes = [
  'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence'
];
const trips = [
  'route_id,service_id,trip_id,shape_id'
];

featureCollection.features.forEach((feature, idx) => {
  const routeId = `route_${idx+1}`;
  const shapeId = `shape_${idx+1}`;
  const tripId = `trip_${idx+1}`;
  const name = feature.properties?.name || routeId;
  const color = (feature.properties?.color || '').replace('#', '');

  // Add to routes.txt
  routes.push(`${routeId},${name},${name},3,${color}`); // 3 = bus

  // Add to trips.txt
  trips.push(`${routeId},WEEK,${tripId},${shapeId}`);

  // Add to shapes.txt
  if (feature.geometry?.type === 'LineString' && Array.isArray(feature.geometry.coordinates)) {
    feature.geometry.coordinates.forEach((coord, seq) => {
      shapes.push(`${shapeId},${coord[1]},${coord[0]},${seq+1}`);
    });
  }
});

// Write GTFS files
fs.writeFileSync(path.join(OUTPUT_DIR, 'routes.txt'), routes.join('\n'));
fs.writeFileSync(path.join(OUTPUT_DIR, 'shapes.txt'), shapes.join('\n'));
fs.writeFileSync(path.join(OUTPUT_DIR, 'trips.txt'), trips.join('\n'));

console.log('GTFS files generated in', OUTPUT_DIR);
