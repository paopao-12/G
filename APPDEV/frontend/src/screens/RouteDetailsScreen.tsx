import React from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { LatLng } from '../types/navigation';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

type PassengerType = 'regular' | 'senior' | 'student' | 'disabled';

function getDistanceKm(start: LatLng, end: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(end.lat - start.lat);
  const dLon = toRad(end.lon - start.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(start.lat)) *
      Math.cos(toRad(end.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getWalkingTimeMin(distanceMeters: number): number {
  const walkingSpeedMps = 1.4;
  return distanceMeters / walkingSpeedMps / 60;
}

function getJeepneyTimeMin(distanceKm: number): number {
  const jeepneySpeedKph = 15;
  return (distanceKm / jeepneySpeedKph) * 60;
}

const BASE_FARE = 13;
const BASE_DISTANCE = 4;
const PER_KM_FARE = 1.8;
const PASSENGER_DISCOUNT: Record<PassengerType, number> = {
  regular: 0,
  senior: 0.2,
  student: 0.15,
  disabled: 0.5,
};

function calculateFare(distanceKm: number, type: PassengerType): string {
  let fare = BASE_FARE;
  if (distanceKm > BASE_DISTANCE) {
    fare += (distanceKm - BASE_DISTANCE) * PER_KM_FARE;
  }
  const discount = PASSENGER_DISCOUNT[type] || 0;
  fare = fare * (1 - discount);
  return fare.toFixed(2);
}

export default function ResultsScreen({ route, navigation }: any) {
  const { suggestions, userLocation, destLoc, passengerType } = route.params;


  if (!userLocation || !suggestions || !destLoc) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Required data (user location, destination, or route) is missing!
        </Text>
      </View>
    );
  }

  const distanceKm =
    userLocation && destLoc ? getDistanceKm(userLocation, destLoc) : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚍 Suggested Routes</Text>
      {distanceKm !== null && (
        <Text style={styles.distanceText}>
          Distance to Destination: {distanceKm.toFixed(2)} km (~
          {getWalkingTimeMin(distanceKm * 1000).toFixed(0)} min walk)
        </Text>
      )}
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.shape_id}
        renderItem={({ item }: { item: any }) => {
          const entryTime = getWalkingTimeMin(item.entryDistance);
          const exitTime = getWalkingTimeMin(item.exitDistance);
          const routeDistanceKm = item.routeDistance || 3; 
          const jeepTime = getJeepneyTimeMin(routeDistanceKm);
          const fare = calculateFare(routeDistanceKm, passengerType);

          return (
            <View style={styles.item}>
              <Text style={styles.routeName}>
                🚌 Route: {item.route_short_name || item.shape_id}
              </Text>

              <Text style={styles.sectionTitle}>🚶 Walking Info</Text>
              <Text style={styles.infoText}>
                Walk to Entry: {item.entryDistance.toFixed(0)} m (~{entryTime.toFixed(0)} min)
              </Text>
              <Text style={styles.infoText}>
                Walk from Exit: {item.exitDistance.toFixed(0)} m (~{exitTime.toFixed(0)} min)
              </Text>

              <Text style={styles.sectionTitle}>🚍 Jeepney Info</Text>
              <Text style={styles.infoText}>Estimated Jeepney Time: {jeepTime.toFixed(0)} min</Text>
              <Text style={styles.infoText}>Estimated Jeepney Distance: {routeDistanceKm.toFixed(2)} km</Text>

              <Text style={styles.sectionTitle}>💰 Fare Info</Text>
              <Text style={styles.fareText}>
                Approx. Fare ({passengerType}): ₱{fare}
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  title="View Details"
                  onPress={() =>
                    navigation.navigate('RouteDetails', {
                      route: item,
                      userLocation,
                      destLoc,
                      passengerType,
                      fare,
                      suggestions,
                    })
                  }
                  color="#0a662e"
                />
              </View>
            </View>
          );
        }}
      />
       {/* Back Button at Bottom */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>⬅ Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, color: '#0a662e' },
  distanceText: { fontSize: 16, marginBottom: 16, color: '#0a662e' },
  item: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  routeName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#0a662e' },
  sectionTitle: { fontWeight: 'bold', marginTop: 8, color: '#0a662e' },
  infoText: { fontSize: 14, color: '#333' },
  fareText: { fontSize: 16, fontWeight: 'bold', marginTop: 4, color: '#0a662e' },
  buttonContainer: { marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 },

   backButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0a662e',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
    errorText: {
    textAlign: 'center',
    color: '#ff0000',
    marginTop: 20,
    fontSize: 16,

},
});
