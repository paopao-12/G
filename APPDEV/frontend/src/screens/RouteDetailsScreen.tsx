import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';


const RouteDetailsScreen = ({ route, navigation }: { route: any, navigation: any }) => {
const { route : selectedRoute, destLoc, passengerType, fare } = route?.params || {};
const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
const mapRef = useRef<MapView | null>(null);

useEffect(() => {
  let subscription: Location.LocationSubscription;
(async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(newLocation);

          // Auto-center map as user moves
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              ...newLocation,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }

          // Automatic arrival detection within 100 meters
          const distance = getDistanceFromLatLonInMeters(
            newLocation.latitude,
            newLocation.longitude,
            destLoc.lat,
            destLoc.lon
          );
          if (distance <= 100 && !hasArrived) {
            sendArrivalNotification();
            setHasArrived(true);
          }
        }
      );
    })();
    return () => {
      if (subscription) subscription.remove();
    };
  }, [destLoc, hasArrived]);

  const sendArrivalNotification = () => {
    Alert.alert(
      "You have arrived!",
      "You are now near your drop-off location."
    );
  };

  const handleStartNavigation = () => {
    if (!userLocation) {
      Alert.alert('Waiting for location', 'Please wait while your location is being fetched.');
      return;
    }
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destLoc.lat},${destLoc.lon}&travelmode=transit`;
    Linking.openURL(googleMapsUrl);
  };

const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  if (!userLocation ) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading your location...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
  🚌 Route: {selectedRoute?.route_short_name ?? 'N/A'}
</Text>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* User Marker */}
        <Marker coordinate={userLocation} title="Your Location" pinColor="green" />

        {/* Destination Marker */}
        <Marker
          coordinate={{ latitude: destLoc.lat, longitude: destLoc.lon }}
          title="Destination"
          pinColor="red"
        />

        {/* Entry Marker */}
        {selectedRoute.entry && (
          <Marker
            coordinate={{ latitude: selectedRoute.entry.lat, longitude: selectedRoute.entry.lon }}
            title="Entry Point"
            pinColor="blue"
          />
        )}

        {/* Exit Marker */}
        {selectedRoute.exit && (
          <Marker
            coordinate={{ latitude: selectedRoute.exit.lat, longitude: selectedRoute.exit.lon }}
            title="Exit Point"
            pinColor="orange"
          />
        )}

        {/* Polyline for jeepney route */}
        {selectedRoute.polyline && (
          <Polyline
            coordinates={selectedRoute.polyline}
            strokeColor="#0a662e"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Passenger Type: {passengerType}</Text>
        <Text style={styles.sectionTitle}>Fare: ₱{fare}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStartNavigation}>
        <Text style={styles.buttonText}>🧭 Start Navigation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>⬅ Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', alignSelf: 'center', marginVertical: 10, color: '#0a662e' },
  map: { width: Dimensions.get('window').width, height: 300 },
  infoContainer: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0a662e', marginVertical: 4 },
  button: { backgroundColor: '#0a662e', padding: 14, marginHorizontal: 16, marginTop: 10, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backButton: { backgroundColor: '#999', padding: 14, marginHorizontal: 16, marginVertical: 16, borderRadius: 8, alignItems: 'center' },
});

export default RouteDetailsScreen;
