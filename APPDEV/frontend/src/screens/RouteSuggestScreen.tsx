import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, Alert } from 'react-native';
import * as Location from 'expo-location';
import { suggestRoutes, LatLng } from '../utils/smartRouteSuggest';
type ShapeWithName = {
  route_short_name: string;
  route_long_name: string;
  shape: { lat: number; lon: number }[];
};
const shapesWithNames: Record<string, ShapeWithName> = require('../../assets/shapes_with_names.json');

export default function RouteSuggestScreen({ navigation }: any) {
  const [destination, setDestination] = useState('');
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
  };

  const handleSuggest = async () => {
    if (!userLocation || !destination) {
      Alert.alert('Please provide both your location and destination.');
      return;
    }

    let destLoc: LatLng | null = null;

    // Try to parse as coordinates
    const [lat, lon] = destination.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lon)) {
      destLoc = { lat, lon };
    } else {
      // Use Nominatim to geocode the place name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          destLoc = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        } else {
          Alert.alert('Destination not found', 'Please enter a valid place name or address.');
          return;
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to geocode destination.');
        return;
      }
    }

    // Build shapes object for suggestRoutes
    const shapes: Record<string, LatLng[]> = {};
    Object.entries(shapesWithNames).forEach(([shape_id, obj]) => {
      shapes[shape_id] = obj.shape;
    });
    const suggestions = suggestRoutes(userLocation, destLoc, shapes);
    // Attach route names to suggestions
    const suggestionsWithNames = suggestions.map((s: any) => ({
      ...s,
      route_short_name: shapesWithNames[s.shape_id]?.route_short_name,
      route_long_name: shapesWithNames[s.shape_id]?.route_long_name,
    }));
    navigation.navigate('Results', { suggestions: suggestionsWithNames, userLocation, destLoc });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Step 1: Get your current location</Text>
      <Button title={userLocation ? "Location Set" : "Get My Location"} onPress={handleGetLocation} color={userLocation ? '#0a662e' : undefined} />
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
      <Button title="Suggest Routes" onPress={handleSuggest} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 4, color: '#0a662e' },
  input: { borderWidth: 1, width: 220, margin: 10, padding: 8, borderRadius: 8, backgroundColor: '#f9f9f9', borderColor: '#0a662e' },
  locationText: { color: '#333', marginBottom: 8 },
});