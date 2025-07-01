import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { LatLng } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';


// PassengerType and discount map
type PassengerType = 'regular' | 'senior' | 'student' | 'disabled';
const PASSENGER_DISCOUNT: Record<PassengerType, number> = {
  regular: 0,
  senior: 0.2,
  student: 0.15,
  disabled: 0.5,
};

// Fare constants
const BASE_FARE = 13;
const BASE_DISTANCE = 4;
const PER_KM_FARE = 1.8;

// Fare calculation
function calculateFare(distanceKm: number, type: PassengerType): string {
  let fare = BASE_FARE;
  if (distanceKm > BASE_DISTANCE) {
    fare += (distanceKm - BASE_DISTANCE) * PER_KM_FARE;
  }
  const discount = PASSENGER_DISCOUNT[type] || 0;
  fare = fare * (1 - discount);
  return fare.toFixed(2);
}

// Utility functions
function getDistanceKm(start: LatLng, end: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(end.lat - start.lat);
  const dLon = toRad(end.lon - start.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(start.lat)) * Math.cos(toRad(end.lat)) * Math.sin(dLon / 2) ** 2;
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

export function ResultsScreen({ route, navigation }: any) {
  const { suggestions, userLocation, destLoc, passengerType } = route.params;
  const distanceKm = userLocation && destLoc ? getDistanceKm(userLocation, destLoc) : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚍 Suggested Routes</Text>
      {distanceKm !== null && (
        <Text style={styles.distanceText}>
          Destination Distance: {distanceKm.toFixed(2)} km (~
          {getWalkingTimeMin(distanceKm * 1000).toFixed(0)} min walk)
        </Text>
      )}
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.shape_id}
        ListEmptyComponent={<Text style={styles.emptyText}>No routes found.</Text>}
        renderItem={({ item }) => {
          const entryTime = getWalkingTimeMin(item.entryDistance);
          const exitTime = getWalkingTimeMin(item.exitDistance);
          const routeDistanceKm = item.routeDistance || 3; // fallback if undefined
          const jeepTime = getJeepneyTimeMin(routeDistanceKm);
          const fare = calculateFare(routeDistanceKm, passengerType);

          return (
            <View style={styles.card}>
              <Text style={styles.routeName}>
                🚌 {item.route_short_name || item.shape_id}
              </Text>

              <Text style={styles.sectionTitle}>🚶 Walking</Text>
              <Text>
                To Entry: {item.entryDistance.toFixed(0)} m (~{entryTime.toFixed(0)} min)
              </Text>
              <Text>
                From Exit: {item.exitDistance.toFixed(0)} m (~{exitTime.toFixed(0)} min)
              </Text>

              <Text style={styles.sectionTitle}>🚍 Jeepney</Text>
              <Text>Time: {jeepTime.toFixed(0)} min</Text>
              <Text>Distance: {routeDistanceKm.toFixed(2)} km</Text>

              <Text style={styles.sectionTitle}>💰 Fare</Text>
              <Text>₱{fare} ({passengerType})</Text>

              <Pressable
                style={styles.button}
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
              >
                <Text style={styles.buttonText}>View Details</Text>
              </Pressable>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFBF2', // light beige
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A662E', // deep green
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 16,
    color: '#0A662E',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A662E',
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginTop: 8,
    color: '#37903C', // brighter green for sections
  },
  button: {
    marginTop: 12,
    backgroundColor: '#0A662E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
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
});
