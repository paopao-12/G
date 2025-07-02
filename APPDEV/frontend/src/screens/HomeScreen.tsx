import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  Image,
  Button,
  Pressable,
  FlatList,
  
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import api, { Route } from '../services/api';
import { BUS_STOPS } from '../busStops';
import { RootStackParamList } from '../types/navigation';
import { haversine } from '../utils/haversine';
//import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


import * as Location from 'expo-location';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { LatLng, RouteSuggestion, suggestRoutes } from '../utils/smartRouteSuggest';


const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const GTFS_ROUTES = [
  { route_id: 'route_1', route_short_name: 'Bago Aplaya', route_color: 'ff0000' },
  { route_id: 'route_2', route_short_name: 'Bangkal', route_color: 'ffa500' },
  { route_id: 'route_3', route_short_name: 'Bo. Obrero', route_color: 'ffff00' },
  { route_id: 'route_4', route_short_name: 'Buhangin via Dacudao', route_color: '008000' },
  { route_id: 'route_5', route_short_name: 'Buhangin via JP Laurel', route_color: '4da8ee' },
  { route_id: 'route_6', route_short_name: 'Bunawan via Buhangin', route_color: '8d72e1' },
  { route_id: 'route_7', route_short_name: 'Bunawan via Sasa', route_color: 'ffc0cb' },
  { route_id: 'route_8', route_short_name: 'Calinan', route_color: 'ff0000' },
  { route_id: 'route_9', route_short_name: 'Camp Catitipan via JP Laurel', route_color: 'ffa500' },
  { route_id: 'route_10', route_short_name: 'Catalunan Grande', route_color: 'ffff00' },
  { route_id: 'route_11', route_short_name: 'Ecoland', route_color: '008000' },
  { route_id: 'route_12', route_short_name: 'El Rio', route_color: '4da8ee' },
  { route_id: 'route_13', route_short_name: 'Emily Homes', route_color: '8d72e1' },
  { route_id: 'route_14', route_short_name: 'Jade Valley', route_color: 'ffc0cb' },
  { route_id: 'route_15', route_short_name: 'Lasang via Buhangin', route_color: 'ff0000' },
  { route_id: 'route_16', route_short_name: 'Lasang via Sasa', route_color: 'ffa500' },
  { route_id: 'route_17', route_short_name: 'Maa - Agdao', route_color: 'ffff00' },
  { route_id: 'route_18', route_short_name: 'Maa - Bankerohan', route_color: '008000' },
  { route_id: 'route_19', route_short_name: 'Magtuod', route_color: '4da8ee' },
  { route_id: 'route_20', route_short_name: 'Matina', route_color: '8d72e1' },
  { route_id: 'route_21', route_short_name: 'Matina Aplaya', route_color: 'ffc0cb' },
  { route_id: 'route_22', route_short_name: 'Matina Crossing', route_color: 'ff0000' },
  { route_id: 'route_23', route_short_name: 'Matina Pangi', route_color: 'ffa500' },
  { route_id: 'route_24', route_short_name: 'Mintal', route_color: 'ffff00' },
  { route_id: 'route_25', route_short_name: 'Panacan via Cabaguio', route_color: '008000' },
  { route_id: 'route_26', route_short_name: 'Panacan - SM City Davao', route_color: '4da8ee' },
  { route_id: 'route_27', route_short_name: 'Puan', route_color: '8d72e1' },
  { route_id: 'route_28', route_short_name: 'Route 1', route_color: 'ffc0cb' },
  { route_id: 'route_29', route_short_name: 'Route 2', route_color: 'ff0000' },
  { route_id: 'route_30', route_short_name: 'Route 3', route_color: 'ffa500' },
  { route_id: 'route_31', route_short_name: 'Route 4', route_color: 'ffff00' },
  { route_id: 'route_32', route_short_name: 'Route 5', route_color: '008000' },
  { route_id: 'route_33', route_short_name: 'Route 6', route_color: '4da8ee' },
  { route_id: 'route_34', route_short_name: 'Route 7', route_color: '8d72e1' },
  { route_id: 'route_35', route_short_name: 'Route 8', route_color: 'ffc0cb' },
  { route_id: 'route_36', route_short_name: 'Route 9', route_color: 'ff0000' },
  { route_id: 'route_37', route_short_name: 'Route 10', route_color: 'ffa500' },
  { route_id: 'route_38', route_short_name: 'Route 11', route_color: 'ffff00' },
  { route_id: 'route_39', route_short_name: 'Route 12', route_color: '008000' },
  { route_id: 'route_40', route_short_name: 'Route 13', route_color: '4da8ee' },
  { route_id: 'route_41', route_short_name: 'Route 14', route_color: '8d72e1' },
  { route_id: 'route_42', route_short_name: 'Route 15', route_color: 'ffc0cb' },
  { route_id: 'route_43', route_short_name: 'Sasa via Cabaguio', route_color: 'ff0000' },
  { route_id: 'route_44', route_short_name: 'Sasa via JP Laurel', route_color: 'ffa500' },
  { route_id: 'route_45', route_short_name: 'Sasa via R. Castillo', route_color: 'ffff00' },
  { route_id: 'route_46', route_short_name: 'Talomo', route_color: '008000' },
  { route_id: 'route_47', route_short_name: 'Tibungco via Buhangin', route_color: '4da8ee' },
  { route_id: 'route_48', route_short_name: 'Tibungco via Cabaguio', route_color: '8d72e1' },
  { route_id: 'route_49', route_short_name: 'Tibungco via R. Castillo', route_color: 'ffc0cb' },
  { route_id: 'route_50', route_short_name: 'Toril', route_color: 'ff0000' },
  { route_id: 'route_51', route_short_name: 'Ulas', route_color: 'ffa500' },
  { route_id: 'route_52', route_short_name: 'Wa-an', route_color: 'ffff00' },
];


const GOOGLE_MAPS_API_KEY = 'AIzaSyCr_EFHO0mW2q9hpwIx6jbyhiUoEK6O1w8';

const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lon: location.lng };
    } else {
      Alert.alert('Location not found', 'Please enter a valid destination.');
      return null;
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to fetch location data.');
    return null;
  }
};
type PassengerType = 'regular' | 'senior' | 'student' | 'disabled';

const PASSENGER_DISCOUNT: Record<PassengerType, number> = {
  regular: 0,
  senior: 0.2, 
  student: 0.2, 
  disabled: 0.2, 
};

const BASE_FARE = 13;
const BASE_DISTANCE = 4;
const PER_KM_FARE = 1.8; // Fare per kilometer after the base distance

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [passengerType, setPassengerType] = useState<PassengerType>('regular');
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [destination, setDestination] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  //const [selectedRouteIds, setSelectedRouteIds] = useState([]);
  

  const translateY = useSharedValue(SCREEN_HEIGHT * 0.5);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      if (!isScrolling) {
      translateY.value = ctx.startY + event.translationY;
      translateY.value = Math.min(Math.max(translateY.value, 0), SCREEN_HEIGHT);
      }
    },
    onEnd: () => {
      if (translateY.value < (SCREEN_HEIGHT * 0.5 + SCREEN_HEIGHT * 0.1) / 2) {
        translateY.value = withSpring(SCREEN_HEIGHT * 0.1);
        runOnJS(setIsCollapsed)(false);
      } else if (translateY.value > (SCREEN_HEIGHT + SCREEN_HEIGHT * 0.5) / 2) {
        translateY.value = withSpring(SCREEN_HEIGHT);
        runOnJS(setIsCollapsed)(true);
      } else {
        translateY.value = withSpring(SCREEN_HEIGHT * 0.5);
        runOnJS(setIsCollapsed)(false);
      }
    },
  });

  const expandBottomSheet = () => {
    translateY.value = withSpring(SCREEN_HEIGHT *0.1);
    setIsCollapsed(false);
  };

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    loadData();
    AsyncStorage.getItem('user_role').then(role => {
      setUserRole(role);
    });
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const routesResponse = await api.getRoutes();
      console.log('Routes response:', routesResponse); 
      const routesWithNames = routesResponse.map(route => {
        const gtfsRoute = GTFS_ROUTES.find(r => r.route_id === route.route_id);
        return {
          ...route,
           route_short_name: route.route_short_name || gtfsRoute?.route_short_name || route.route_id,
          route_color: route.route_color || gtfsRoute?.route_color || 'F4B400',
        };
      });

      setRoutes(routesWithNames);
      console.log('Total Routes:', routesResponse.length);
    } catch (error: any) {
      Alert.alert('Error', `Failed to load routes: ${error.message || error}`); // Show error message
    } finally {
      setLoading(false);
    }
  };

  const toggleRouteSelection = (routeId: string) => {
    setSelectedRouteIds(prevSelected =>
      prevSelected.includes(routeId)
        ? prevSelected.filter(id => id !== routeId)
        : [...prevSelected, routeId]
    );
  };

  const toggleShowAllRoutes = () => {
  if (selectedRouteIds.length === routes.length) {
    setSelectedRouteIds([]);
    setShowLegend(false); // Hide legend when "Clear All"
  } else {
    setSelectedRouteIds(routes.map(route => route.route_id));
    setShowLegend(true); // Show legend when "Show All"
  }
};


  const filteredRoutes = routes.filter(route =>
    route.route_short_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
  };
  const routeShortNames: Record<string, string> = { };


  const calculateFare = (distanceKm: number, type: PassengerType) => {
    let fare = BASE_FARE;
    if (distanceKm > BASE_DISTANCE) {
      fare += (distanceKm - BASE_DISTANCE) * PER_KM_FARE;
    }
    const discount = PASSENGER_DISCOUNT[type] || 0;
    fare = fare * (1 - discount);
    return fare.toFixed(2);
  };

   const getDistanceKm = (start: { lat: number; lon: number }, end: { lat: number; lon: number }) => {
    const meters = haversine(start.lat, start.lon, end.lat, end.lon);
    return meters / 1000;
  };

  const handleSuggest = async () => {
    if (!userLocation || !destination) {
      Alert.alert('Please provide both your location and destination.');
      return;
    }

    const destCoords = await geocodeAddress(destination);
    if (!destCoords) return;

    // Prepare shapes object: shape_id -> LatLng[]
    const shapes: Record<string, LatLng[]> = {};
    routes.forEach(route => {
      if (route.polyline && route.polyline.length > 0) {
        shapes[route.route_id] = route.polyline.map(p => ({ lat: p.latitude, lon: p.longitude }));
        routeShortNames[route.route_id] = route.route_short_name || route.route_id; // Map shape_id to route_short_name
      }
    });

    const suggestions: RouteSuggestion[] = suggestRoutes(userLocation, destCoords, shapes,routeShortNames, 500);

    if (suggestions.length === 0) {
      Alert.alert('No routes found passing near your location and destination.');
      return;
    }
    const distanceKm = getDistanceKm(userLocation, destCoords);
    const fare = calculateFare(distanceKm, passengerType);

    navigation.navigate('Results', {
      suggestions,
      userLocation,
      destLoc: destCoords,
      passengerType,
      fare,
      
    });
  };

  // Passenger type button options
  const passengerOptions: { label: string; value: PassengerType }[] = [
    { label: 'Regular', value: 'regular' },
    { label: 'Student', value: 'student' },
    { label: 'Senior Citizen', value: 'senior' },
    { label: 'Disabled', value: 'disabled' },
  ];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  const isShowingAllRoutes = selectedRouteIds.length === routes.length;
  return (
    <View style={[styles.mainContainer]}>
      {/* Header */}
      <View style={[styles.header]}>
       <View style={styles.logoContainer}>
  <Image
  source={require('../../assets/g-logo.png')}
  style={styles.logoImage}
  resizeMode="contain"
/>
</View>

      </View>


      {/* Map View */}
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 7.0722,
          longitude: 125.6131,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Bus stops */}
        {BUS_STOPS.map((stop, idx) => (
          <Marker
            key={`busstop-${idx}`}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.name}
          >
            <Image source={require('../../assets/bus icon3.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
          </Marker>
        ))}

        {/* Polylines for selected routes */}
        {routes
          .filter(route => selectedRouteIds.length > 0 && selectedRouteIds.includes(route.route_id))
          .map(route => (
            <Polyline
              key={`route-polyline-${route.route_id}`}
              coordinates={route.polyline}
              strokeColor={`#${route.route_color}`}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          ))}
      </MapView>

      {(isShowingAllRoutes || (showLegend && !isCollapsed)) && (
  <View style={[styles.legendContainer, { top: isCollapsed ? 100 : SCREEN_HEIGHT * 0.1 + 10 }]}>  
    <ScrollView>
      {(isShowingAllRoutes ? routes : selectedRouteIds.map(routeId => routes.find(r => r.route_id === routeId))).map(
        route => route && (
          <View key={route.route_id} style={styles.legendItem}>
            <View
              style={[styles.colorBox, { backgroundColor: `#${route.route_color}` }]}
            />
            <Text style={styles.legendText}>{route.route_short_name}</Text>
          </View>
        )
      )}
    </ScrollView>
  </View>
)}

      

      <PanGestureHandler onGestureEvent={gestureHandler}>
  <Animated.View style={[styles.bottomSheet, rStyle]}>
    <View style={styles.handleBar} />

    {/* New: View All Routes label */}
    <Text style={styles.label}>View All Routes</Text>

    {/* Show All Button */}
    <TouchableOpacity style={styles.showAllButton} onPress={toggleShowAllRoutes}>
      <Text style={styles.showAllButtonText}>
        {selectedRouteIds.length === routes.length ? 'Clear All' : 'Show All'}
      </Text>
    </TouchableOpacity>

    {/* Divider */}
    <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 15 }} />

          {/* Route Suggestion Inputs */}
          <Text style={styles.label}>Step 1: Get your current location</Text>
          <Button
            title={userLocation ? 'Location Set' : 'Get My Location'}
            onPress={handleGetLocation}
            color={userLocation ? '#0a662e' : undefined}
          />
          {userLocation && (
            <Text style={styles.locationText}>
              Your location: {userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)}
            </Text>
          )}
          <Text style={styles.label}>Step 2: Enter your destination</Text>
          <TextInput
            style={styles.input}
            placeholder="Destination (lat,lon)"
            value={destination}
            onChangeText={setDestination}
          />
          
          {/* Passenger Type Buttons */}
          <Text style={styles.label}>Step 3: Select Passenger Type</Text>
          <View style={styles.passengerTypeButtonRow}>
            {passengerOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.passengerTypeButton,
                  passengerType === opt.value && styles.passengerTypeButtonSelected,
                ]}
                onPress={() => setPassengerType(opt.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.passengerTypeButtonText,
                    passengerType === opt.value && styles.passengerTypeButtonTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Suggest Routes Button */}
          <Button title="Suggest Routes" onPress={handleSuggest} />
        </Animated.View>
      </PanGestureHandler>

      {/* Show a small pull-up bar when bottom sheet is collapsed */}
      {isCollapsed && (
        <Pressable style={styles.pullUpBar} onPress={expandBottomSheet}>
          <View style={styles.pullUpHandle} />
          <Text style={styles.pullUpText}>Tap to open</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0a662e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  darkHeader: {
    borderBottomColor: '#333',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 25,
    color: '#333',
  },
  scrollIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  scrollButton: {
    padding: 10,
    backgroundColor: '#0a662e',
    borderRadius: 5,
  },
  scrollButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  dropdownToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#0a662e',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  dropdownToggleText: {
    color: '#0a662e',
    fontWeight: '600',
    fontSize: 16,
  },
  dropdownList: {
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#0a662e',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 14,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#999',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: {
    fontSize: 16,
    color: '#333',
  },
  showAllButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  showAllButtonText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 14,
  },
  logoContainer: {
    backgroundColor: '#0a662e',
    width: 25,
    height: 25,
    //overflow: 'hidden',
  },
  logoImage: {
  width: '270%',      
  height: '270%',
  },
  darkLogoText: {
    color: '#a0d468',
  },
  menuIcon: {
    padding: 5,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.1,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.9,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 28,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0a662e',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#0a662e',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
  },
  locationText: {
    marginBottom: 10,
    color: '#333',
  },
  pullUpBar: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pullUpHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 2.5,
    marginBottom: 6,
  },
  pullUpText: {
    color: '#0a662e',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  darkModalContent: {
    backgroundColor: '#222',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#0a662e',
    fontWeight: 'bold',
  },
  darkCloseButtonText: {
    color: '#a0d468',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 18,
    color: '#333',
  },
  darkModalOptionText: {
    color: '#ddd',
  },
  passengerTypeButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  passengerTypeButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a662e',
    alignItems: 'center',
  },
  passengerTypeButtonSelected: {
    backgroundColor: '#0a662e',
  },
  passengerTypeButtonText: {
    color: '#0a662e',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 12,
  },
  passengerTypeButtonTextSelected: {
    color: '#fff',
  },
  routeGrid: {
    paddingBottom: 20,
  },
  routeGridItem: {
    flex: 1,
    margin: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  routeGridText: {
    textAlign: 'center',
    fontSize: 14,
  },
  legendContainer: {
  position: 'absolute',
  top: 100, // you can dynamically adjust this if needed
  left: 10,
  right: 10,
  maxHeight: SCREEN_HEIGHT * 0.3, // or adjust as needed
  backgroundColor: '#fff',
  padding: 10,
  borderRadius: 10,
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  zIndex: 999,
},
legendScrollContainer: {
  maxHeight: 120,
  marginBottom: 10,
},
legendItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
},
colorBox: {
  width: 16,
  height: 16,
  marginRight: 8,
  borderRadius: 4,
  borderWidth: 1,
  borderColor: '#ccc',
},
legendText: {
  fontSize: 14,
  color: '#333',
},
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0a662e',
  },
  routeButton: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 5, // Use vertical margin for spacing
  },
  routeButtonSelected: {
    backgroundColor: '#0a662e',
    borderColor: '#0a662e',
  },
  routeTextSelected: {
    color: '#fff',
  },
  infoText: {
    fontSize: 18,
    color: '#333',
  },
});

export default HomeScreen;