import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import api, { Route, FareInfo, RouteFilter } from '../services/api';
import { BUS_STOPS } from '../busStops';
import { RootStackParamList } from '../types/navigation';
import { PassengerType } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const busIcon = require('../../assets/bus icon3.png'); // Ensure you have a bus icon image in your assets



const HomeScreen = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    loadData();
    AsyncStorage.getItem('user_role').then(role => {
      setUserRole(role);
    });
  }, []);

  const GTFS_ROUTES = [
  { route_id: 'route_1', route_short_name: 'Bago Aplaya' },
  { route_id: 'route_2', route_short_name: 'Bangkal' },
  { route_id: 'route_3', route_short_name: 'Bo. Obrero' },
  { route_id: 'route_4', route_short_name: 'Buhangin via Dacudao' },
  { route_id: 'route_5', route_short_name: 'Buhangin via JP Laurel' },
  { route_id: 'route_6', route_short_name: 'Bunawan via Buhangin' },
  { route_id: 'route_7', route_short_name: 'Bunawan via Sasa' },
  { route_id: 'route_8', route_short_name: 'Calinan' },
  { route_id: 'route_9', route_short_name: 'Camp Catitipan via JP Laurel' },
  { route_id: 'route_10', route_short_name: 'Catalunan Grande' },
  { route_id: 'route_11', route_short_name: 'Ecoland' },
  { route_id: 'route_12', route_short_name: 'El Rio' },
  { route_id: 'route_13', route_short_name: 'Emily Homes' },
  { route_id: 'route_14', route_short_name: 'Jade Valley' },
  { route_id: 'route_15', route_short_name: 'Lasang via Buhangin' },
  { route_id: 'route_16', route_short_name: 'Lasang via Sasa' },
  { route_id: 'route_17', route_short_name: 'Maa - Agdao' },
  { route_id: 'route_18', route_short_name: 'Maa - Bankerohan' },
  { route_id: 'route_19', route_short_name: 'Magtuod' },
  { route_id: 'route_20', route_short_name: 'Matina' },
  { route_id: 'route_21', route_short_name: 'Matina Aplaya' },
  { route_id: 'route_22', route_short_name: 'Matina Crossing' },
  { route_id: 'route_23', route_short_name: 'Matina Pangi' },
  { route_id: 'route_24', route_short_name: 'Mintal' },
  { route_id: 'route_25', route_short_name: 'Panacan via Cabaguio' },
  { route_id: 'route_26', route_short_name: 'Panacan - SM City Davao' },
  { route_id: 'route_27', route_short_name: 'Puan' },
  { route_id: 'route_28', route_short_name: 'Route 1' },
  { route_id: 'route_29', route_short_name: 'Route 2' },
  { route_id: 'route_30', route_short_name: 'Route 3' },
  { route_id: 'route_31', route_short_name: 'Route 4' },
  { route_id: 'route_32', route_short_name: 'Route 5' },
  { route_id: 'route_33', route_short_name: 'Route 6' },
  { route_id: 'route_34', route_short_name: 'Route 7' },
  { route_id: 'route_35', route_short_name: 'Route 8' },
  { route_id: 'route_36', route_short_name: 'Route 9' },
  { route_id: 'route_37', route_short_name: 'Route 10' },
  { route_id: 'route_38', route_short_name: 'Route 11' },
  { route_id: 'route_39', route_short_name: 'Route 12' },
  { route_id: 'route_40', route_short_name: 'Route 13' },
  { route_id: 'route_41', route_short_name: 'Route 14' },
  { route_id: 'route_42', route_short_name: 'Route 15' },
  { route_id: 'route_43', route_short_name: 'Sasa via Cabaguio' },
  { route_id: 'route_44', route_short_name: 'Sasa via JP Laurel' },
  { route_id: 'route_45', route_short_name: 'Sasa via R. Castillo' },
  { route_id: 'route_46', route_short_name: 'Talomo' },
  { route_id: 'route_47', route_short_name: 'Tibungco via Buhangin' },
  { route_id: 'route_48', route_short_name: 'Tibungco via Cabaguio' },
  { route_id: 'route_49', route_short_name: 'Tibungco via R. Castillo' },
  { route_id: 'route_50', route_short_name: 'Toril' },
  { route_id: 'route_51', route_short_name: 'Ulas' },
  { route_id: 'route_52', route_short_name: 'Wa-an' }
];

  const loadData = async () => {
    try {
      setLoading(true);
      const routesResponse = await api.getRoutes();
       const routesWithNames = routesResponse.map(route => {
      const gtfsRoute = GTFS_ROUTES.find(r => r.route_id === route.route_id);
      return {
        ...route,
        route_short_name: gtfsRoute?.route_short_name || route.route_id,
      };
    });
      setRoutes(routesResponse);
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
    // All selected, so clear all
    setSelectedRouteIds([]);
  } else {
    // Select all routes
    setSelectedRouteIds(routes.map(route => route.route_id));
  }
};

const [isExpanded, setIsExpanded] = useState(true);
const [searchTerm, setSearchTerm] = useState('');

const filteredRoutes = routes.filter(route =>
  route.route_id.toLowerCase().includes(searchTerm.toLowerCase())
);

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

      {/* Multi-select Route Checkbox List */}
      <View style={styles.routeSelectorContainer}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.headerText}>Routes</Text>
          <MaterialIcons
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#555"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.content}>
            <TextInput
              style={styles.searchInput}
              placeholder="Route Name"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            <ScrollView style={styles.scrollView}>
              {filteredRoutes.map(route => {
                const isSelected = selectedRouteIds.includes(route.route_id);
                const color = `#${route.route_color || '0a662e'}`;
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
            <TouchableOpacity style={styles.showAllButton} onPress={toggleShowAllRoutes}>
  <Text style={styles.showAllButtonText}>
    {selectedRouteIds.length === routes.length ? 'Clear All' : 'Show All'}
  </Text>
</TouchableOpacity>
          </View>
        )}
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
        {/* Render static bus stops with custom icon */}
        {BUS_STOPS.map((stop, idx) => (
          <Marker
            key={`busstop-${idx}`}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.name}
          >
            <Image
              source={busIcon}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </Marker>
        ))}

        {/* Render polylines for selected routes */}
       {routes
  .filter(route => selectedRouteIds.length > 0 && selectedRouteIds.includes(route.route_id))
  .map(route => (
    <Polyline
      key={`route-polyline-${route.route_id}`}
      coordinates={route.polyline}
       strokeColor={`#${route.route_color || 'F4B400'}`} // Default color if not specified
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
    backgroundColor: '#e0f2f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  routeSelectorContainer: {
    position: 'absolute',
    top: 100,
    left: 10,
    zIndex: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 250,
  },
  content: {
    padding: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  scrollView: {
    maxHeight: 200,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  selectedRouteText: {
    fontWeight: 'bold',
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
});

export default HomeScreen;