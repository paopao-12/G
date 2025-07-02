import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { LatLng } from '../types/navigation';

type PassengerType = 'regular' | 'senior' | 'student' | 'disabled';

interface RouteDetailsScreenProps {
  route: any;
  navigation: any;
}

const RouteDetailsScreen: React.FC<RouteDetailsScreenProps> = ({ route, navigation }) => {
  const { route: selectedRoute, userLocation, destLoc, passengerType, fare } = route.params;

  // Log the route parameters for debugging
  console.log('Route Parameters:', route.params);

  // Defensive checks for required data
  if (!userLocation || !destLoc || !selectedRoute) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Required data (user location, destination, or route) is missing!</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅ Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Access entry and exit points directly from selectedRoute
  const entryPoint: LatLng = selectedRoute.entry; // Access entry point
  const exitPoint: LatLng = selectedRoute.exit; // Access exit point

  // Additional defensive checks for entry and exit points
  if (!entryPoint || !exitPoint) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Entry or exit point data is missing!</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅ Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStartNavigation = () => {
    if (!userLocation || !entryPoint || !exitPoint || !destLoc) {
      alert('Missing location data for navigation.');
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${destLoc.lat},${destLoc.lon}&waypoints=${entryPoint.lat},${entryPoint.lon}|${exitPoint.lat},${exitPoint.lon}&travelmode=transit`;

    Linking.openURL(googleMapsUrl);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🚌 Route Details: {selectedRoute.route_short_name || selectedRoute.shape_id}</Text>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.lat,
          longitude: userLocation.lon,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={{ latitude: userLocation.lat, longitude: userLocation.lon }} title="Your Location" pinColor="green" />
        <Marker coordinate={{ latitude: entryPoint.lat, longitude: entryPoint.lon }} title="Entry Point" />
        <Marker coordinate={{ latitude: exitPoint.lat, longitude: exitPoint.lon }} title="Exit Point" />
        <Marker coordinate={{ latitude: destLoc.lat, longitude: destLoc.lon }} title="Destination" pinColor="red" />

        {selectedRoute.polyline && (
          <Polyline
            coordinates={selectedRoute.polyline}
            strokeColor="#0a662e"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>🚶 Walking Information</Text>
        <Text style={styles.infoText}>Walk to Entry: {selectedRoute.entryDistance.toFixed(0)} m</Text>
        <Text style={styles.infoText}>Walk from Exit: {selectedRoute.exitDistance.toFixed(0)} m</Text>

        <Text style={styles.sectionTitle}>🚍 Jeepney Information</Text>
        <Text style={styles.infoText}>Estimated Jeepney Distance: {selectedRoute.routeDistance?.toFixed(2) || 'N/A'} km</Text>

        <Text style={styles.sectionTitle}>💰 Fare Information</Text>
        <Text style={styles.infoText}>Passenger Type: {passengerType}</Text>
        <Text style={styles.infoText}>Estimated Fare: ₱{fare}</Text>
      </View>

      <TouchableOpacity style={styles.navigationButton} onPress={handleStartNavigation}>
        <Text style={styles.navigationButtonText}>🧭 Start Navigation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>⬅ Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 12,
    alignSelf: 'center',
    color: '#0a662e',
  },
  map: {
    width: Dimensions.get('window').width,
    height: 300,
  },
  infoContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0a662e',
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  navigationButton: {
    backgroundColor: '#0a662e',
    padding: 14,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#ccc',
    padding: 14,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    color: '#ff0000',
    marginTop: 20,
    fontSize: 16,
    paddingHorizontal: 16,
  },
});

export default RouteDetailsScreen;