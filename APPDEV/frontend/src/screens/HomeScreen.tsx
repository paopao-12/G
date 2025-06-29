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
import api, { Route, FareInfo, RouteFilter } from '../services/api';
import { BUS_STOPS } from '../busStops';
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
import * as Location from 'expo-location';
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
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
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
 
  const [locationLoading, setLocationLoading] = useState(false);
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<HomeScreenNavigationProp>();
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
   
  }, []);



  useEffect(() => {
    // Fetch user role from AsyncStorage
    AsyncStorage.getItem('user_role').then(role => {
      setUserRole(role);
    });
  }, []);

  

  const loadData = async () => {
    try {
      setLoading(true);
      const routesResponse = await api.getRoutes();
      setRoutes(routesResponse);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (userLocation) {
      loadData();
    }
  }, [userLocation]);



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

  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
            placeholder="Search routes"
            placeholderTextColor="#888" />
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

      {/* Button to go to Route Suggest Screen - fixed at bottom center */}
      <View style={styles.routeSuggestButtonContainer}>
        <TouchableOpacity
          style={styles.routeSuggestButton}
          onPress={() => navigation.navigate('RouteSuggest')}
        >
          <Text style={styles.routeSuggestButtonText}>
            ASA TA G!
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map View: BUS_STOPS and GTFS polylines rendered here. */}
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
        {/* Render static bus stops */}
        {BUS_STOPS.map((stop, idx) => (
          <Marker
            key={`busstop-${idx}`}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.name}
          >
            <View style={{backgroundColor:'#0a662e',borderRadius:8,padding:4}}>
              <Text style={{color:'#fff',fontWeight:'bold',fontSize:10}}>{stop.name}</Text>
            </View>
          </Marker>
        ))}
        {/* Render GTFS route polylines */}
        {routes.map((route, idx) => (
          <Polyline
            key={`route-polyline-${route.route_id}`}
            coordinates={route.polyline}
            strokeColor={'#F4B400'}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        ))}
      </MapView>
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
  routeSuggestButtonContainer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  routeSuggestButton: {
    backgroundColor: '#0a662e',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  routeSuggestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
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