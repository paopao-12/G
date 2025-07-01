import React, { useEffect, useState } from 'react';
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
  Modal,
  Switch,
  Pressable,
  //Flatlist,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import api, { Route } from '../services/api';
import { BUS_STOPS } from '../busStops';
import { RootStackParamList } from '../types/navigation';
import { haversine } from '../utils/haversine';
import { MaterialIcons } from '@expo/vector-icons';
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
  senior: 0.2, // 20% discount
  student: 0.15, // 15% discount
  disabled: 0.5, // 50% discount
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
  const [modalVisible, setModalVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT * 0.5);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateY.value = ctx.startY + event.translationY;
      translateY.value = Math.min(Math.max(translateY.value, 0), SCREEN_HEIGHT);
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

      const routesWithNames = routesResponse.map(route => {
        const gtfsRoute = GTFS_ROUTES.find(r => r.route_id === route.route_id);
        return {
          ...route,
           route_short_name: route.route_short_name || gtfsRoute?.route_short_name || route.route_id,
          route_color: route.route_color || gtfsRoute?.route_color || 'F4B400',
        };
      });

      setRoutes(routesWithNames);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load routes');
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
    } else {
      setSelectedRouteIds(routes.map(route => route.route_id));
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
  const routeShortNames: Record<string, string> = {};


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

  return (
    <View style={[styles.mainContainer]}>
      {/* Header */}
      <View style={[styles.header]}>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText]}>G!</Text>
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

      {/* Bottom Sheet with multi-select dropdown and route suggest */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.bottomSheet, rStyle]}>
          <View style={styles.handleBar} />
          {/* Multi-select Dropdown */}
          <Text style={styles.label}>View Routes</Text>
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <Text style={styles.dropdownToggleText}>
              {selectedRouteIds.length > 0
                ? `${selectedRouteIds.length} route(s) selected`
                : 'Select routes'}
            </Text>
            <MaterialIcons
              name={dropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color="#0a662e"
            />
          </TouchableOpacity>

          {dropdownOpen && (
            <ScrollView
              style={[styles.dropdownList, { maxHeight: 200 }]} // Adjust 200 as needed
              nestedScrollEnabled={true} // allow inner scrolling inside bottom sheet
            >
              {filteredRoutes.map(route => {
                const isSelected = selectedRouteIds.includes(route.route_id);
                const color = `#${route.route_color}`;
                return (
                  <TouchableOpacity
                    key={route.route_id}
                    onPress={() => toggleRouteSelection(route.route_id)}
                    style={styles.routeItem}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: color,
                          backgroundColor: isSelected ? color : '#fff',
                        },
                      ]}
                    >
                      {isSelected && <MaterialIcons name="check" size={18} color="#fff" />}
                    </View>
                    <Text style={[styles.routeText, isSelected && { fontWeight: 'bold', color }]}>
                      {route.route_short_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

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
          <Text style={styles.pullUpText}>Swipe up or tap to open</Text>
        </Pressable>
      )}

      {/* Modal Menu */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}
          />
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, isDarkMode && styles.darkCloseButtonText]}>
                Close
              </Text>
            </TouchableOpacity>

            <View style={styles.modalOption}>
              <Text style={[styles.modalOptionText, isDarkMode && styles.darkModalOptionText]}>
                Dark Mode
              </Text>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                thumbColor={isDarkMode ? '#0a662e' : '#f4f3f4'}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#e0f2f7',
  },
  darkMainContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
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
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#00000066',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    textAlign: 'center',
    fontFamily: 'sans-serif-condensed',
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
});

export default HomeScreen;