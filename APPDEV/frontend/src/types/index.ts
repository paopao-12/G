export interface Location {
  latitude: number;
  longitude: number;
}

export interface FareCalculation {
  distance: number;
  baseFare: number;
  additionalFare: number;
  totalFare: number;
  discountedFare?: number;
}

export type PassengerType = 'regular' | 'student' | 'senior' | 'pwd';

export interface LocationOption {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface RouteStop {
  stop_id: number;
  stop_name: string;
  latitude: number;
  longitude: number;
  distance_to_next?: number;
  accessibility?: number;
}

export interface Route {
  id: number;
  name: string;
  stops: RouteStop[];
}

export interface RouteSuggestion {
  id: string;
  route: Route;
  originStop: RouteStop;
  destinationStop: RouteStop;
  estimatedFare: number;
  distance: number;
  duration: number;
  accessibilityScore?: number;
  trafficLevel?: number | null;
  from: LocationOption;
  to: LocationOption;
  estimatedTime: number;
  type: 'jeepney';
  stops: LocationOption[];
  routeName: string;
}

export interface RouteFilter {
  maxDistance?: number;
  maxFare?: number;
  maxDuration?: number;
  timeOfDay?: boolean;
  avoidRoutes?: number[];
  preferredRoutes?: number[];
  accessibility?: boolean;
  trafficAware?: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp?: number;
} 