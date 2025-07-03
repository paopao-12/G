import { Route } from '@react-navigation/native';

export interface LatLng {
  lat: number;
  lon: number;
}
export type PassengerType = 'regular' | 'senior' | 'student' | 'disabled';

export interface RouteSuggestion {
  shape_id: string;
  entry: LatLng;
  exit: LatLng;
  entryDistance: number;
  exitDistance: number;
  totalDistance: number;
}

export type RootStackParamList = {
  Splash: undefined;
  LoginSignup: undefined;
  Home: undefined;
  RouteSuggest: undefined;
  Results: {
    suggestions: RouteSuggestion[];
    userLocation: LatLng;
    destLoc: LatLng;
    origin?: string;          // Make optional if not always passed
    destination?: string;     // Make optional if not always passed
    passengerType?: PassengerType; // Make optional if not always passed
    suggestRoutes?: RouteSuggestion[]; // Make optional if not always passed
    fare?: string; // Make optional if not always passed
  };
  RouteDetails: {
  suggestions: RouteSuggestion[];
  userLocation: LatLng;
  destLoc: LatLng;
  route: RouteSuggestion;
  passengerType: PassengerType;
  fare: string;

  };

  
  ResetPassword: { token?: string } | undefined;
  AdminUsers: undefined;
};

