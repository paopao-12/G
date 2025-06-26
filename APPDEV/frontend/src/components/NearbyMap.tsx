import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Alert } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import Geolocation from '@react-native-community/geolocation';
import api, { Route, Stop, FareInfo } from '../services/api';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BUS_STOPS } from '../busStops';

interface NearbyMapProps {
    onStopSelect?: (stop: Stop) => void;
    onRouteSelect?: (route: Route) => void;
}

const ROUTE_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

const NearbyMap: React.FC<NearbyMapProps> = ({ onStopSelect, onRouteSelect }) => {
    // Use [number, number] for [longitude, latitude]
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
    const [nearbyRoutes, setNearbyRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRoutePanel, setShowRoutePanel] = useState(false);
    const [selectedRoutes, setSelectedRoutes] = useState<number[]>([]);
    const [routeColors, setRouteColors] = useState<{[key: number]: string}>({});
    const mapRef = useRef<MapboxGL.MapView>(null);
    const [cameraCenter, setCameraCenter] = useState<[number, number] | null>(null);
    const [selectedOrigin, setSelectedOrigin] = useState<Stop | null>(null);
    const [selectedDestination, setSelectedDestination] = useState<Stop | null>(null);
    const [fareInfo, setFareInfo] = useState<FareInfo | null>(null);

    useEffect(() => {
        setLoading(true);
        Geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                setUserLocation([longitude, latitude]);
                Promise.all([
                    api.getNearbyStops(latitude, longitude),
                    api.getRoutes(latitude, longitude)
                ]).then(([stops, routes]) => {
                    setNearbyStops(stops);
                    setNearbyRoutes(routes);
                    const colors: {[key: number]: string} = {};
                    routes.forEach((route, index) => {
                        colors[route.id] = ROUTE_COLORS[index % ROUTE_COLORS.length];
                    });
                    setRouteColors(colors);
                    setSelectedRoutes(routes.map(route => route.id));
                }).catch(err => {
                    console.error('Error loading data:', err);
                    setError('Error loading data. Please try again.');
                }).finally(() => setLoading(false));
            },
            error => {
                setError('Location permission denied or unavailable');
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
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
        if (route.stops.length > 0) {
            setCameraCenter([route.stops[0].longitude, route.stops[0].latitude]);
        }
    };

    // Handle stop selection for origin/destination
    const handleStopPress = (stop: Stop) => {
        if (!selectedOrigin) {
            setSelectedOrigin(stop);
        } else if (!selectedDestination) {
            setSelectedDestination(stop);
        } else {
            setSelectedOrigin(stop);
            setSelectedDestination(null);
            setFareInfo(null);
        }
        onStopSelect?.(stop);
    };

    // Calculate fare when both origin and destination are selected
    useEffect(() => {
        const fetchFare = async () => {
            if (selectedOrigin && selectedDestination) {
                try {
                    const info = await api.getFare(selectedOrigin.id, selectedDestination.id);
                    setFareInfo(info);
                } catch (e) {
                    // Optionally handle or log the error, or remove the catch if not needed
                    Alert.alert('Error', 'Failed to calculate fare.');
                }
            }
        };
        fetchFare();
    }, [selectedOrigin, selectedDestination]);

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
            <MapboxGL.MapView
                ref={mapRef}
                style={styles.map}
                styleURL={MapboxGL.StyleURL.Street}
            >
                {(cameraCenter || userLocation) && (
                    <MapboxGL.Camera
                        centerCoordinate={cameraCenter || userLocation}
                        zoomLevel={13}
                    />
                )}
                {/* User location marker */}
                {userLocation && (
                    <MapboxGL.PointAnnotation
                        id="user-location"
                        coordinate={userLocation}
                    >
                        <View style={{backgroundColor:'#007AFF',borderRadius:10,padding:4}}>
                            <MaterialIcons name="person-pin-circle" size={24} color="#fff" />
                        </View>
                    </MapboxGL.PointAnnotation>
                )}
                {/* Nearby stops markers (selectable) */}
                {nearbyStops.map((stop) => {
                    let markerStyle = styles.callout;
                    if (selectedOrigin && selectedOrigin.id === stop.id) {
                        markerStyle = { ...styles.callout, ...styles.originMarker };
                    } else if (selectedDestination && selectedDestination.id === stop.id) {
                        markerStyle = { ...styles.callout, ...styles.destinationMarker };
                    }
                    return (
                        <MapboxGL.PointAnnotation
                            key={`stop-${stop.id}`}
                            id={`stop-${stop.id}`}
                            coordinate={[stop.longitude, stop.latitude]}
                            onSelected={() => handleStopPress(stop)}
                        >
                            <View style={markerStyle}>
                                <Text style={styles.calloutTitle}>{stop.name}</Text>
                                <Text style={styles.calloutText}>
                                    Distance: {(stop.distance ?? 0).toFixed(1)} km
                                </Text>
                            </View>
                        </MapboxGL.PointAnnotation>
                    );
                })}
                {/* All Davao bus stops markers (from BUS_STOPS) */}
                {BUS_STOPS.map((stop, idx) => (
                    <MapboxGL.PointAnnotation
                        key={`busstop-${idx}`}
                        id={`busstop-${idx}`}
                        coordinate={[stop.longitude, stop.latitude]}
                    >
                        <View style={{backgroundColor:'#0a662e',borderRadius:8,padding:4}}>
                            <Text style={{color:'#fff',fontWeight:'bold',fontSize:10}}>{stop.name}</Text>
                        </View>
                    </MapboxGL.PointAnnotation>
                ))}
                {/* Route polylines */}
                {nearbyRoutes
                    .filter(route => selectedRoutes.includes(route.id))
                    .map((route) => (
                        <MapboxGL.ShapeSource
                            id={`route-shape-${route.id}`}
                            key={`route-shape-${route.id}`}
                            shape={{
                                type: 'Feature',
                                geometry: {
                                    type: 'LineString',
                                    coordinates: route.stops.map((stop) => [stop.longitude, stop.latitude]),
                                },
                            } as any}
                        >
                            <MapboxGL.LineLayer
                                id={`route-line-${route.id}`}
                                style={{
                                    lineColor: routeColors[route.id] || '#FF6B6B',
                                    lineWidth: 4,
                                }}
                            />
                        </MapboxGL.ShapeSource>
                    ))}
            </MapboxGL.MapView>
            {/* Fare display */}
            <View style={styles.fareContainer}>
                <Text style={styles.fareLabel}>Origin: {selectedOrigin ? selectedOrigin.name : 'Tap a stop'}</Text>
                <Text style={styles.fareLabel}>Destination: {selectedDestination ? selectedDestination.name : 'Tap a stop'}</Text>
                {fareInfo && (
                    <Text style={styles.fareText}>Estimated Fare: ₱{fareInfo.fare.toFixed(2)}</Text>
                )}
            </View>

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
    originMarker: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 6,
        borderWidth: 2,
        borderColor: '#388E3C',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 200,
    },
    destinationMarker: {
        backgroundColor: '#F44336',
        borderRadius: 12,
        padding: 6,
        borderWidth: 2,
        borderColor: '#B71C1C',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 200,
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

export default NearbyMap;