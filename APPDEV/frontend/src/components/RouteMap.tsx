import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import api, { FareInfo } from '../services/api';

// Extend Route type locally to include stops and route_id
type RouteStop = {
    stop_id: number;
    stop_name: string;
    latitude: number;
    longitude: number;
};
type Route = {
    route_id: string;
    route_color?: string;
    stops?: RouteStop[];
    polyline?: { latitude: number; longitude: number }[];
};
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface RouteMapProps {
    routes: Route[]; // Now accepts multiple routes
    onStopPress?: (stopId: number) => void;
    showJeepneyLocations?: boolean;
    showTraffic?: boolean;
}

const RouteMap: React.FC<RouteMapProps> = ({
    routes,
    onStopPress,
    showJeepneyLocations = true,
    showTraffic = true,
}) => {
    const [selectedOrigin, setSelectedOrigin] = useState<RouteStop | null>(null);
    const [selectedDestination, setSelectedDestination] = useState<RouteStop | null>(null);
    const [fareInfo, setFareInfo] = useState<FareInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number } | null>(null);
    const mapRef = useRef<MapView>(null);


    // Assign a color to each route: prefer GTFS color, else fallback
    const ROUTE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'];
    // Always assign a unique color from the palette based on route_id hash for visual distinction
    function getColorForRoute(route: any, idx: number): string {
        // Use index if available for stable color assignment in map order
        if (typeof idx === 'number') {
            return ROUTE_COLORS[idx % ROUTE_COLORS.length];
        }
        // Fallback to hash if idx is not provided
        let hash = 0;
        for (let i = 0; i < route.route_id.length; i++) {
            hash = route.route_id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIdx = Math.abs(hash) % ROUTE_COLORS.length;
        return ROUTE_COLORS[colorIdx];
    }

    useEffect(() => {
        if (routes.length > 0 && routes[0].stops && routes[0].stops.length > 0) {
            const firstStop = routes[0].stops[0];
            setMapRegion({ latitude: firstStop.latitude, longitude: firstStop.longitude });
        }
        setLoading(false);
    }, [routes]);

    // Handle stop selection for origin/destination
    const handleStopPress = (stop: RouteStop) => {
        if (!selectedOrigin) {
            setSelectedOrigin(stop);
        } else if (!selectedDestination) {
            setSelectedDestination(stop);
        } else {
            setSelectedOrigin(stop);
            setSelectedDestination(null);
            setFareInfo(null);
        }
        onStopPress?.(stop.stop_id);
    };

    // Calculate fare when both origin and destination are selected
    useEffect(() => {
        const fetchFare = async () => {
            if (selectedOrigin && selectedDestination) {
                try {
                    const info = await api.getFare(selectedOrigin.stop_id, selectedDestination.stop_id);
                    setFareInfo(info);
                } catch (e) {
                    Alert.alert('Error', 'Failed to calculate fare.');
                }
            }
        };
        fetchFare();
    }, [selectedOrigin, selectedDestination]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading map data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={mapRegion ? {
                    latitude: mapRegion.latitude,
                    longitude: mapRegion.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                } : undefined}
                showsUserLocation={true}
            >
                {/* Render all routes as color-coded polylines (prefer polyline, fallback to stops) */}
                {routes.map((route: Route, idx: number) => (
                    route.polyline && route.polyline.length > 0 ? (
                        <Polyline
                            key={`route-polyline-${route.route_id}`}
                            coordinates={route.polyline}
                            strokeColor={getColorForRoute(route, idx)}
                            strokeWidth={4}
                        />
                    ) : (route.stops && route.stops.length > 1 ? (
                        <Polyline
                            key={`route-polyline-${route.route_id}`}
                            coordinates={route.stops.map((stop: RouteStop) => ({ latitude: stop.latitude, longitude: stop.longitude }))}
                            strokeColor={getColorForRoute(route, idx)}
                            strokeWidth={4}
                        />
                    ) : null)
                ))}
                {/* Render stops for all routes if available */}
                {routes.map((route: Route, ridx: number) => route.stops?.map((stop: RouteStop, sidx: number) => (
                    <Marker
                        key={`stop-${route.route_id}-${stop.stop_id}`}
                        coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                        onPress={() => handleStopPress(stop)}
                    >
                        {/* Use bus icon for stops */}
                        <View style={
                            selectedOrigin?.stop_id === stop.stop_id
                                ? styles.originMarker
                                : selectedDestination?.stop_id === stop.stop_id
                                ? styles.destinationMarker
                                : styles.stopMarker
                        }>
                            {/* Uncomment below to use a bus icon image instead of text: */}
                            <Image source={require('../../assets/bus icon.png')} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
                            <Text style={styles.stopMarkerText}>{stop.stop_name ? stop.stop_name[0] : ''}</Text>
                        </View>
                    </Marker>
                )))}
            </MapView>
            {/* Fare display */}
            <View style={styles.fareContainer}>
                <Text style={styles.fareLabel}>Origin: {selectedOrigin ? selectedOrigin.stop_name : 'Tap a stop'}</Text>
                <Text style={styles.fareLabel}>Destination: {selectedDestination ? selectedDestination.stop_name : 'Tap a stop'}</Text>
                {fareInfo && (
                    <Text style={styles.fareText}>Estimated Fare: ₱{fareInfo.fare.toFixed(2)}</Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    stopMarker: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 6,
        borderWidth: 2,
        borderColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    originMarker: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 6,
        borderWidth: 2,
        borderColor: '#388E3C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    destinationMarker: {
        backgroundColor: '#F44336',
        borderRadius: 12,
        padding: 6,
        borderWidth: 2,
        borderColor: '#B71C1C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stopMarkerText: {
        color: '#333',
        fontWeight: 'bold',
    },
    fareContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        alignItems: 'center',
    },
    fareLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    fareText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
        marginTop: 8,
    },
});

export default RouteMap;