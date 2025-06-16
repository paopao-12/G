import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout, Region } from 'react-native-maps';
import api, { Route, JeepneyLocation, MapRegion, TrafficData } from '../services/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface RouteMapProps {
    route: Route;
    onStopPress?: (stopId: number) => void;
    showJeepneyLocations?: boolean;
    showTraffic?: boolean;
    showAlternativeRoutes?: boolean;
}

interface StopInfo {
    name: string;
    nextJeepneyArrival?: Date;
    passengerCount?: number;
}

const RouteMap: React.FC<RouteMapProps> = ({
    route,
    onStopPress,
    showJeepneyLocations = true,
    showTraffic = true,
    showAlternativeRoutes = true,
}) => {
    const [jeepneyLocations, setJeepneyLocations] = useState<JeepneyLocation[]>([]);
    const [mapRegion, setMapRegion] = useState<Region | null>(null);
    const [selectedStop, setSelectedStop] = useState<StopInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [trafficData, setTrafficData] = useState<TrafficData>({});
    const [walkingDirections, setWalkingDirections] = useState<any[]>([]);
    const [showStreetView, setShowStreetView] = useState(false);
    const [streetViewLocation, setStreetViewLocation] = useState<{lat: number, lng: number} | null>(null);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        initializeMap();
    }, [route.id]);

    const initializeMap = async () => {
        try {
            setLoading(true);
            const region = api.getRouteMapRegion(route);
            setMapRegion(region);

            if (showJeepneyLocations) {
                await loadJeepneyLocations();
            }

            if (showTraffic) {
                await loadTrafficData();
            }

            if (showJeepneyLocations) {
                const unsubscribe = api.subscribeToJeepneyUpdates(
                    route.id,
                    (locations) => {
                        setJeepneyLocations(locations);
                        updateStopInfo(locations);
                    },
                    (error) => {
                        console.error('Error receiving jeepney updates:', error);
                    }
                );

                return () => {
                    unsubscribe();
                };
            }
        } catch (error) {
            console.error('Error initializing map:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadJeepneyLocations = async () => {
        try {
            const locations = await api.getJeepneyLocations(route.id);
            setJeepneyLocations(locations);
            updateStopInfo(locations);
        } catch (error) {
            console.error('Error loading jeepney locations:', error);
        }
    };

    const loadTrafficData = async () => {
        try {
            const data = await api.getTrafficData(route.id);
            setTrafficData(data);
        } catch (error) {
            console.error('Error loading traffic data:', error);
        }
    };

    const getWalkingDirections = async (stop: Stop) => {
        try {
            const directions = await api.getWalkingDirections(
                { latitude: userLocation?.coords.latitude || 0, longitude: userLocation?.coords.longitude || 0 },
                { latitude: stop.latitude, longitude: stop.longitude }
            );
            setWalkingDirections(directions);
        } catch (error) {
            console.error('Error getting walking directions:', error);
        }
    };

    const handleStopPress = (stop: Stop) => {
        setSelectedStop(stop);
        getWalkingDirections(stop);
        onStopPress?.(stop.id);
    };

    const toggleStreetView = (stop: Stop) => {
        setStreetViewLocation({ lat: stop.latitude, lng: stop.longitude });
        setShowStreetView(true);
    };

    const getTrafficColor = (congestion: number) => {
        if (congestion < 0.3) return '#4CAF50'; // Green
        if (congestion < 0.7) return '#FFC107'; // Yellow
        return '#F44336'; // Red
    };

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
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegion || undefined}
                showsUserLocation
                showsMyLocationButton
                showsTraffic={showTraffic}
                showsCompass
                showsScale
                showsBuildings
                showsIndoors
                mapType="standard"
            >
                {/* Route path with traffic data */}
                {route.stops.map((stop, index) => {
                    if (index < route.stops.length - 1) {
                        const nextStop = route.stops[index + 1];
                        const segmentKey = `${stop.stop_id}-${nextStop.stop_id}`;
                        const congestion = trafficData[segmentKey] || 0;

                        return (
                            <Polyline
                                key={segmentKey}
                                coordinates={[
                                    { latitude: stop.latitude, longitude: stop.longitude },
                                    { latitude: nextStop.latitude, longitude: nextStop.longitude },
                                ]}
                                strokeColor={getTrafficColor(congestion)}
                                strokeWidth={5}
                                lineDashPattern={[1]}
                            />
                        );
                    }
                    return null;
                })}

                {/* Walking Directions */}
                {walkingDirections.length > 0 && (
                    <Polyline
                        coordinates={walkingDirections}
                        strokeColor="#007AFF"
                        strokeWidth={3}
                        lineDashPattern={[1]}
                    />
                )}

                {/* Stops with enhanced markers */}
                {route.stops.map((stop, index) => (
                    <Marker
                        key={stop.id}
                        coordinate={{
                            latitude: stop.latitude,
                            longitude: stop.longitude,
                        }}
                        title={stop.name}
                        onPress={() => handleStopPress(stop)}
                    >
                        <Callout>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{stop.name}</Text>
                                <Text style={styles.calloutText}>
                                    Next jeepney: {stop.nextJeepneyTime || 'No data'}
                                </Text>
                                <TouchableOpacity
                                    style={styles.streetViewButton}
                                    onPress={() => toggleStreetView(stop)}
                                >
                                    <Text style={styles.streetViewButtonText}>View Street</Text>
                                </TouchableOpacity>
                            </View>
                        </Callout>
                    </Marker>
                ))}

                {/* Jeepney locations */}
                {showJeepneyLocations && jeepneyLocations.map((jeepney) => (
                    <Marker
                        key={jeepney.id}
                        coordinate={{
                            latitude: jeepney.latitude,
                            longitude: jeepney.longitude,
                        }}
                        title={`Jeepney ${jeepney.id}`}
                        description={`Status: ${jeepney.status}`}
                    >
                        <View style={styles.jeepneyMarker}>
                            <MaterialIcons name="directions-bus" size={24} color="#007AFF" />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Street View Modal */}
            <Modal
                visible={showStreetView}
                animationType="slide"
                onRequestClose={() => setShowStreetView(false)}
            >
                <View style={styles.streetViewContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setShowStreetView(false)}
                    >
                        <MaterialIcons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                    {streetViewLocation && (
                        <MapView
                            style={styles.streetView}
                            provider={PROVIDER_GOOGLE}
                            initialRegion={{
                                latitude: streetViewLocation.lat,
                                longitude: streetViewLocation.lng,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            mapType="streetview"
                        />
                    )}
                </View>
            </Modal>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={loadJeepneyLocations}
                >
                    <Ionicons name="refresh" size={24} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => mapRef.current?.animateToRegion(mapRegion!)}
                >
                    <Ionicons name="locate" size={24} color="#000" />
                </TouchableOpacity>
                {showTraffic && (
                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={loadTrafficData}
                    >
                        <Ionicons name="analytics" size={24} color="#000" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.legendText}>Low Traffic</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#FFC107' }]} />
                    <Text style={styles.legendText}>Medium Traffic</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
                    <Text style={styles.legendText}>High Traffic</Text>
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
    controlsContainer: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    controlButton: {
        padding: 8,
        marginVertical: 4,
    },
    legendContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 8,
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
        width: 20,
        height: 20,
        borderRadius: 4,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    callout: {
        width: 200,
        padding: 10,
    },
    calloutTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    calloutText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    streetViewButton: {
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 4,
        marginTop: 5,
    },
    streetViewButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 12,
    },
    jeepneyMarker: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 4,
        borderWidth: 2,
        borderColor: '#007AFF',
    },
    streetViewContainer: {
        flex: 1,
    },
    streetView: {
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});

export default RouteMap; 