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
import api, { Route } from '../services/api';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { RootStackParamList } from '../types/navigation';
import { PassengerType } from '../types';
import { MaterialIcons } from '@expo/vector-icons';

type RouteDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RouteDetails'>;
type RouteDetailsScreenRouteProp = RouteProp<RootStackParamList, 'RouteDetails'>;

const RouteDetailsScreen = () => {
  const [loading, setLoading] = useState(false);
  const routeParams = useRoute<RouteDetailsScreenRouteProp>().params;
  const navigation = useNavigation<RouteDetailsScreenNavigationProp>();
  const { route, passengerType } = routeParams;

  // Calculate route bounds for map
  const coordinates = route.stops.map(stop => ({
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));

  // Calculate the center point of the route
  const centerLat = coordinates.reduce((sum, coord) => sum + coord.latitude, 0) / coordinates.length;
  const centerLng = coordinates.reduce((sum, coord) => sum + coord.longitude, 0) / coordinates.length;

  // Calculate the map region to show all stops
  const getMapRegion = () => {
    const minLat = Math.min(...coordinates.map(coord => coord.latitude));
    const maxLat = Math.max(...coordinates.map(coord => coord.latitude));
    const minLng = Math.min(...coordinates.map(coord => coord.longitude));
    const maxLng = Math.max(...coordinates.map(coord => coord.longitude));

    const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom level
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  };

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
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={getMapRegion()}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
        >
          {/* Origin Marker */}
          <Marker
            coordinate={coordinates[0]}
            title="Origin"
            description={route.from.name}
          >
            <View style={styles.markerContainer}>
              <MaterialIcons name="location-on" size={30} color="#4CAF50" />
            </View>
          </Marker>

          {/* Destination Marker */}
          <Marker
            coordinate={coordinates[coordinates.length - 1]}
            title="Destination"
            description={route.to.name}
          >
            <View style={styles.markerContainer}>
              <MaterialIcons name="flag" size={30} color="#F44336" />
            </View>
          </Marker>

          {/* Stop Markers */}
          {coordinates.slice(1, -1).map((coord, index) => (
            <Marker
              key={index}
              coordinate={coord}
              title={`Stop ${index + 2}`}
              description={route.stops[index + 1].name}
            >
              <View style={styles.stopMarkerContainer}>
                <Text style={styles.stopMarkerText}>{index + 2}</Text>
              </View>
            </Marker>
          ))}

          {/* Route Polyline */}
          <Polyline
            coordinates={coordinates}
            strokeColor="#007AFF"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        </MapView>
      </View>

      <View style={styles.routeInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons name="directions-bus" size={24} color="#007AFF" />
          <Text style={styles.routeName}>{route.routeName}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={24} color="#4CAF50" />
          <Text style={styles.routeText}>{route.from.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="flag" size={24} color="#F44336" />
          <Text style={styles.routeText}>{route.to.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="straighten" size={24} color="#FF9800" />
          <Text style={styles.routeText}>{(route.distance / 1000).toFixed(2)} km</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="access-time" size={24} color="#9C27B0" />
          <Text style={styles.routeText}>{route.estimatedTime} minutes</Text>
        </View>
      </View>

      <View style={styles.stopsList}>
        <Text style={styles.sectionTitle}>Stops</Text>
        {route.stops.map((stop, index) => (
          <View key={stop.id} style={styles.stopItem}>
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{index + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{stop.name}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.fareInfo}>
        <Text style={styles.sectionTitle}>Fare Information</Text>
        <Text style={styles.fareText}>Base Fare: ₱{route.fare.toFixed(2)}</Text>
        <Text style={styles.fareText}>
          Discounted Fare: ₱{getDiscountedFare(route.fare, passengerType).toFixed(2)}
        </Text>
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMarkerContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  stopMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeInfo: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  stopsList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  stopItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stopNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  fareInfo: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fareText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RouteDetailsScreen; 