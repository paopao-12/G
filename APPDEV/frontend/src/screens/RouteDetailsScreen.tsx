import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RouteDetailsScreen({ route }: any) {
  const { suggestion, userLocation, destLoc } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Route Details</Text>
      <Text>Route: {suggestion.shape_id}</Text>
      <Text>Entry Point: {suggestion.entry.lat}, {suggestion.entry.lon}</Text>
      <Text>Exit Point: {suggestion.exit.lat}, {suggestion.exit.lon}</Text>
      <Text>Entry Distance: {suggestion.entryDistance.toFixed(1)} m</Text>
      <Text>Exit Distance: {suggestion.exitDistance.toFixed(1)} m</Text>
      <Text>Total Walking: {suggestion.totalDistance.toFixed(1)} m</Text>
      {/* You can add a map or more info here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
});