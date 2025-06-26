import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import api, { FareInfo } from '../services/api';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { RootStackParamList } from '../types/navigation';
import { MaterialIcons } from '@expo/vector-icons';

type RouteDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RouteDetails'>;
type RouteDetailsScreenRouteProp = RouteProp<RootStackParamList, 'RouteDetails'>;

// Add a type for stops with index
interface IndexedStop {
  latitude: number;
  longitude: number;
  idx: number;
}

const ROUTE_COLOR = '#007AFF';

const RouteDetailsScreen = () => {
  const [selectedOrigin, setSelectedOrigin] = useState<IndexedStop | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<IndexedStop | null>(null);
  const [fareInfo, setFareInfo] = useState<FareInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const routeParams = useRoute<RouteDetailsScreenRouteProp>().params;
  const navigation = useNavigation<RouteDetailsScreenNavigationProp>();
  const { route } = routeParams;

  // Map stops to coordinates
  const coordinates = route.stops.map(stop => ({
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));

  // Handle stop selection for origin/destination
  const handleStopPress = (stop: { latitude: number; longitude: number }, idx: number) => {
    const indexedStop: IndexedStop = { ...stop, idx };
    if (!selectedOrigin) {
      setSelectedOrigin(indexedStop);
    } else if (!selectedDestination) {
      setSelectedDestination(indexedStop);
    } else {
      setSelectedOrigin(indexedStop);
      setSelectedDestination(null);
      setFareInfo(null);
    }
  };

  // Calculate fare when both origin and destination are selected
  useEffect(() => {
    const fetchFare = async () => {
      if (selectedOrigin && selectedDestination) {
        setLoading(true);
        try {
          // Pass coordinates or index to the API as needed
          const info = await api.getFare(selectedOrigin.idx, selectedDestination.idx);
          setFareInfo(info);
        } catch (e) {
          // Optionally handle or log the error, or remove the catch if not needed
          Alert.alert('Error', 'Failed to calculate fare.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchFare();
  }, [selectedOrigin, selectedDestination]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.routeName}>{route.routeName}</Text>
      </View>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={coordinates.length > 0 ? {
            latitude: coordinates[0].latitude,
            longitude: coordinates[0].longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          } : undefined}
        >
          {/* Stops as selectable markers */}
          {route.stops.map((stop, idx) => (
            <Marker
              key={`stop-${stop.id}`}
              coordinate={{
                latitude: typeof stop.latitude === 'number' ? stop.latitude : 0,
                longitude: typeof stop.longitude === 'number' ? stop.longitude : 0,
              }}
              onPress={() => handleStopPress(stop, idx)}
            >
              <View style={
                selectedOrigin?.idx === idx
                  ? styles.originMarker
                  : selectedDestination?.idx === idx
                  ? styles.destinationMarker
                  : styles.stopMarker
              }>
                <Text style={styles.stopMarkerText}>{idx + 1}</Text>
              </View>
            </Marker>
          ))}
          {/* Route Polyline */}
          <Polyline
            coordinates={route.stops.map(stop => ({
              latitude: typeof stop.latitude === 'number' ? stop.latitude : 0,
              longitude: typeof stop.longitude === 'number' ? stop.longitude : 0,
            }))}
            strokeColor={ROUTE_COLOR}
            strokeWidth={4}
          />
        </MapView>
      </View>
      {/* Fare display */}
      <View style={styles.fareContainer}>
        <Text style={styles.fareLabel}>Origin: {selectedOrigin ? `Stop ${selectedOrigin.idx + 1}` : 'Tap a stop'}</Text>
        <Text style={styles.fareLabel}>Destination: {selectedDestination ? `Stop ${selectedDestination.idx + 1}` : 'Tap a stop'}</Text>
        {loading && <ActivityIndicator size="small" color="#007AFF" />}
        {fareInfo && (
          <Text style={styles.fareText}>Estimated Fare: ₱{fareInfo.fare.toFixed(2)}</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Back to Results</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  routeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
    margin: 16,
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
  button: {
    margin: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RouteDetailsScreen;