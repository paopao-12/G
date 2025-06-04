import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import api, { Route, Stop, FareInfo, RouteFilter, calculateDistance } from '../services/api';
import { RootStackParamList } from '../types/navigation';
import { RouteSuggestion, LocationOption, PassengerType } from '../types';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [originStop, setOriginStop] = useState<number | null>(null);
  const [destinationStop, setDestinationStop] = useState<number | null>(null);
  const [passengerType, setPassengerType] = useState<PassengerType>('regular');
  const [fareInfo, setFareInfo] = useState<FareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [filters, setFilters] = useState<RouteFilter>({
    trafficAware: true,
    timeOfDay: true,
    accessibility: false,
    maxDistance: 500, // meters
  });
  const [nearestStops, setNearestStops] = useState<Stop[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [walkingDirections, setWalkingDirections] = useState<any[]>([]);
  const mapRef = useRef<MapView>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    loadData();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location);
        
        // Find nearest stops
        const nearest = await api.findNearestStops({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }, 500); // 500 meters radius
        
        setNearestStops(nearest.map(ns => ns.stop));
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to find nearby jeepney stops.'
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!userLocation) {
      await requestLocationPermission();
      return;
    }

    if (nearestStops.length > 0) {
      setOriginStop(nearestStops[0].id);
      setSelectedStop(nearestStops[0]);
      Alert.alert(
        'Nearest Stop Selected',
        `Selected ${nearestStops[0].name} as your origin stop.`,
        [
          {
            text: 'Show on Map',
            onPress: () => setShowMap(true),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert(
        'No Nearby Stops',
        'No jeepney stops found within 500 meters of your location.'
      );
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user location first
      if (userLocation) {
        const { latitude, longitude } = userLocation.coords;
        const routesResponse = await api.getRoutes(latitude, longitude);
        setRoutes(routesResponse);
      } else {
        // If no location available, get all routes
        const routesResponse = await api.getRoutes();
        setRoutes(routesResponse);
      }

      // Get all stops for the dropdowns
      const stopsResponse = await api.getStops();
      setStops(stopsResponse);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load routes and stops');
    } finally {
      setLoading(false);
    }
  };

  // Update loadData when user location changes
  useEffect(() => {
    if (userLocation) {
      loadData();
    }
  }, [userLocation]);

  const handleCalculateFare = async () => {
    if (!originStop || !destinationStop) {
      Alert.alert('Error', 'Please select both origin and destination stops');
      return;
    }

    try {
      setCalculating(true);
      
      // Get user's current location if available
      const currentLocation = userLocation ? {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        timestamp: userLocation.timestamp
      } : null;

      // Get route suggestions with filters
      const suggestions = await api.getRouteSuggestions(
        currentLocation || { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 0 },
        filters
      );

      if (suggestions.length === 0) {
        Alert.alert('No Routes', 'No routes found matching your criteria');
        return;
      }

      // Convert suggestions to the expected format
      const formattedSuggestions = suggestions.map(suggestion => ({
        id: `${suggestion.route.id}-${suggestion.originStop.stop_id}-${suggestion.destinationStop.stop_id}`,
        route: suggestion.route,
        originStop: suggestion.originStop,
        destinationStop: suggestion.destinationStop,
        estimatedFare: suggestion.estimatedFare,
        distance: suggestion.distance,
        duration: suggestion.duration,
        accessibilityScore: suggestion.accessibilityScore,
        trafficLevel: suggestion.trafficLevel,
        from: {
          id: suggestion.originStop.stop_id.toString(),
          name: suggestion.originStop.stop_name,
          latitude: suggestion.originStop.latitude,
          longitude: suggestion.originStop.longitude,
        },
        to: {
          id: suggestion.destinationStop.stop_id.toString(),
          name: suggestion.destinationStop.stop_name,
          latitude: suggestion.destinationStop.latitude,
          longitude: suggestion.destinationStop.longitude,
        },
        estimatedTime: suggestion.duration,
        type: 'jeepney' as const,
        stops: suggestion.route.stops.map(stop => ({
          id: stop.stop_id.toString(),
          name: stop.stop_name,
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
        routeName: suggestion.route.name,
      }));

      // Navigate to Results screen
      navigation.navigate('Results', {
        origin: stops.find(s => s.id === originStop)?.name || '',
        destination: stops.find(s => s.id === destinationStop)?.name || '',
        passengerType,
        suggestedRoutes: formattedSuggestions,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate route');
      console.error(error);
    } finally {
      setCalculating(false);
    }
  };

  const getDiscountedFare = (fare: number, type: PassengerType) => {
    switch (type) {
      case 'student':
        return fare * 0.8; // 20% discount
      case 'senior':
      case 'pwd':
        return fare * 0.5; // 50% discount
      default:
        return fare;
    }
  };

  const toggleFilter = (key: keyof RouteFilter) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getWalkingDirections = async (destination: Stop) => {
    if (!userLocation) return;

    try {
      // Calculate a simple straight-line path for walking directions
      const points = [];
      const steps = 50; // Number of points to generate
      
      for (let i = 0; i <= steps; i++) {
        const fraction = i / steps;
        points.push({
          latitude: userLocation.coords.latitude + (destination.latitude - userLocation.coords.latitude) * fraction,
          longitude: userLocation.coords.longitude + (destination.longitude - userLocation.coords.longitude) * fraction,
        });
      }
      
      setWalkingDirections(points);
    } catch (error) {
      console.error('Error calculating walking directions:', error);
    }
  };

  const MapModal = () => (
    <Modal
      visible={showMap}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowMap(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.mapHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowMap(false)}
          >
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.mapTitle}>Nearby Stops</Text>
        </View>
        
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: userLocation?.coords.latitude || 0,
            longitude: userLocation?.coords.longitude || 0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.coords.latitude,
                longitude: userLocation.coords.longitude,
              }}
              title="Your Location"
              pinColor="blue"
            />
          )}

          {/* Nearby Stops Markers */}
          {nearestStops.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={stop.name}
              description={`Distance: ${Math.round(
                calculateDistance(
                  userLocation?.coords.latitude || 0,
                  userLocation?.coords.longitude || 0,
                  stop.latitude,
                  stop.longitude
                )
              )}m`}
              onPress={() => {
                setSelectedStop(stop);
                getWalkingDirections(stop);
              }}
            />
          ))}

          {/* Walking Directions Polyline */}
          {walkingDirections.length > 0 && (
            <Polyline
              coordinates={walkingDirections}
              strokeWidth={4}
              strokeColor="#007AFF"
              lineDashPattern={[1]}
            />
          )}
        </MapView>

        {selectedStop && (
          <View style={styles.stopInfo}>
            <Text style={styles.stopName}>{selectedStop.name}</Text>
            <Text style={styles.stopDistance}>
              {Math.round(
                calculateDistance(
                  userLocation?.coords.latitude || 0,
                  userLocation?.coords.longitude || 0,
                  selectedStop.latitude,
                  selectedStop.longitude
                )
              )}m away
            </Text>
            <TouchableOpacity
              style={styles.selectStopButton}
              onPress={() => {
                setOriginStop(selectedStop.id);
                setShowMap(false);
              }}
            >
              <Text style={styles.selectStopButtonText}>Select This Stop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Davao Commuter Guide</Text>
        <Text style={styles.subtitle}>Find your route</Text>
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.sectionTitle}>Smart Filters</Text>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Traffic-Aware Routing</Text>
          <Switch
            value={filters.trafficAware}
            onValueChange={() => toggleFilter('trafficAware')}
          />
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Time-Based Adjustments</Text>
          <Switch
            value={filters.timeOfDay}
            onValueChange={() => toggleFilter('timeOfDay')}
          />
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Accessibility Features</Text>
          <Switch
            value={filters.accessibility}
            onValueChange={() => toggleFilter('accessibility')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Route</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedRoute}
            onValueChange={(value) => {
              setSelectedRoute(value);
              setOriginStop(null);
              setDestinationStop(null);
              setFareInfo(null);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select a route" value={null} />
            {routes.map((route) => (
              <Picker.Item
                key={route.id}
                label={route.name}
                value={route.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Stops</Text>
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Origin Stop</Text>
          <View style={styles.locationButtonContainer}>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleUseCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <>
                  <MaterialIcons name="my-location" size={20} color="#007AFF" />
                  <Text style={styles.locationButtonText}>Use Current Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={originStop}
            onValueChange={setOriginStop}
            style={styles.picker}
            enabled={!!selectedRoute}
          >
            <Picker.Item label="Select origin stop" value={null} />
            {selectedRoute && routes
              .find(r => r.id === selectedRoute)
              ?.stops.map((stop) => (
                <Picker.Item
                  key={stop.stop_id}
                  label={stop.stop_name}
                  value={stop.stop_id}
                />
              ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Destination Stop</Text>
          <Picker
            selectedValue={destinationStop}
            onValueChange={setDestinationStop}
            style={styles.picker}
            enabled={!!selectedRoute}
          >
            <Picker.Item label="Select destination stop" value={null} />
            {selectedRoute && routes
              .find(r => r.id === selectedRoute)
              ?.stops.map((stop) => (
                <Picker.Item
                  key={stop.stop_id}
                  label={stop.stop_name}
                  value={stop.stop_id}
                />
              ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Passenger Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={passengerType}
            onValueChange={(value) => setPassengerType(value as PassengerType)}
            style={styles.picker}
          >
            <Picker.Item label="Regular" value="regular" />
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Senior Citizen" value="senior" />
            <Picker.Item label="PWD" value="pwd" />
          </Picker>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, calculating && styles.buttonDisabled]}
        onPress={handleCalculateFare}
        disabled={calculating}
      >
        {calculating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Find Route</Text>
        )}
      </TouchableOpacity>

      {fareInfo && (
        <View style={styles.fareInfo}>
          <Text style={styles.fareTitle}>Fare Information</Text>
          <Text style={styles.fareText}>Route: {fareInfo.route_name}</Text>
          <Text style={styles.fareText}>Distance: {fareInfo.distance_km.toFixed(2)} km</Text>
          <Text style={styles.fareText}>
            Base Fare: ₱{fareInfo.fare.toFixed(2)}
          </Text>
          <Text style={styles.fareText}>
            Discounted Fare: ₱{getDiscountedFare(fareInfo.fare, passengerType).toFixed(2)}
          </Text>
        </View>
      )}
      <MapModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  section: {
    padding: 15,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  filtersContainer: {
    padding: 15,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fareInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fareTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  fareText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  picker: {
    height: 50,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  locationButtonContainer: {
    marginBottom: 10,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  locationButtonText: {
    color: '#007AFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    marginRight: 16,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 200,
  },
  stopInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  stopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stopDistance: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  selectStopButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectStopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 