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
  TextInput,
  Image,
  FlatList
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import api, { Route, Stop, FareInfo, RouteFilter, calculateDistance, WalkingDirections } from '../services/api';
import { RootStackParamList } from '../types/navigation';
import { RouteSuggestion, LocationOption, PassengerType } from '../types';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SNAP_POINTS = [0, SCREEN_HEIGHT * 0.45, SCREEN_HEIGHT * 0.9]; // Collapsed, Half-open, Full-open

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface GestureHandlerContext {
  startY: number; // Store the Y position at the start of the gesture
  [key: string]: unknown; // Add index signature to allow for arbitrary properties
}

type SelectionMode = 'none' | 'origin' | 'destination';

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
  const [userLocation, setUserLocation] = useState<{ coords: { latitude: number; longitude: number } } | null>(null);
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
  const [suggestedRoutes, setSuggestedRoutes] = useState<RouteSuggestion[]>([]);
  const [showDestinationPickerModal, setShowDestinationPickerModal] = useState(false);
  const [destinationSearchText, setDestinationSearchText] = useState('');
  const [filteredStops, setFilteredStops] = useState<Stop[]>([]);
  const [showOriginPickerModal, setShowOriginPickerModal] = useState(false);
  const [originSearchText, setOriginSearchText] = useState('');
  const [filteredOriginStops, setFilteredOriginStops] = useState<Stop[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
  const [mapStops, setMapStops] = useState<Stop[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  const translateY = useSharedValue(SNAP_POINTS[1]); // Start half-open

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, GestureHandlerContext>({
    onStart: (event, ctx) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateY.value = ctx.startY + event.translationY;
      // Clamp the value between the collapsed and full-open points
      translateY.value = Math.max(SNAP_POINTS[0], Math.min(SNAP_POINTS[2], translateY.value));
    },
    onEnd: (event) => {
      if (event.velocityY > 500) {
        // Flick down, collapse
        translateY.value = withSpring(SNAP_POINTS[2]);
      } else if (event.velocityY < -500) {
        // Flick up, expand
        translateY.value = withSpring(SNAP_POINTS[0]);
      } else {
        // Snap to nearest snap point
        const dest = SNAP_POINTS.find(p => Math.abs(p - translateY.value) < 100);
        if (dest !== undefined) {
          translateY.value = withSpring(dest);
        } else {
          // If no snap point nearby, default to half-open
          translateY.value = withSpring(SNAP_POINTS[1]);
        }
      }
    },
  });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  useEffect(() => {
    loadData();
    requestLocationPermission();
    setShowMap(false); // Ensure map modal is closed on initial load
    setSelectedStop(null); // Clear any selected stop on initial load
  }, []);

  useEffect(() => {
    // Filter stops based on search text for destination
    if (destinationSearchText) {
      const lowercasedQuery = destinationSearchText.toLowerCase();
      const filtered = stops.filter(stop =>
        stop.name.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredStops(filtered);
    } else {
      setFilteredStops(stops);
    }
  }, [destinationSearchText, stops]);

  useEffect(() => {
    // Filter stops based on search text for origin
    if (originSearchText) {
      const lowercasedQuery = originSearchText.toLowerCase();
      const filtered = stops.filter(stop =>
        stop.name.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredOriginStops(filtered);
    } else {
      setFilteredOriginStops(stops);
    }
  }, [originSearchText, stops]);

  useEffect(() => {
    // Fetch user role from AsyncStorage
    AsyncStorage.getItem('user_role').then(role => {
      setUserRole(role);
    });
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);
      // For Android, request permission manually if needed
      // (React Native CLI does not auto-prompt for location permission)
      // You may want to use react-native-permissions for a production app
      Geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
          // Find nearest stops
          api.findNearestStops({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }, 500).then((nearest) => {
            setNearestStops(nearest.map(ns => ns.stop));
            if (nearest.length > 0) {
              setOriginStop(nearest[0].stop.id);
              setOriginSearchText(nearest[0].stop.name);
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          Alert.alert('Error', 'Failed to get your current location');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // Refactored handleUseCurrentLocation to open OriginPickerModal
  const handleOriginLocationSelection = async () => {
    setShowOriginPickerModal(true);
    setShowMap(false); // Ensure MapModal is closed when opening OriginPickerModal
    // Attempt to find nearest stop on opening the modal for automatic pre-selection
    if (!userLocation) {
      await requestLocationPermission();
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

      // Get all stops for the dropdowns and map
      const stopsResponse = await api.getStops();
      setStops(stopsResponse);
      setMapStops(stopsResponse); // Set stops for map display
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
      
      // Find the selected origin and destination stop objects
      const originStopObj = stops.find(stop => stop.id === originStop);
      const destinationStopObj = stops.find(stop => stop.id === destinationStop);

      if (!originStopObj || !destinationStopObj) {
        Alert.alert('Error', 'Could not find selected origin or destination stop details.');
        setCalculating(false);
        return;
      }

      // Get route suggestions with filters
      const suggestions = await api.getRouteSuggestions(
        { latitude: originStopObj.latitude, longitude: originStopObj.longitude },
        { latitude: destinationStopObj.latitude, longitude: destinationStopObj.longitude },
        filters
      );

      // Handle new backend response types
      if (suggestions.length === 1 && suggestions[0].type === 'walk') {
        Alert.alert('Walking Only', suggestions[0].message);
        setSuggestedRoutes([]);
        setCalculating(false);
        return;
      } else if (suggestions.length === 1 && suggestions[0].type === 'none') {
        Alert.alert('No Routes', suggestions[0].message);
        setSuggestedRoutes([]);
        setCalculating(false);
        return;
      } else if (suggestions.length === 1 && suggestions[0].type === 'direct') {
        // Format direct route for UI
        const s = suggestions[0];
        setSuggestedRoutes([
          {
            id: `${s.route_id}-${s.origin_stop.stop_id}-${s.destination_stop.stop_id}`,
            route: { id: s.route_id, name: s.route_id, stops: [], path: [] }, // You can fetch more route details if needed
            originStop: s.origin_stop,
            destinationStop: s.destination_stop,
            estimatedFare: 0,
            distance: 0,
            duration: 0,
            accessibilityScore: undefined, // was null
            trafficLevel: undefined, // was null
            from: {
              id: s.origin_stop.stop_id,
              name: s.origin_stop.stop_name,
              latitude: s.origin_stop.latitude,
              longitude: s.origin_stop.longitude,
            },
            to: {
              id: s.destination_stop.stop_id,
              name: s.destination_stop.stop_name,
              latitude: s.destination_stop.latitude,
              longitude: s.destination_stop.longitude,
            },
            estimatedTime: 0,
            type: 'jeepney',
            stops: [],
            routeName: s.route_id,
            segments: [],
          },
        ]);
        setCalculating(false);
        return;
      } else if (suggestions.length === 1 && suggestions[0].type === 'transfer') {
        // Format transfer route for UI
        const s = suggestions[0];
        setSuggestedRoutes([
          {
            id: `${s.origin_route}-${s.transfer_stop.stop_id}-${s.destination_route}`,
            route: { id: s.origin_route, name: s.origin_route, stops: [], path: [] },
            originStop: s.origin_stop,
            destinationStop: s.destination_stop,
            estimatedFare: 0,
            distance: 0,
            duration: 0,
            accessibilityScore: undefined, // was null
            trafficLevel: undefined, // was null
            from: {
              id: s.origin_stop.stop_id,
              name: s.origin_stop.stop_name,
              latitude: s.origin_stop.latitude,
              longitude: s.origin_stop.longitude,
            },
            to: {
              id: s.destination_stop.stop_id,
              name: s.destination_stop.stop_name,
              latitude: s.destination_stop.latitude,
              longitude: s.destination_stop.longitude,
            },
            estimatedTime: 0,
            type: 'jeepney', // fallback to 'jeepney' for main type
            stops: [],
            routeName: `${s.origin_route} → ${s.destination_route}`,
            segments: [
              {
                type: 'jeepney',
                instructions: `Take ${s.origin_route} to transfer stop`,
                distance: 0,
                duration: 0,
                path: [],
              },
              {
                type: 'transfer',
                instructions: `Transfer at ${s.transfer_stop.stop_name}`,
                distance: 0,
                duration: 0,
                path: [],
              },
              {
                type: 'jeepney',
                instructions: `Take ${s.destination_route} to destination`,
                distance: 0,
                duration: 0,
                path: [],
              },
            ],
          },
        ]);
        setCalculating(false);
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
        stops: (suggestion.route.stops || []).map((stop: any) => ({
          id: stop.stop_id.toString(),
          name: stop.stop_name,
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
        routeName: suggestion.route.name,
        segments: suggestion.segments,
      }));

      setSuggestedRoutes(formattedSuggestions);
      translateY.value = withSpring(SNAP_POINTS[0]); // Fully open the panel to show results

      // Fit map to show the entire route
      if (formattedSuggestions.length > 0) {
        const firstRoute = formattedSuggestions[0];
        const coordinates = [
          { latitude: firstRoute.from.latitude, longitude: firstRoute.from.longitude },
          { latitude: firstRoute.to.latitude, longitude: firstRoute.to.longitude },
          ...firstRoute.route.path
        ];
        
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
      });
      }

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
      const directions = await api.getWalkingDirections(
        { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      );
      setWalkingDirections(directions.coordinates);
      mapRef.current?.fitToCoordinates(directions.coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } catch (error) {
      console.error('Error getting walking directions:', error);
      Alert.alert('Error', 'Failed to get walking directions');
      setWalkingDirections([]);
    }
  };

  const MapModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showMap}
      onRequestClose={() => {
        setShowMap(false);
        setSelectedStop(null); // Clear selected stop when MapModal is closed
      }}
    >
      <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => {
            setShowMap(false);
            setSelectedStop(null); // Clear selected stop when MapModal is closed via button
          }}>
            <MaterialIcons name="close" size={24} color="#333" />
          </TouchableOpacity>
        <MapView
          ref={mapRef}
            style={styles.fullMap}
          provider={PROVIDER_DEFAULT}
            initialRegion={userLocation ? {
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            } : undefined}
        >
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
            {selectedStop && (
            <Marker
              coordinate={{
                  latitude: selectedStop.latitude,
                  longitude: selectedStop.longitude,
              }}
                title={selectedStop.name}
                pinColor="red"
            />
            )}
          {walkingDirections.length > 0 && (
            <Polyline
              coordinates={walkingDirections}
              strokeWidth={4}
                strokeColor="blue"
            />
          )}
        </MapView>
        {selectedStop && (
            <TouchableOpacity style={styles.directionsButton} onPress={() => getWalkingDirections(selectedStop)}>
              <Text style={styles.directionsButtonText}>Get Directions to {selectedStop.name}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  const DestinationPickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showDestinationPickerModal}
      onRequestClose={() => {
        setShowDestinationPickerModal(false);
        setShowMap(false); // Ensure MapModal is closed on request close
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.destinationPickerModalContainer} pointerEvents="auto">
          <TextInput
            style={styles.destinationSearchInput}
            placeholder="Search destination stop"
            placeholderTextColor="#888"
            value={destinationSearchText}
            onChangeText={setDestinationSearchText}
            autoFocus={true}
          />
          <TouchableOpacity style={styles.modalActionButton} onPress={async () => {
            if (!userLocation) await requestLocationPermission();
            if (nearestStops.length > 0) {
              setDestinationStop(nearestStops[0].id);
              setDestinationSearchText(nearestStops[0].name);
              setShowDestinationPickerModal(false);
            } else {
              Alert.alert('No Nearby Stops', 'No jeepney stops found within 500 meters of your location.');
            }
          }}>
            <Text style={styles.modalActionButtonText}>Use My Current Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalActionButton} onPress={() => {
            setShowDestinationPickerModal(false);
            setSelectionMode('destination');
          }}>
            <Text style={styles.modalActionButtonText}>Pick on Map</Text>
          </TouchableOpacity>
          <FlatList
            data={filteredStops}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
            <TouchableOpacity
                style={styles.stopListItem}
              onPress={() => {
                  setDestinationStop(item.id);
                  setDestinationSearchText(item.name);
                  setShowDestinationPickerModal(false);
                  setShowMap(false); // Ensure MapModal is closed after selection
              }}
            >
                <Text style={styles.stopListItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => {
              setShowDestinationPickerModal(false);
              setShowMap(false); // Ensure MapModal is closed on cancel
            }}
          >
            <Text style={styles.closeModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
      </View>
    </Modal>
  );

  const OriginPickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showOriginPickerModal}
      onRequestClose={() => {
        setShowOriginPickerModal(false);
        setShowMap(false); // Ensure MapModal is closed on request close
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.destinationPickerModalContainer} pointerEvents="auto">
          <TextInput
            style={styles.destinationSearchInput}
            placeholder="Search origin stop"
            placeholderTextColor="#888"
            value={originSearchText}
            onChangeText={setOriginSearchText}
            autoFocus={true}
          />
          <TouchableOpacity style={styles.modalActionButton} onPress={handleUseCurrentLocation}>
            <Text style={styles.modalActionButtonText}>Use My Current Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalActionButton} onPress={() => {
            setShowOriginPickerModal(false);
            setSelectionMode('origin');
          }}>
            <Text style={styles.modalActionButtonText}>Pick on Map</Text>
          </TouchableOpacity>
          <FlatList
            data={filteredOriginStops}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.stopListItem}
                onPress={() => {
                  setOriginStop(item.id);
                  setOriginSearchText(item.name);
                  setShowOriginPickerModal(false);
                  setShowMap(false); // Ensure MapModal is closed after selection
                }}
              >
                <Text style={styles.stopListItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => {
              setShowOriginPickerModal(false);
              setShowMap(false); // Ensure MapModal is closed on cancel
            }}
          >
            <Text style={styles.closeModalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const handleStopPress = (stop: Stop) => {
    if (selectionMode === 'origin') {
      setOriginStop(stop.id);
      setOriginSearchText(stop.name);
      setSelectionMode('none');
    } else if (selectionMode === 'destination') {
      setDestinationStop(stop.id);
      setDestinationSearchText(stop.name);
      setSelectionMode('none');
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!userLocation) {
      await requestLocationPermission();
      return;
    }

    if (nearestStops.length > 0) {
      setOriginStop(nearestStops[0].id);
      setOriginSearchText(nearestStops[0].name);
      setSelectionMode('none');
    } else {
      Alert.alert(
        'No Nearby Stops',
        'No jeepney stops found within 500 meters of your location.'
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const selectedOriginStopName = stops.find(stop => stop.id === originStop)?.name || (
    locationLoading ? 'Detecting location...' : 'Select Origin'
  );
  const selectedDestinationStopName = stops.find(stop => stop.id === destinationStop)?.name || 'Select Destination';

  return (
    <View style={styles.mainContainer}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>G!</Text>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes or destinations"
            placeholderTextColor="#888"
          />
        </View>
        <TouchableOpacity style={styles.menuIcon}>
          <MaterialIcons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        {userRole === 'admin' && (
          <TouchableOpacity
            style={{ marginLeft: 10, backgroundColor: '#0a662e', padding: 8, borderRadius: 8 }}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Users</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: userLocation?.coords.latitude || 7.0722,
          longitude: userLocation?.coords.longitude || 125.6131,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
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
        {/* Always render stop markers */}
        {(() => { console.log('mapStops:', mapStops); return null; })()}
        {mapStops.map(stop => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={stop.name}
            pinColor={
              stop.id === originStop
                ? '#0a662e' // Green for origin
                : stop.id === destinationStop
                ? '#e74c3c' // Red for destination
                : '#666' // Gray for other stops
            }
            onPress={() => handleStopPress(stop)}
          />
        ))}
        {suggestedRoutes.length > 0 && suggestedRoutes[0].segments.map((segment, index) => (
            <Polyline
            key={`selected-route-${segment.type}-${index}`}
              coordinates={segment.path}
              strokeWidth={4}
            strokeColor={segment.type === 'walking' ? '#4285F4' : '#F4B400'}
              lineCap="round"
              lineJoin="round"
            />
        ))}
      </MapView>

      {/* Selection Mode Indicator */}
      {selectionMode !== 'none' && (
        <View style={styles.selectionModeIndicator}>
          <Text style={styles.selectionModeText}>
            {selectionMode === 'origin' ? 'Select Origin Stop' : 'Select Destination Stop'}
          </Text>
          <TouchableOpacity
            style={styles.cancelSelectionButton}
            onPress={() => setSelectionMode('none')}
          >
            <Text style={styles.cancelSelectionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet Panel */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.bottomSheet, rBottomSheetStyle]}>
          <View style={styles.handleBar} />

          {suggestedRoutes.length === 0 ? (
            <ScrollView contentContainerStyle={styles.panelContent}>
              <Text style={styles.panelTitle}>Asa ta G?</Text>

              <TouchableOpacity
                style={styles.inputField}
                onPress={() => {
                  setSelectionMode('origin');
                  setShowMap(false);
                }}
              >
                <MaterialIcons name="my-location" size={20} color="#0a662e" />
                <Text style={styles.inputFieldText}>{selectedOriginStopName}</Text>
                {locationLoading && <ActivityIndicator size="small" color="#0a662e" style={{ marginLeft: 10 }} />} 
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inputField}
                onPress={() => {
                  setSelectionMode('destination');
                  setShowMap(false);
                }}
              >
                <MaterialIcons name="location-on" size={20} color="#e74c3c" />
                <Text style={styles.inputFieldText}>{selectedDestinationStopName}</Text>
              </TouchableOpacity>

              {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.sectionTitle}>Smart Filters</Text>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Traffic-Aware Routing</Text>
          <Switch
            value={filters.trafficAware}
            onValueChange={() => toggleFilter('trafficAware')}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={filters.trafficAware ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Time-Based Adjustments</Text>
          <Switch
            value={filters.timeOfDay}
            onValueChange={() => toggleFilter('timeOfDay')}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={filters.timeOfDay ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Accessibility Features</Text>
          <Switch
            value={filters.accessibility}
            onValueChange={() => toggleFilter('accessibility')}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={filters.accessibility ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>

              {/* Passenger Type Picker */}
        <View style={styles.pickerContainer}>
        <Text style={styles.sectionTitle}>Passenger Type</Text>
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
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.panelContent}>
              <TouchableOpacity style={styles.backButton} onPress={() => setSuggestedRoutes([])}>
                <MaterialIcons name="arrow-back" size={24} color="#0a662e" />
                <Text style={styles.backButtonText}>Suggested Routes</Text>
              </TouchableOpacity>

              {suggestedRoutes.map((suggestion, index) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.routeCard}
                  onPress={() => navigation.navigate('RouteDetails', { route: suggestion, passengerType: passengerType })} 
                >
                  <View style={styles.routeCardHeader}>
                    <Text style={styles.routeCardFare}>P {getDiscountedFare(suggestion.estimatedFare, passengerType).toFixed(2)}</Text>
                    <Text style={styles.routeCardTime}>{Math.round(suggestion.duration / 60)} min</Text>
        </View>
                  <View style={styles.routeCardBody}>
                    <Text style={styles.routeCardName}>{suggestion.routeName}</Text>
                    <Text style={styles.routeCardDetails}>P {suggestion.estimatedFare.toFixed(2)}</Text>
                    <Text style={styles.routeCardDetails}>{Math.round(suggestion.duration / 60)} min</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </PanGestureHandler>

      <MapModal />
      <DestinationPickerModal />
      <OriginPickerModal />

      {/* Selection Mode Indicator Overlay */}
      {selectionMode !== 'none' && (
        <View style={styles.selectionModeIndicatorOverlay} pointerEvents="box-none">
          <Text style={styles.selectionModeTextOverlay}>
            {selectionMode === 'origin' ? 'Tap a stop on the map to select as Origin' : 'Tap a stop on the map to select as Destination'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#e0f2f7', // Light blue background
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
    zIndex: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  logoContainer: {
    backgroundColor: '#0a662e', // Dark green
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 5,
    fontSize: 16,
    color: '#333',
  },
  menuIcon: {
    padding: 5,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT, // Max height
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginVertical: 10,
  },
  panelContent: {
    paddingBottom: 100, // Ensure content is scrollable above the bottom edge
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a662e', // Dark green
    marginBottom: 20,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  inputFieldText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    marginLeft: 10,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#0a662e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  filtersContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    padding: 5,
  },
  fullMap: {
    flex: 1,
  },
  directionsButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a662e',
    marginLeft: 10,
  },
  routeCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  routeCardFare: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e67e22', // Orange color
  },
  routeCardTime: {
    fontSize: 16,
    color: '#555',
  },
  routeCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  routeCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  routeCardDetails: {
    fontSize: 14,
    color: '#777',
    marginLeft: 10,
  },
  // Styles for DestinationPickerModal
  destinationPickerModalContainer: {
    width: '90%',
    height: '70%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationSearchInput: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  stopListItem: {
    paddingVertical: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  stopListItemText: {
    fontSize: 16,
    color: '#333',
  },
  closeModalButton: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectionModeIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectionModeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelSelectionButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  cancelSelectionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalActionButton: {
    backgroundColor: '#0a662e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalActionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectionModeIndicatorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionModeTextOverlay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default HomeScreen;