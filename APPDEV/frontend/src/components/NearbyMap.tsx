import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import api, { Route, Stop } from '../services/api';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

interface NearbyMapProps {
    onStopSelect?: (stop: Stop) => void;
    onRouteSelect?: (route: Route) => void;
}

const ROUTE_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

const NearbyMap: React.FC<NearbyMapProps> = ({ onStopSelect, onRouteSelect }) => {
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
    const [nearbyRoutes, setNearbyRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRoutePanel, setShowRoutePanel] = useState(false);
    const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
    const [routeColors, setRouteColors] = useState<{[key: number]: string}>({});
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        (async () => {
            try {
                // Request location permission
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Location permission denied');
                    return;
                }

                // Get current location
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                setUserLocation(location);

                // Fetch nearby stops and routes
                const stops = await api.getNearbyStops(
                    location.coords.latitude,
                    location.coords.longitude
                );
                const routes = await api.getRoutes(
                    location.coords.latitude,
                    location.coords.longitude
                );

                setNearbyStops(stops);
                setNearbyRoutes(routes);
                
                // Initialize route colors
                const colors: {[key: number]: string} = {};
                routes.forEach((route, index) => {
                    colors[route.id] = ROUTE_COLORS[index % ROUTE_COLORS.length];
                });
                setRouteColors(colors);
                
                // Select all routes by default
                setSelectedRoutes(routes.map(route => route.id));
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Error loading data. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleRoute = (routeId: number) => {
        setSelectedRoutes(prev => 
            prev.includes(routeId)
                ? prev.filter(id => id !== routeId)
                : [...prev, routeId]
        );
    };

    const selectAllRoutes = () => {
        setSelectedRoutes(nearbyRoutes.map(route => route.id));
    };

    const deselectAllRoutes = () => {
        setSelectedRoutes([]);
    };

    const focusOnRoute = (route: Route) => {
        const coordinates = route.stops.map(stop => ({
            latitude: stop.latitude,
            longitude: stop.longitude,
        }));

        mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading nearby stops and routes...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!userLocation) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="location-off" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>Unable to get your location</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: userLocation?.coords.latitude || 7.0722,
                    longitude: userLocation?.coords.longitude || 125.6131,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
            >
                {/* User location marker */}
                <Marker
                    coordinate={{
                        latitude: userLocation?.coords.latitude || 7.0722,
                        longitude: userLocation?.coords.longitude || 125.6131,
                    }}
                    title="Your Location"
                    pinColor="#007AFF"
                />

                {/* Nearby stops markers */}
                {nearbyStops.map((stop) => (
                    <Marker
                        key={stop.id}
                        coordinate={{
                            latitude: stop.latitude,
                            longitude: stop.longitude,
                        }}
                        title={stop.name}
                        onPress={() => onStopSelect?.(stop)}
                    >
                        <Callout>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{stop.name}</Text>
                                <Text style={styles.calloutText}>
                                    Distance: {(stop.distance || 0).toFixed(1)} km
                                </Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}

                {/* Route polylines */}
                {nearbyRoutes
                    .filter(route => selectedRoutes.includes(route.id))
                    .map((route) => (
                        <Polyline
                            key={route.id}
                            coordinates={route.stops.map((stop) => ({
                                latitude: stop.latitude,
                                longitude: stop.longitude,
                            }))}
                            strokeColor={routeColors[route.id]}
                            strokeWidth={4}
                            onPress={() => onRouteSelect?.(route)}
                        />
                    ))}
            </MapView>

            {/* Route Filter Button */}
            <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowRoutePanel(true)}
            >
                <MaterialIcons name="filter-list" size={24} color="#007AFF" />
            </TouchableOpacity>

            {/* Route Filter Panel */}
            <Modal
                visible={showRoutePanel}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRoutePanel(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.panel}>
                        <View style={styles.panelHeader}>
                            <Text style={styles.panelTitle}>Route Selection</Text>
                            <TouchableOpacity
                                onPress={() => setShowRoutePanel(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.panelActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={selectAllRoutes}
                            >
                                <Text style={styles.actionButtonText}>Select All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={deselectAllRoutes}
                            >
                                <Text style={styles.actionButtonText}>Deselect All</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.routeList}>
                            {nearbyRoutes.map((route) => (
                                <TouchableOpacity
                                    key={route.id}
                                    style={styles.routeItem}
                                    onPress={() => {
                                        toggleRoute(route.id);
                                        focusOnRoute(route);
                                    }}
                                >
                                    <View style={styles.routeItemContent}>
                                        <View
                                            style={[
                                                styles.routeColor,
                                                { backgroundColor: routeColors[route.id] }
                                            ]}
                                        />
                                        <Text style={styles.routeName}>{route.name}</Text>
                                    </View>
                                    <MaterialIcons
                                        name={selectedRoutes.includes(route.id) ? "check-box" : "check-box-outline-blank"}
                                        size={24}
                                        color={selectedRoutes.includes(route.id) ? "#007AFF" : "#666"}
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
                    <Text style={styles.legendText}>Your Location</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.legendText}>Nearby Stops</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#FF6B6B' }]} />
                    <Text style={styles.legendText}>Routes</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
    },
    callout: {
        padding: 10,
        maxWidth: 200,
    },
    calloutTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    calloutText: {
        fontSize: 12,
        color: '#666',
    },
    legend: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: '#333',
    },
    filterButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    panel: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    panelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    panelTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    panelActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    actionButton: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
    },
    actionButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    routeList: {
        maxHeight: '70%',
    },
    routeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    routeItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    routeColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 12,
    },
    routeName: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
});

export default NearbyMap; 