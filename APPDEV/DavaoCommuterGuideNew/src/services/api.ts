import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoLocation from 'expo-location';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Update this to your actual backend server URL
const API_URL = Platform.select({
    android: 'http://192.168.1.11:4000/api/transport', // For Android Emulator
    ios: 'http://localhost:4000/api/transport', // For iOS Simulator
    default: 'http://localhost:4000/api/transport',
});

// Storage keys
const STORAGE_KEYS = {
    ROUTES: '@davao_commuter_routes',
    STOPS: '@davao_commuter_stops',
    LAST_SYNC: '@davao_commuter_last_sync',
    OFFLINE_MODE: '@davao_commuter_offline_mode',
};

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Mock data for offline mode
const MOCK_DATA = {
    routes: [
        {
            id: 1,
            name: "Route 1: Bangkal - Roxas",
            stops: [
                { stop_id: 1, stop_name: "Bangkal Terminal", sequence: 1, latitude: 7.0722, longitude: 125.6131 },
                { stop_id: 2, stop_name: "Roxas Avenue", sequence: 2, latitude: 7.0733, longitude: 125.6144 },
                { stop_id: 3, stop_name: "San Pedro Street", sequence: 3, latitude: 7.0744, longitude: 125.6155 },
            ]
        },
        {
            id: 2,
            name: "Route 2: Matina - Ecoland",
            stops: [
                { stop_id: 4, stop_name: "Matina Terminal", sequence: 1, latitude: 7.0822, longitude: 125.6231 },
                { stop_id: 5, stop_name: "Ecoland Terminal", sequence: 2, latitude: 7.0833, longitude: 125.6244 },
            ]
        }
    ],
    stops: [
        { id: 1, name: "Bangkal Terminal", latitude: 7.0722, longitude: 125.6131 },
        { id: 2, name: "Roxas Avenue", latitude: 7.0733, longitude: 125.6144 },
        { id: 3, name: "San Pedro Street", latitude: 7.0744, longitude: 125.6155 },
        { id: 4, name: "Matina Terminal", latitude: 7.0822, longitude: 125.6231 },
        { id: 5, name: "Ecoland Terminal", latitude: 7.0833, longitude: 125.6244 },
    ]
};

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor for logging and offline mode
axiosInstance.interceptors.request.use(
    async (config) => {
        console.log(`Making request to: ${config.baseURL}${config.url}`);
        
        // Check if we're in offline mode
        const offlineMode = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
        if (offlineMode === 'true') {
            throw new Error('OFFLINE_MODE');
        }

        // Check network connectivity before making request
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

// Add response interceptor for logging and error handling
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

            // Check network connectivity
            const netInfo = await NetInfo.fetch();
            if (!netInfo.isConnected) {
                // Enable offline mode
                await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, 'true');
                throw new Error('OFFLINE_MODE');
            }

            // Handle specific error cases
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

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle retries
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

    // Only retry on network errors or 5xx server errors
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
}

export interface RouteStop {
    stop_id: number;
    stop_name: string;
    sequence: number;
    distance_to_next?: number;
    latitude: number;
    longitude: number;
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
}

export interface NearestStop {
    stop: Stop;
    distance: number; // in meters
}

export interface RouteSuggestion {
    route: Route;
    originStop: RouteStop;
    destinationStop: RouteStop;
    estimatedFare: number;
    distance: number;
    duration: number; // in minutes
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
    preferredRoutes?: number[];
    avoidRoutes?: number[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface TrafficData {
    [key: string]: number; // key format: "stopId1-stopId2", value: congestion level (0-1)
}

const handleError = (error: unknown, context: string): never => {
  console.error(`Error ${context}:`, error);
  
  if (axios.isAxiosError(error)) {
    // Log detailed error information
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

// Helper function to check if cache is valid
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

// Helper function to update last sync time
const updateLastSync = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error('Error updating last sync time:', error);
  }
};

// Helper function to get cached data
const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting cached data for ${key}:`, error);
    return null;
  }
};

// Helper function to cache data
const cacheData = async <T>(key: string, data: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error caching data for ${key}:`, error);
  }
};

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

const api = {
    // Get all routes with their stops
    getRoutes: async (): Promise<Route[]> => {
        try {
            // Try to get cached data first
            const cachedRoutes = await getCachedData<Route[]>(STORAGE_KEYS.ROUTES);
            const cacheValid = await isCacheValid();

            if (cachedRoutes && cacheValid) {
                console.log('Using cached routes data');
                return cachedRoutes;
            }

            // If no cache or cache expired, fetch from API
            try {
                const routes = await retryRequest(() => 
                    axiosInstance.get('/routes').then(res => res.data)
                );
                
                // Cache the new data
                await cacheData(STORAGE_KEYS.ROUTES, routes);
                await updateLastSync();
                
                return routes;
            } catch (error) {
                // If network request fails, try to use cached data
                const cachedRoutes = await getCachedData<Route[]>(STORAGE_KEYS.ROUTES);
                if (cachedRoutes) {
                    console.log('Network error, using cached routes data');
                    return cachedRoutes;
                }
                
                // If no cached data, use mock data
                console.log('No cached data, using mock routes data');
                return MOCK_DATA.routes;
            }
        } catch (error) {
            console.error('Error fetching routes:', error);
            throw new Error('Failed to fetch routes');
        }
    },

    // Get all stops
    getStops: async (): Promise<Stop[]> => {
        try {
            // Try to get cached data first
            const cachedStops = await getCachedData<Stop[]>(STORAGE_KEYS.STOPS);
            const cacheValid = await isCacheValid();

            if (cachedStops && cacheValid) {
                console.log('Using cached stops data');
                return cachedStops;
            }

            // If no cache or cache expired, fetch from API
            try {
                const stops = await retryRequest(() => 
                    axiosInstance.get('/stops').then(res => res.data)
                );
                
                // Cache the new data
                await cacheData(STORAGE_KEYS.STOPS, stops);
                await updateLastSync();
                
                return stops;
            } catch (error) {
                // If network request fails, try to use cached data
                const cachedStops = await getCachedData<Stop[]>(STORAGE_KEYS.STOPS);
                if (cachedStops) {
                    console.log('Network error, using cached stops data');
                    return cachedStops;
                }
                
                // If no cached data, use mock data
                console.log('No cached data, using mock stops data');
                return MOCK_DATA.stops;
            }
        } catch (error) {
            console.error('Error fetching stops:', error);
            throw new Error('Failed to fetch stops');
        }
    },

    // Get fare between two stops
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
            return handleError(error, 'calculate fare');
        }
    },

    // Get detailed route information
    getRouteDetails: async (routeId: number): Promise<Route> => {
        try {
            // Try to get cached routes first
            const cachedRoutes = await getCachedData<Route[]>(STORAGE_KEYS.ROUTES);
            const cacheValid = await isCacheValid();

            if (cachedRoutes && cacheValid) {
                const cachedRoute = cachedRoutes.find(r => r.id === routeId);
                if (cachedRoute) {
                    console.log('Using cached route details');
                    return cachedRoute;
                }
            }

            // If no cache or route not found in cache, fetch from API
            const route = await retryRequest(() => 
                axiosInstance.get(`/routes/${routeId}`).then(res => res.data)
            );
            
            // Update the cache with the new route data
            if (cachedRoutes) {
                const updatedRoutes = cachedRoutes.map(r => 
                    r.id === routeId ? route : r
                );
                await cacheData(STORAGE_KEYS.ROUTES, updatedRoutes);
                await updateLastSync();
            }
            
            return route;
        } catch (error) {
            // If network request fails, try to use cached data
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

    // Clear all cached data
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

    // Get user's current location
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

    // Find nearest stops to a location
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

    // Get route suggestions between two locations
    getRouteSuggestions: async (
        originLocation: UserLocation,
        destinationLocation: UserLocation,
        filters?: RouteFilter
    ): Promise<RouteSuggestion[]> => {
        try {
            // Find nearest stops to origin and destination
            const originStops = await api.findNearestStops(originLocation, filters?.maxDistance);
            const destinationStops = await api.findNearestStops(destinationLocation, filters?.maxDistance);

            if (originStops.length === 0 || destinationStops.length === 0) {
                throw new Error('No stops found near the selected locations');
            }

            // Get all routes
            const routes = await api.getRoutes();
            const suggestions: RouteSuggestion[] = [];

            // Find routes that connect origin and destination
            for (const route of routes) {
                // Skip routes in avoidRoutes
                if (filters?.avoidRoutes?.includes(route.id)) continue;

                // Skip if not in preferredRoutes (if specified)
                if (filters?.preferredRoutes && !filters.preferredRoutes.includes(route.id)) continue;

                const originStopIndex = route.stops.findIndex(
                    stop => stop.stop_id === originStops[0].stop.id
                );
                const destinationStopIndex = route.stops.findIndex(
                    stop => stop.stop_id === destinationStops[0].stop.id
                );

                if (originStopIndex !== -1 && destinationStopIndex !== -1 && originStopIndex < destinationStopIndex) {
                    // Calculate total distance
                    let totalDistance = 0;
                    for (let i = originStopIndex; i < destinationStopIndex; i++) {
                        totalDistance += route.stops[i].distance_to_next || 0;
                    }

                    // Get fare information
                    const fareInfo = await api.getFare(
                        originStops[0].stop.id,
                        destinationStops[0].stop.id
                    );

                    // Estimate duration (assuming average speed of 20 km/h)
                    const duration = (totalDistance / 20) * 60; // in minutes

                    // Apply filters
                    if (filters?.maxFare && fareInfo.fare > filters.maxFare) continue;
                    if (filters?.maxDuration && duration > filters.maxDuration) continue;

                    // Adjust duration based on time of day
                    let adjustedDuration = duration;
                    if (filters?.timeOfDay) {
                        const hour = new Date().getHours();
                        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
                        adjustedDuration = isRushHour ? duration * 1.5 : duration;
                    }

                    suggestions.push({
                        route,
                        originStop: route.stops[originStopIndex],
                        destinationStop: route.stops[destinationStopIndex],
                        estimatedFare: fareInfo.fare,
                        distance: totalDistance,
                        duration: adjustedDuration,
                    });
                }
            }

            return suggestions.sort((a, b) => a.distance - b.distance);
        } catch (error) {
            console.error('Error getting route suggestions:', error);
            throw new Error('Failed to get route suggestions');
        }
    },

    // Get map region that includes all stops in a route
    getRouteMapRegion: (route: Route): MapRegion => {
        const latitudes = route.stops.map(stop => stop.latitude);
        const longitudes = route.stops.map(stop => stop.longitude);

        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);

        const latitudeDelta = (maxLat - minLat) * 1.5; // Add 50% padding
        const longitudeDelta = (maxLng - minLng) * 1.5;

        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta,
            longitudeDelta,
        };
    },

    // Get estimated arrival time for a jeepney at a stop
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

    // Get real-time jeepney locations for a route
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

    // Subscribe to real-time jeepney updates
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

    // Get traffic data for a route
    getTrafficData: async (routeId: number): Promise<TrafficData> => {
        try {
            const response = await axiosInstance.get(`/routes/${routeId}/traffic`);
            return response.data;
        } catch (error) {
            console.error('Error fetching traffic data:', error);
            throw new Error('Failed to fetch traffic data');
        }
    },

    // Enable/disable offline mode
    setOfflineMode: async (enabled: boolean): Promise<void> => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, enabled.toString());
        } catch (error) {
            console.error('Error setting offline mode:', error);
            throw new Error('Failed to set offline mode');
        }
    },

    // Check if we're in offline mode
    isOfflineMode: async (): Promise<boolean> => {
        try {
            const offlineMode = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
            return offlineMode === 'true';
        } catch (error) {
            console.error('Error checking offline mode:', error);
            return false;
        }
    },
};

export default api; 