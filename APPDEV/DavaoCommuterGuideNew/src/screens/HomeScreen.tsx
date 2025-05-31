import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LOCATIONS, ROUTES } from '../utils/mockData';
import { PassengerType, LocationOption, RouteSuggestion } from '../types';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { calculateFare } from '../utils/fareCalculator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen = () => {
  const [origin, setOrigin] = useState<string>('current');
  const [destination, setDestination] = useState<string>('sm_lanang');
  const [passengerType, setPassengerType] = useState<PassengerType>('regular');
  const [suggestedRoutes, setSuggestedRoutes] = useState<RouteSuggestion[] | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectionMode, setSelectionMode] = useState<'origin' | 'destination' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [routePreview, setRoutePreview] = useState<{ coordinates: { latitude: number; longitude: number }[] } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature');
        return;
      }
    })();
  }, []);

  const handleMapPress = (e: any) => {
    if (!selectionMode) return;
    
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (selectionMode === 'origin') {
      setSelectedOrigin({ latitude, longitude });
      setSelectionMode(null);
    } else {
      setSelectedDestination({ latitude, longitude });
      setSelectionMode(null);
    }
    updateRoutePreview();
  };

  const handleSearchInput = (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      const results = LOCATIONS.filter(loc => 
        loc.name.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleLocationSelect = async (location: LocationOption) => {
    if (selectionMode === 'origin') {
      if (location.id === 'current') {
        await getCurrentLocation();
      } else {
        setSelectedOrigin({ latitude: location.latitude, longitude: location.longitude });
        updateRoutePreview();
      }
    } else {
      setSelectedDestination({ latitude: location.latitude, longitude: location.longitude });
      updateRoutePreview();
    }
    setSearchQuery('');
    setSearchResults([]);
    setSelectionMode(null);
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setSelectedOrigin({ latitude, longitude });
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      updateRoutePreview();
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRoutePreview = () => {
    if (selectedOrigin && selectedDestination) {
      // Mock route coordinates (in a real app, you'd get this from a routing service)
      const coordinates = [
        selectedOrigin,
        {
          latitude: (selectedOrigin.latitude + selectedDestination.latitude) / 2,
          longitude: (selectedOrigin.longitude + selectedDestination.longitude) / 2,
        },
        selectedDestination
      ];
      setRoutePreview({ coordinates });

      // Calculate distance (in a real app, you'd use a proper distance calculation)
      const R = 6371; // Earth's radius in km
      const dLat = (selectedDestination.latitude - selectedOrigin.latitude) * Math.PI / 180;
      const dLon = (selectedDestination.longitude - selectedOrigin.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(selectedOrigin.latitude * Math.PI / 180) * Math.cos(selectedDestination.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      setDistance(distance);

      // Estimate time (assuming average speed of 30 km/h)
      const timeInHours = distance / 30;
      setEstimatedTime(timeInHours * 60); // Convert to minutes
    }
  };

  const handleSearch = () => {
    if (!selectedOrigin || !selectedDestination) {
      Alert.alert('Error', 'Please select both origin and destination points on the map');
      return;
    }

    // Find all routes where both origin and destination are in stops (in order)
    const foundRoutes = ROUTES.map((route) => {
      const stopIds = route.stops.map(stop => stop.id);
      const originStopIndex = stopIds.indexOf(origin);
      const destinationStopIndex = stopIds.indexOf(destination);
      if (originStopIndex !== -1 && destinationStopIndex !== -1 && originStopIndex < destinationStopIndex) {
        // Calculate segment distance (sum of distances between stops)
        let segmentDistance = 0;
        for (let i = originStopIndex; i < destinationStopIndex; i++) {
          const from = route.stops[i];
          const to = route.stops[i + 1];
          const R = 6371;
          const dLat = (to.latitude - from.latitude) * Math.PI / 180;
          const dLon = (to.longitude - from.longitude) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(from.latitude * Math.PI / 180) * Math.cos(to.latitude * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          segmentDistance += R * c;
        }
        // Estimate time (assuming 30 km/h)
        const estimatedTime = (segmentDistance / 30) * 60;
        // Calculate fare
        const fareInfo = calculateFare(segmentDistance, passengerType);
        return {
          ...route,
          distance: segmentDistance,
          estimatedTime,
          fare: fareInfo.totalFare,
        };
      }
      return null;
    }).filter((r): r is RouteSuggestion => r !== null);

    navigation.navigate('Results', {
      origin,
      destination,
      passengerType,
      suggestedRoutes: foundRoutes,
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with logo and search bar */}
      <View style={styles.headerRow}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>G!</Text>
        </View>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search locations..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearchInput}
          />
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  style={styles.searchResultItem}
                  onPress={() => handleLocationSelect(result)}
                >
                  <Text style={styles.searchResultText}>{result.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.menuBox}>
          <Text style={styles.menuIcon}>≡</Text>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 7.1907,  // Davao City coordinates
            longitude: 125.4553,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          onPress={handleMapPress}
        >
          {selectedOrigin && (
            <Marker
              coordinate={selectedOrigin}
              title="Origin"
              pinColor="green"
            />
          )}
          {selectedDestination && (
            <Marker
              coordinate={selectedDestination}
              title="Destination"
              pinColor="red"
            />
          )}
          {routePreview && (
            <Polyline
              coordinates={routePreview.coordinates}
              strokeColor="#007AFF"
              strokeWidth={3}
            />
          )}
        </MapView>
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          <MaterialIcons name="my-location" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Distance and Time Info */}
      {(distance !== null || estimatedTime !== null) && (
        <View style={styles.routeInfo}>
          {distance !== null && (
            <View style={styles.infoItem}>
              <MaterialIcons name="straighten" size={20} color="#666" />
              <Text style={styles.infoText}>{distance.toFixed(1)} km</Text>
            </View>
          )}
          {estimatedTime !== null && (
            <View style={styles.infoItem}>
              <MaterialIcons name="access-time" size={20} color="#666" />
              <Text style={styles.infoText}>{Math.round(estimatedTime)} mins</Text>
            </View>
          )}
        </View>
      )}

      {/* Point Selection Buttons */}
      <View style={styles.selectionButtons}>
        <TouchableOpacity
          style={[
            styles.selectionButton,
            selectionMode === 'origin' && styles.activeSelectionButton
          ]}
          onPress={() => setSelectionMode('origin')}
        >
          <Text style={[
            styles.selectionButtonText,
            selectionMode === 'origin' && styles.activeSelectionButtonText
          ]}>
            {selectedOrigin ? 'Change Origin' : 'Select Origin'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.selectionButton,
            selectionMode === 'destination' && styles.activeSelectionButton
          ]}
          onPress={() => setSelectionMode('destination')}
        >
          <Text style={[
            styles.selectionButtonText,
            selectionMode === 'destination' && styles.activeSelectionButtonText
          ]}>
            {selectedDestination ? 'Change Destination' : 'Select Destination'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input card */}
      <View style={styles.inputCard}>
        <View style={styles.inputCardHandle} />
        <Text style={styles.inputCardTitle}>Asa ta G?</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Passenger Type:</Text>
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
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search Routes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flex: 1,
    marginHorizontal: 10,
    position: 'relative',
  },
  searchBar: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  searchResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultText: {
    fontSize: 16,
    color: '#333',
  },
  menuBox: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
  },
  mapContainer: {
    height: 300,
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#666',
  },
  selectionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  selectionButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 150,
    alignItems: 'center',
  },
  activeSelectionButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  selectionButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  activeSelectionButtonText: {
    color: '#fff',
  },
  inputCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 10,
  },
  inputCardHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  inputCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 