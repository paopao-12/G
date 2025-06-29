import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Alert, TextInput } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Image } from 'react-native';
import * as Location from 'expo-location';
import api, { Route, Stop, FareInfo } from '../services/api';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BUS_STOPS } from '../busStops';

interface NearbyMapProps {
    onStopSelect?: (stop: Stop) => void;
    onRouteSelect?: (route: Route) => void;
}


// Generate a large palette of visually distinct colors
const ROUTE_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
    '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080',
    '#a83232', '#32a852', '#a8a832', '#324fa8', '#a832a8', '#32a8a8', '#a87c32', '#7ca832', '#327ca8', '#7c32a8',
    '#a8327c', '#32a87c', '#7ca87c', '#a87c7c', '#7c7ca8', '#a87ca8', '#7ca87c', '#a8a87c', '#7ca8a8', '#a8a8a8'
];

// Assign a color to each route: prefer GTFS color, else fallback to generated color
function getColorForRoute(route: any, index: number): string {
    // Use GTFS color if available and valid
    if (route.route_color && /^([0-9a-fA-F]{6})$/.test(route.route_color)) {
        return `#${route.route_color.toLowerCase()}`;
    }
    // Fallback: use hash of route_id
    let hash = 0;
    for (let i = 0; i < route.route_id.length; i++) {
        hash = route.route_id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIdx = Math.abs(hash) % ROUTE_COLORS.length;
    return ROUTE_COLORS[colorIdx];
}

const NearbyMap: React.FC<NearbyMapProps> = ({ onStopSelect, onRouteSelect }) => {
    // Use [number, number] for [longitude, latitude]
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
    const [nearbyRoutes, setNearbyRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRoutePanel, setShowRoutePanel] = useState(false);
    const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
    const [routeColors, setRouteColors] = useState<{[key: string]: string}>({});
    const mapRef = useRef<MapView>(null);
    const [cameraCenter, setCameraCenter] = useState<[number, number] | null>(null);
    const [selectedOrigin, setSelectedOrigin] = useState<Stop | null>(null);
    const [selectedDestination, setSelectedDestination] = useState<Stop | null>(null);
    const [fareInfo, setFareInfo] = useState<FareInfo | null>(null);
    const [destinationSearchText, setDestinationSearchText] = useState('');
    const [filteredStops, setFilteredStops] = useState<typeof BUS_STOPS>([]);
    const [showDestinationModal, setShowDestinationModal] = useState(false);
    const [modalStop, setModalStop] = useState<typeof BUS_STOPS[0] | null>(null);
    
    useEffect(() => {
        if (destinationSearchText.trim().length === 0) {
            setFilteredStops([]);
        } else {
            setFilteredStops(
                BUS_STOPS.filter(stop =>
                    stop.name.toLowerCase().includes(destinationSearchText.toLowerCase())
                )
            );
        }
    }, [destinationSearchText]);

    useEffect(() => {
        setLoading(true);
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Location permission denied or unavailable');
                setLoading(false);
                return;
            }
            let position = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = position.coords;
            setUserLocation([longitude, latitude]);
            try {
                // Only fetch routes, stops are now empty (GTFS-based)
                const routes = await api.getRoutes();
                setNearbyStops([]); // No stops, only polylines
                setNearbyRoutes(routes);
                // Assign color to each route: GTFS color if available, else fallback by index
                const colors: { [key: string]: string } = {};
                routes.forEach((route, index) => {
                    colors[route.route_id] = getColorForRoute(route, index);
                });
                setRouteColors(colors);
                setSelectedRoutes(routes.map(route => route.route_id));
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Error loading data. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleRoute = (routeId: string) => {
        setSelectedRoutes(prev =>
            prev.includes(routeId)
                ? prev.filter(id => id !== routeId)
                : [...prev, routeId]
        );
    };

    const selectAllRoutes = () => {
        setSelectedRoutes(nearbyRoutes.map(route => route.route_id));
    };

    const deselectAllRoutes = () => {
        setSelectedRoutes([]);
    };

    const focusOnRoute = (route: Route) => {
        if (route.polyline && route.polyline.length > 0) {
            setCameraCenter([route.polyline[0].longitude, route.polyline[0].latitude]);
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

    // Handle static stop selection from search
    const handleStaticStopSelect = (stop: typeof BUS_STOPS[0]) => {
        setModalStop(stop);
        setShowDestinationModal(true);
    };

    // Calculate fare and suggest routes when both origin and destination are selected
    useEffect(() => {
        const fetchSuggestionsAndFare = async () => {
            if (selectedOrigin && selectedDestination) {
                try {
                    // Suggest routes whose polyline passes near the destination
                    const thresholdMeters = 100; // Suggest if within 100m of polyline
                    const toRad = (deg: number) => deg * Math.PI / 180;
                    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                        const R = 6371000;
                        const dLat = toRad(lat2 - lat1);
                        const dLon = toRad(lon2 - lon1);
                        const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
                        return 2 * R * Math.asin(Math.sqrt(a));
                    };
                    const isNearPolyline = (polyline: {latitude:number,longitude:number}[], lat: number, lon: number) => {
                        return polyline.some(point => haversine(point.latitude, point.longitude, lat, lon) < thresholdMeters);
                    };
                    const suggested = nearbyRoutes.filter(route =>
                        isNearPolyline(route.polyline, selectedDestination.latitude, selectedDestination.longitude)
                    );
                    setSelectedRoutes(suggested.map(r => r.route_id));
                    // Calculate fare (if needed)
                    const info = await api.getFare(selectedOrigin.id, selectedDestination.id);
                    setFareInfo(info);
                } catch (e) {
                    Alert.alert('Error', 'Failed to calculate fare or suggest routes.');
                }
            }
        };
        fetchSuggestionsAndFare();
    }, [selectedOrigin, selectedDestination, nearbyRoutes]);

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
            {/* Destination Search Bar */}
            <View style={styles.destinationSearchBar}>
                <TextInput
                    style={styles.destinationSearchInput}
                    placeholder="Search destination stop..."
                    value={destinationSearchText}
                    onChangeText={setDestinationSearchText}
                />
                {destinationSearchText.length > 0 && filteredStops.length > 0 && (
                    <View style={styles.destinationDropdown}>
                        {filteredStops.map((stop, idx) => (
                            <TouchableOpacity
                                key={`searchstop-${idx}`}
                                style={styles.destinationDropdownItem}
                                onPress={() => handleStaticStopSelect(stop)}
                            >
                                <Text style={styles.destinationDropdownText}>{stop.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
            {/* Destination Details Modal */}
            <Modal
                visible={showDestinationModal && !!modalStop}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDestinationModal(false)}
            >
                <View style={styles.destinationModalOverlay}>
                    <View style={styles.destinationModalContent}>
                        {modalStop && (
                            <>
                                <Text style={styles.destinationModalTitle}>{modalStop.name}</Text>
                                <Text style={styles.destinationModalCoords}>
                                    Lat: {modalStop.latitude.toFixed(6)}{"\n"}Lng: {modalStop.longitude.toFixed(6)}
                                </Text>
                                <TouchableOpacity
                                    style={styles.destinationModalButton}
                                    onPress={() => {
                                        setSelectedDestination({
                                            id: -1,
                                            name: modalStop.name,
                                            latitude: modalStop.latitude,
                                            longitude: modalStop.longitude
                                        });
                                        setShowDestinationModal(false);
                                        setDestinationSearchText('');
                                        setModalStop(null);
                                    }}
                                >
                                    <Text style={styles.destinationModalButtonText}>Set as Destination</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.destinationModalButton, { backgroundColor: '#ccc', marginTop: 10 }]}
                                    onPress={() => setShowDestinationModal(false)}
                                >
                                    <Text style={[styles.destinationModalButtonText, { color: '#333' }]}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={userLocation ? {
                    latitude: userLocation[1],
                    longitude: userLocation[0],
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                } : undefined}
                showsUserLocation={true}
            >
                {/* All Davao bus stops markers (from BUS_STOPS) with bus icon */}
                {BUS_STOPS.map((stop, idx) => (
                    <Marker
                        key={`busstop-${idx}`}
                        coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                        tracksViewChanges={false}
                    >
                        <Image
                            source={require('../../assets/bus icon.png')}
                            style={{ width: 32, height: 32, resizeMode: 'contain' }}
                        />
                    </Marker>
                ))}
                {/* Route polylines with unique color */}
                {nearbyRoutes
                    .filter(route => selectedRoutes.includes(route.route_id))
                    .map((route, idx) => (
                        <Polyline
                            key={`route-polyline-${route.route_id}`}
                            coordinates={route.polyline}
                            strokeColor={routeColors[route.route_id]}
                            strokeWidth={5}
                            zIndex={2}
                        />
                    ))}
            </MapView>
            {/* Fare display */}
            <View style={styles.fareContainer}>
                <Text style={styles.fareLabel}>Origin: {selectedOrigin ? selectedOrigin.name : 'Tap a stop'}</Text>
                <Text style={styles.fareLabel}>Destination: {selectedDestination ? selectedDestination.name : 'Tap a stop'}</Text>
                {fareInfo && (
                    <Text style={styles.fareText}>Estimated Fare: ₱{fareInfo.fare.toFixed(2)}</Text>
                )}
            </View>

            {/* Route Filter Button - make it more prominent and always visible */}
            <TouchableOpacity
                style={[styles.filterButton, { top: 70, right: 20, backgroundColor: '#007AFF', borderWidth: 2, borderColor: '#fff', zIndex: 20 }]}
                onPress={() => setShowRoutePanel(true)}
                activeOpacity={0.8}
            >
                <MaterialIcons name="filter-list" size={28} color="#fff" />
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
                            {nearbyRoutes.map((route, idx) => (
                                <TouchableOpacity
                                    key={route.route_id}
                                    style={styles.routeItem}
                                    onPress={() => {
                                        toggleRoute(route.route_id);
                                        focusOnRoute(route);
                                    }}
                                >
                                    <View style={styles.routeItemContent}>
                                        <View
                                            style={[
                                                styles.legendColor,
                                                { backgroundColor: routeColors[route.route_id], borderWidth: 1, borderColor: '#ccc' }
                                            ]}
                                        />
                                        <Text style={styles.routeName}>{route.route_long_name}</Text>
                                    </View>
                                    <MaterialIcons
                                        name={selectedRoutes.includes(route.route_id) ? "check-box" : "check-box-outline-blank"}
                                        size={26}
                                        color={selectedRoutes.includes(route.route_id) ? "#007AFF" : "#666"}
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
    destinationSearchBar: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    destinationSearchInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    destinationDropdown: {
        backgroundColor: '#fff',
        borderRadius: 6,
        marginTop: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        maxHeight: 180,
    },
    destinationDropdownItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
    },
    destinationDropdownText: {
        fontSize: 15,
        color: '#333',
    },
    destinationModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    destinationModalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        width: '80%',
        alignItems: 'center',
    },
    destinationModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    destinationModalCoords: {
        fontSize: 14,
        color: '#555',
        marginBottom: 20,
        textAlign: 'center',
    },
    destinationModalButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    destinationModalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
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