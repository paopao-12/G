import { RouteSuggestion, LocationOption, PassengerType } from './index';

export type RootStackParamList = {
  Home: undefined;
  Results: {
    origin: string;
    destination: string;
    passengerType: PassengerType;
    suggestedRoutes: RouteSuggestion[];
  };
  RouteDetails: {
    route: RouteSuggestion;
    passengerType: PassengerType;
  };
}; 