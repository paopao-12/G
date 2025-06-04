import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLocation from 'expo-location';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';


const API_URL = Platform.select({
    android: 'http://192.168.254.112:4000/api/transport', // For Android Emulator
    ios: 'http://localhost:4000/api/transport', // For iOS Simulator
    default: 'http://localhost:4000/api/transport',
});


const STORAGE_KEYS = {
    ROUTES: '@davao_commuter_routes',
    STOPS: '@davao_commuter_stops',
    LAST_SYNC: '@davao_commuter_last_sync',
    OFFLINE_MODE: '@davao_commuter_offline_mode',
};


const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;


const MOCK_DATA = {
    routes: [
        {
            id: 1,
            name: "Route 1: Bangkal - Roxas",
            stops: [
                { stop_id: 1, stop_name: "DXSS (Bangkal)", sequence: 1, latitude: 7.0722, longitude: 125.6131 },
                { stop_id: 2, stop_name: "Roxas Avenue", sequence: 2, latitude: 7.0744, longitude: 125.6155 },
                { stop_id: 3, stop_name: "SM City Davao", sequence: 3, latitude: 7.0733, longitude: 125.6144 },
            ]
        },
        {
            id: 2,
            name: "Route 2: Matina - Ecoland",
            stops: [
                { stop_id: 4, stop_name: "Matina Crossing", sequence: 1, latitude: 7.0822, longitude: 125.6231 },
                { stop_id: 5, stop_name: "Ecoland Terminal Crossing", sequence: 2, latitude: 7.0833, longitude: 125.6244 },
                { stop_id: 6, stop_name: "Victoria Plaza", sequence: 3, latitude: 7.0833, longitude: 125.6244 },
            ]
        }
    ],
    stops: [
        { id: 1, name: "DXSS (Bangkal)", latitude: 7.0722, longitude: 125.6131 },
        { id: 2, name: "Roxas Avenue", latitude: 7.0744, longitude: 125.6155 },
        { id: 3, name: "SM City Davao", latitude: 7.0733, longitude: 125.6144 },
        { id: 4, name: "Matina Crossing", latitude: 7.0822, longitude: 125.6231 },
        { id: 5, name: "Ecoland Terminal Crossing", latitude: 7.0833, longitude: 125.6244 },
        { id: 6, name: "Victoria Plaza", latitude: 7.0833, longitude: 125.6244 },
    ]
};

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000, 
    headers: {
        'Content-Type': 'application/json',
    },
});


axiosInstance.interceptors.request.use(
    async (config) => {
        console.log(`Making request to: ${config.baseURL}${config.url}`);
      
        const offlineMode = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
        if (offlineMode === 'true') {
            throw new Error('OFFLINE_MODE');
        }

       
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            console.log('No network connection, enabling offline mode');
            await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, 'true');
            throw new Error('OFFLINE_MODE');
        }
        
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);


axiosInstance.interceptors.response.use(
    (response) => {
        console.log(`Response from ${response.config.url}:`, response.status);
        return response;
    },
    async (error) => {
        if (axios.isAxiosError(error)) {
            console.error('Response error details:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                code: error.code,
            });

        
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                
                await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, 'true');
                throw new Error('OFFLINE_MODE');
            }

         
            if (error.code === 'ECONNABORTED') {
                throw new Error('Request timed out. Please check your internet connection.');
            }
            if (!error.response) {
                throw new Error(`Network error. Please check your internet connection and try again. (${error.message})`);
            }
            if (error.response.status === 404) {
                throw new Error('The requested resource was not found.');
            }
            if (error.response.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }
        }
        return Promise.reject(error);
    }
);

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; 

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries === 0) {
      console.error('Max retries reached:', error);
      throw error;
    }

    
    if (
      axios.isAxiosError(error) &&
      (!error.response || error.response.status >= 500)
    ) {
      console.log(`Retrying request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY);
      return retryRequest(requestFn, retries - 1);
    }

    throw error;
  }
};

export interface Stop {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    distance?: number;
}

export interface RouteStop {
    stop_id: number;
    stop_name: string;
    sequence: number;
    distance_to_next?: number;
    latitude: number;
    longitude: number;
    accessibility?: number;
}

export interface Route {
    id: number;
    name: string;
    stops: RouteStop[];
}

export interface FareInfo {
    distance_km: number;
    fare: number;
    route_name: string;
}

export interface UserLocation {
    latitude: number;
    longitude: number;
    timestamp?: number;
}

export interface NearestStop {
    stop: Stop;
    distance: number;
}

export interface RouteSuggestion {
    route: Route;
    originStop: RouteStop;
    destinationStop: RouteStop;
    estimatedFare: number;
    distance: number;
    duration: number; 
    accessibilityScore?: number;
    trafficLevel?: number | null;
}

export interface JeepneyLocation {
    id: string;
    routeId: number;
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    lastUpdated: Date;
    status: 'active' | 'inactive' | 'maintenance';
    currentStop?: RouteStop;
    nextStop?: RouteStop;
    estimatedArrival?: Date;
}

export interface MapRegion {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
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

export interface TrafficData {
    [key: string]: number; 
}

const handleError = (error: unknown, context: string): never => {
  console.error(`Error ${context}:`, error);
  
  if (axios.isAxiosError(error)) {
  
    console.error('Axios error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      },
    });

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please check your internet connection.');
    }
    if (!error.response) {
      throw new Error(`Network error. Please check your internet connection and try again. (${error.message})`);
    }
    if (error.response.status === 404) {
      throw new Error('The requested resource was not found.');
    }
    if (error.response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error(error.response.data?.message || `Failed to ${context}`);
  }
  
  throw error;
};


const isCacheValid = async (): Promise<boolean> => {
  try {
    const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (!lastSync) return false;
    
    const lastSyncTime = parseInt(lastSync, 10);
    return Date.now() - lastSyncTime < CACHE_EXPIRATION;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
};


const updateLastSync = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error('Error updating last sync time:', error);
  }
};


const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting cached data for ${key}:`, error);
    return null;
  }
};


const cacheData = async <T>(key: string, data: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error caching data for ${key}:`, error);
  }
};


export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; 
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
};

const testBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await axiosInstance.get('/health'); 
    return response.status === 200;
  } catch {
    return false;
  }
};

const api = {
 
    getRoutes: async (latitude?: number, longitude?: number): Promise<Route[]> => {
        try {
            let url = `${API_URL}/routes`;
            if (latitude && longitude) {
                url += `?latitude=${latitude}&longitude=${longitude}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch routes');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching routes:', error);
            throw error;
        }
    },


    getStops: async (): Promise<Stop[]> => {
        try {
            const cachedStops = await getCachedData<Stop[]>(STORAGE_KEYS.STOPS);
            const cacheValid = await isCacheValid();

            if (cachedStops && cacheValid) {
                console.log('Using cached stops data');
                return cachedStops;
            }

         
            try {
                const stops = await retryRequest(() => 
                    axiosInstance.get('/stops').then(res => res.data)
                );
                
               
                await cacheData(STORAGE_KEYS.STOPS, stops);
                await updateLastSync();
                
                return stops;
            } catch (error) {
             
                const cachedStops = await getCachedData<Stop[]>(STORAGE_KEYS.STOPS);
                if (cachedStops) {
                    console.log('Network error, using cached stops data');
                    return cachedStops;
                }
                
            
                console.log('No cached data, using mock stops data');
                return MOCK_DATA.stops;
            }
        } catch (error) {
            console.error('Error fetching stops:', error);
            throw new Error('Failed to fetch stops');
        }
    },

    getFare: async (originId: number, destinationId: number): Promise<FareInfo> => {
        try {
            return await retryRequest(() => 
                axiosInstance.get('/fare', {
                    params: {
                        origin_id: originId,
                        destination_id: destinationId
                    }
                }).then(res => res.data)
            );
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return {
                    distance_km: 0,
                    fare: 0,
                    route_name: 'No direct route',
                };
            }
            return handleError(error, 'calculate fare');
        }
    },

    
    getRouteDetails: async (routeId: number): Promise<Route> => {
        try {
            
            const cachedRoutes = await getCachedData<Route[]>(STORAGE_KEYS.ROUTES);
            const cacheValid = await isCacheValid();

            if (cachedRoutes && cacheValid) {
                const cachedRoute = cachedRoutes.find(r => r.id === routeId);
                if (cachedRoute) {
                    console.log('Using cached route details');
                    return cachedRoute;
                }
            }

          
            const route = await retryRequest(() => 
                axiosInstance.get(`/routes/${routeId}`).then(res => res.data)
            );
            
            
            if (cachedRoutes) {
                const updatedRoutes = cachedRoutes.map(r => 
                    r.id === routeId ? route : r
                );
                await cacheData(STORAGE_KEYS.ROUTES, updatedRoutes);
                await updateLastSync();
            }
            
            return route;
        } catch (error) {
            
            const cachedRoutes = await getCachedData<Route[]>(STORAGE_KEYS.ROUTES);
            if (cachedRoutes) {
                const cachedRoute = cachedRoutes.find(r => r.id === routeId);
                if (cachedRoute) {
                    console.log('Network error, using cached route details');
                    return cachedRoute;
                }
            }
            return handleError(error, 'fetch route details');
        }
    },

    
    clearCache: async (): Promise<void> => {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ROUTES,
                STORAGE_KEYS.STOPS,
                STORAGE_KEYS.LAST_SYNC,
            ]);
            console.log('Cache cleared successfully');
        } catch (error) {
            console.error('Error clearing cache:', error);
            throw new Error('Failed to clear cache');
        }
    },

    
    getCurrentLocation: async (): Promise<UserLocation> => {
        try {
            const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Location permission denied');
            }

            const location = await ExpoLocation.getCurrentPositionAsync({
                accuracy: ExpoLocation.Accuracy.High,
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
        } catch (error) {
            console.error('Error getting location:', error);
            throw new Error('Failed to get current location');
        }
    },

    
    findNearestStops: async (location: UserLocation, maxDistance: number = 1000): Promise<NearestStop[]> => {
        try {
            const stops = await api.getStops();
            const nearestStops: NearestStop[] = [];

            for (const stop of stops) {
                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    stop.latitude,
                    stop.longitude
                );

                if (distance <= maxDistance) {
                    nearestStops.push({
                        stop,
                        distance,
                    });
                }
            }

            return nearestStops.sort((a, b) => a.distance - b.distance);
        } catch (error) {
            console.error('Error finding nearest stops:', error);
            throw new Error('Failed to find nearest stops');
        }
    },

   
    getRouteSuggestions: async (
        originLocation: UserLocation,
        destinationLocation: UserLocation,
        filters?: RouteFilter
    ): Promise<RouteSuggestion[]> => {
        try {
            console.log('Using mock route suggestions');
            
            // For testing, we'll use our mock data directly
            const routes = MOCK_DATA.routes;
            const suggestions: RouteSuggestion[] = [];

            // Find the nearest stops from our mock data
            const originStops = MOCK_DATA.stops.map(stop => ({
                stop,
                distance: calculateDistance(
                    originLocation.latitude,
                    originLocation.longitude,
                    stop.latitude,
                    stop.longitude
                )
            })).sort((a, b) => a.distance - b.distance);

            const destinationStops = MOCK_DATA.stops.map(stop => ({
                stop,
                distance: calculateDistance(
                    destinationLocation.latitude,
                    destinationLocation.longitude,
                    stop.latitude,
                    stop.longitude
                )
            })).sort((a, b) => a.distance - b.distance);

            // Get the nearest origin and destination stops
            const nearestOrigin = originStops[0];
            const nearestDest = destinationStops[0];

            if (!nearestOrigin || !nearestDest) {
                throw new Error('No stops found near the selected locations');
            }

            // Find routes that contain both stops
            for (const route of routes) {
                const originStopIndex = route.stops.findIndex(
                    stop => stop.stop_id === nearestOrigin.stop.id
                );
                const destinationStopIndex = route.stops.findIndex(
                    stop => stop.stop_id === nearestDest.stop.id
                );

                if (originStopIndex !== -1 && destinationStopIndex !== -1 && originStopIndex < destinationStopIndex) {
                    // Calculate total distance
                    let totalDistance = 0;
                    for (let i = originStopIndex; i < destinationStopIndex; i++) {
                        const nextStop = route.stops[i + 1];
                        totalDistance += calculateDistance(
                            route.stops[i].latitude,
                            route.stops[i].longitude,
                            nextStop.latitude,
                            nextStop.longitude
                        );
                    }

                    // Calculate duration (assuming average speed of 20 km/h)
                    const duration = (totalDistance / 1000) / 20 * 60; // in minutes

                    // Calculate fare (₱10 base + ₱2 per km)
                    const fare = Math.ceil(10 + ((totalDistance / 1000) * 2));

                    suggestions.push({
                        route,
                        originStop: route.stops[originStopIndex],
                        destinationStop: route.stops[destinationStopIndex],
                        estimatedFare: fare,
                        distance: totalDistance,
                        duration: duration,
                        accessibilityScore: 1,
                        trafficLevel: null
                    });
                }
            }

            return suggestions.sort((a, b) => a.duration - b.duration);
        } catch (error) {
            console.error('Error getting route suggestions:', error);
            throw new Error('Failed to get route suggestions');
        }
    },

  
    getRouteMapRegion: (route: Route): MapRegion => {
        const latitudes = route.stops.map(stop => stop.latitude);
        const longitudes = route.stops.map(stop => stop.longitude);

        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);

        const latitudeDelta = (maxLat - minLat) * 1.5; 
        const longitudeDelta = (maxLng - minLng) * 1.5;

        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta,
            longitudeDelta,
        };
    },

    
    getEstimatedArrival: async (
        jeepneyId: string,
        stopId: number
    ): Promise<Date> => {
        try {
            const response = await axiosInstance.get(`/jeepneys/${jeepneyId}/eta/${stopId}`);
            return new Date(response.data.estimatedArrival);
        } catch (error) {
            console.error('Error getting estimated arrival:', error);
            throw new Error('Failed to get estimated arrival time');
        }
    },

    getJeepneyLocations: async (routeId: number): Promise<JeepneyLocation[]> => {
        try {
            const response = await axiosInstance.get(`/jeepneys/${routeId}/locations`);
            return response.data.map((location: any) => ({
                ...location,
                lastUpdated: new Date(location.lastUpdated),
                estimatedArrival: location.estimatedArrival ? new Date(location.estimatedArrival) : undefined,
            }));
        } catch (error) {
            console.error('Error fetching jeepney locations:', error);
            throw new Error('Failed to fetch jeepney locations');
        }
    },

  
    subscribeToJeepneyUpdates: (
        routeId: number,
        onUpdate: (locations: JeepneyLocation[]) => void,
        onError: (error: Error) => void
    ) => {
        const ws = new WebSocket(`${API_URL.replace('http', 'ws')}/jeepneys/${routeId}/track`);
        
        ws.onmessage = (event) => {
            try {
                const locations = JSON.parse(event.data).map((location: any) => ({
                    ...location,
                    lastUpdated: new Date(location.lastUpdated),
                    estimatedArrival: location.estimatedArrival ? new Date(location.estimatedArrival) : undefined,
                }));
                onUpdate(locations);
            } catch (error) {
                onError(new Error('Failed to parse jeepney location data'));
            }
        };

        ws.onerror = (error) => {
            onError(new Error('WebSocket connection error'));
        };

        return () => {
            ws.close();
        };
    },

    
    getTrafficData: async (routeId: number): Promise<TrafficData> => {
        try {
            const response = await axiosInstance.get(`/routes/${routeId}/traffic`);
            return response.data;
        } catch (error) {
            console.error('Error fetching traffic data:', error);
            throw new Error('Failed to fetch traffic data');
        }
    },

    
    setOfflineMode: async (enabled: boolean): Promise<void> => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, enabled.toString());
        } catch (error) {
            console.error('Error setting offline mode:', error);
            throw new Error('Failed to set offline mode');
        }
    },

   
    isOfflineMode: async (): Promise<boolean> => {
        try {
            const offlineMode = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
            return offlineMode === 'true';
        } catch (error) {
            console.error('Error checking offline mode:', error);
            return false;
        }
    },

    getNearbyStops: async (latitude: number, longitude: number, radius: number = 1): Promise<Stop[]> => {
        try {
            const response = await fetch(
                `${API_URL}/stops/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
            );
            if (!response.ok) {
                throw new Error('Failed to fetch nearby stops');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching nearby stops:', error);
            throw error;
        }
    },
};

export default api;