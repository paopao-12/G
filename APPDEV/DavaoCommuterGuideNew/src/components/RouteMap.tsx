import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout, Region } from 'react-native-maps';
import api, { Route, JeepneyLocation, MapRegion, TrafficData } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

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
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        initializeMap();
    }, [route.id]);

    const initializeMap = async () => {
        try {
            setLoading(true);
            // Get initial map region
            const region = api.getRouteMapRegion(route);
            setMapRegion(region);

            // Get initial jeepney locations
            if (showJeepneyLocations) {
                await loadJeepneyLocations();
            }

            // Get traffic data
            if (showTraffic) {
                await loadTrafficData();
            }

            // Subscribe to real-time updates
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

    const updateStopInfo = (locations: JeepneyLocation[]) => {
        // Update stop information based on jeepney locations
        const stopInfo: { [key: string]: StopInfo } = {};
        
        route.stops.forEach(stop => {
            stopInfo[stop.stop_id.toString()] = {
                name: stop.stop_name,
                passengerCount: 0,
            };
        });

        locations.forEach(jeepney => {
            if (jeepney.currentStop) {
                const stopId = jeepney.currentStop.stop_id.toString();
                if (stopInfo[stopId]) {
                    stopInfo[stopId].passengerCount = (stopInfo[stopId].passengerCount || 0) + 1;
                }
            }
            if (jeepney.nextStop && jeepney.estimatedArrival) {
                const stopId = jeepney.nextStop.stop_id.toString();
                if (stopInfo[stopId]) {
                    stopInfo[stopId].nextJeepneyArrival = jeepney.estimatedArrival;
                }
            }
        });

        if (selectedStop) {
            const updatedStop = stopInfo[selectedStop.name];
            if (updatedStop) {
                setSelectedStop(updatedStop);
            }
        }
    };

    const getJeepneyIcon = (status: JeepneyLocation['status']) => {
        switch (status) {
            case 'active':
                return '🚐';
            case 'inactive':
                return '⛔';
            case 'maintenance':
                return '🔧';
            default:
                return '🚐';
        }
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

                {/* Stops */}
                {route.stops.map((stop, index) => (
                    <Marker
                        key={stop.stop_id}
                        coordinate={{
                            latitude: stop.latitude,
                            longitude: stop.longitude,
                        }}
                        onPress={() => {
                            const stopInfo = {
                                name: stop.stop_name,
                                nextJeepneyArrival: undefined,
                                passengerCount: 0,
                            };
                            setSelectedStop(stopInfo);
                            onStopPress?.(stop.stop_id);
                        }}
                    >
                        <View style={styles.stopMarker}>
                            <Text style={styles.stopNumber}>{index + 1}</Text>
                        </View>
                        <Callout>
                            <View style={styles.calloutContainer}>
                                <Text style={styles.calloutTitle}>{stop.stop_name}</Text>
                                {selectedStop?.nextJeepneyArrival && (
                                    <Text style={styles.calloutText}>
                                        Next jeepney: {selectedStop.nextJeepneyArrival.toLocaleTimeString()}
                                    </Text>
                                )}
                                {selectedStop?.passengerCount !== undefined && (
                                    <Text style={styles.calloutText}>
                                        Waiting passengers: {selectedStop.passengerCount}
                                    </Text>
                                )}
                            </View>
                        </Callout>
                    </Marker>
                ))}

                {/* Jeepney locations */}
                {showJeepneyLocations && jeepneyLocations.map(jeepney => (
                    <Marker
                        key={jeepney.id}
                        coordinate={{
                            latitude: jeepney.latitude,
                            longitude: jeepney.longitude,
                        }}
                        rotation={jeepney.heading}
                    >
                        <View style={styles.jeepneyMarker}>
                            <Text style={styles.jeepneyIcon}>
                                {getJeepneyIcon(jeepney.status)}
                            </Text>
                        </View>
                        <Callout>
                            <View style={styles.calloutContainer}>
                                <Text style={styles.calloutTitle}>Jeepney {jeepney.id}</Text>
                                <Text style={styles.calloutText}>Status: {jeepney.status}</Text>
                                {jeepney.nextStop && (
                                    <Text style={styles.calloutText}>
                                        Next stop: {jeepney.nextStop.stop_name}
                                    </Text>
                                )}
                                {jeepney.estimatedArrival && (
                                    <Text style={styles.calloutText}>
                                        ETA: {jeepney.estimatedArrival.toLocaleTimeString()}
                                    </Text>
                                )}
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            {/* Control buttons */}
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
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    stopMarker: {
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#000',
    },
    stopNumber: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    jeepneyMarker: {
        backgroundColor: 'transparent',
    },
    jeepneyIcon: {
        fontSize: 24,
    },
    controlsContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    controlButton: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    calloutContainer: {
        padding: 10,
        minWidth: 150,
    },
    calloutTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    calloutText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 3,
    },
    legendContainer: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    legendColor: {
        width: 20,
        height: 20,
        marginRight: 5,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
});

export default RouteMap; 