export interface Location {
  latitude: number;
  longitude: number;
  name: string;
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

export interface RouteSuggestion {
  id: string;
  from: LocationOption;
  to: LocationOption;
  distance: number;
  estimatedTime: number;
  fare: number;
  type: 'jeepney';
  stops: LocationOption[];
  routeName: string;
} 