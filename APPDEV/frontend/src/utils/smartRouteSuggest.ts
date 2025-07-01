import { haversine } from './haversine';

export interface LatLng {
  lat: number;
  lon: number;
}

export interface RouteSuggestion {
  shape_id: string;
  route_short_name?: string; // Add optional route_short_name
  entry: LatLng;
  exit: LatLng;
  entryDistance: number;
  exitDistance: number;
  totalDistance: number;
  routeDistance: number;
}

export function findNearestPoint(location: LatLng, points: LatLng[]) {
  let minDist = Infinity;
  let nearest: LatLng | null = null;
  for (const pt of points) {
    const d = haversine(location.lat, location.lon, pt.lat, pt.lon);
    if (d < minDist) {
      minDist = d;
      nearest = pt;
    }
  }
  return { point: nearest!, distance: minDist };
}

// ... existing code ...

export function suggestRoutes(
  user: LatLng,
  dest: LatLng,
  shapes: Record<string, LatLng[]>,
  routeShortNames: Record<string, string>,
  threshold = 100
): RouteSuggestion[] {
  const suggestions: RouteSuggestion[] = [];
  for (const [shape_id, points] of Object.entries(shapes)) {
    const userNear = findNearestPoint(user, points);
    const destNear = findNearestPoint(dest, points);
    if (userNear.distance < threshold && destNear.distance < threshold) {
      // Calculate routeDistance in km
      const routeDistance = haversine(
        userNear.point.lat,
        userNear.point.lon,
        destNear.point.lat,
        destNear.point.lon
      ) / 1000;
      suggestions.push({
        shape_id,
        route_short_name: routeShortNames[shape_id],
        entry: userNear.point,
        exit: destNear.point,
        entryDistance: userNear.distance,
        exitDistance: destNear.distance,
        totalDistance: userNear.distance + destNear.distance,
        routeDistance, // <-- set here
      });
    }
  }
  // Sort by total walking distance
  return suggestions.sort((a, b) => a.totalDistance - b.totalDistance);
}
