import { LocationOption, RouteSuggestion } from '../types';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const LOCATIONS: LocationOption[] = [
  { 
    id: 'current', 
    name: 'Current Location',
    latitude: 7.1907,
    longitude: 125.4553
  },
  { 
    id: 'sm_lanang', 
    name: 'SM Lanang Premier',
    latitude: 7.1127,
    longitude: 125.6628
  },
  { 
    id: 'abreeza', 
    name: 'Abreeza Mall',
    latitude: 7.0833,
    longitude: 125.6083
  },
  { 
    id: 'robinsons', 
    name: 'Robinsons Cybergate',
    latitude: 7.0833,
    longitude: 125.6083
  },
  { 
    id: 'matina', 
    name: 'Matina Town Square',
    latitude: 7.0833,
    longitude: 125.6083
  },
  { 
    id: 'bangkal', 
    name: 'Bangkal',
    latitude: 7.0833,
    longitude: 125.6083
  },
];

export const ROUTES: RouteSuggestion[] = [
  {
    id: 'route1',
    from: LOCATIONS[0],
    to: LOCATIONS[1],
    type: 'jeepney',
    routeName: 'Acacia-Indangan-Mahayag',
    fare: 33,
    estimatedTime: 30,
    distance: 5.2,
    stops: [
      { id: 'stop1', name: 'ULAS - MAGSAYSAY', latitude: 7.0833, longitude: 125.6083 },
      { id: 'stop2', name: 'SASA via JP LAUREL', latitude: 7.0833, longitude: 125.6083 }
    ]
  },
  {
    id: 'route2',
    from: LOCATIONS[0],
    to: LOCATIONS[2],
    type: 'jeepney',
    routeName: 'Bago Aplaya',
    fare: 20,
    estimatedTime: 20,
    distance: 3.5,
    stops: [
      { id: 'stop3', name: 'JP LAUREL', latitude: 7.0833, longitude: 125.6083 }
    ]
  },
  {
    id: 'route3',
    from: LOCATIONS[1],
    to: LOCATIONS[3],
    type: 'jeepney',
    routeName: 'Bangkal',
    fare: 25,
    estimatedTime: 25,
    distance: 4.1,
    stops: [
      { id: 'stop4', name: 'LANANG - BAJADA', latitude: 7.0833, longitude: 125.6083 },
      { id: 'stop5', name: 'ROBINSONS', latitude: 7.0833, longitude: 125.6083 }
    ]
  }
];

const getCurrentLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'Location permission is required to use this feature');
    return null;
  }
  let location = await Location.getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}; 