import { RouteSuggestion, LocationOption, PassengerType } from './index';

export type RootStackParamList = {
  Splash: undefined;
  LoginSignup: undefined;
  Home: undefined;
  RouteSuggest: undefined
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
  ResetPassword: { token?: string } | undefined;
  AdminUsers: undefined;
};