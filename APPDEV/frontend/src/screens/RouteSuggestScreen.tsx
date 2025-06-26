import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, Polyline, MapPressEvent, LatLng } from 'react-native-maps';
import axios from 'axios';

type Suggestion = {
  type: string;
  route_id?: string;
  message?: string;
};

export default function RouteSuggestScreen() {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [routeShape, setRouteShape] = useState<LatLng[]>([]);

  // Set marker by tapping map
  const handleMapPress = (e: MapPressEvent) => {
    const coord = e.nativeEvent.coordinate;
    if (!origin) setOrigin(coord);
    else if (!destination) setDestination(coord);
  };

  // Call backend to get route suggestion
  const suggestRoute = async () => {
    if (!origin || !destination) {
      Alert.alert('Please select both origin and destination');
      return;
    }
    try {
      const res = await axios.get('http://192.168.254.106:4000/routes/suggest', {
        params: {
          originLat: origin.latitude,
          originLon: origin.longitude,
          destLat: destination.latitude,
          destLon: destination.longitude,
        },
      });
      setSuggestion(res.data);
      if (res.data.type === 'direct' && res.data.route_id) {
        // Fetch shape for the route
        const shapeRes = await axios.get('http://192.168.254.106:4000/route_shape', {
          params: { route_id: res.data.route_id },
        });
        setRouteShape(shapeRes.data.shape);
      } else {
        setRouteShape([]);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        Alert.alert('Error', err.message);
      } else {
        Alert.alert('Error', 'Unknown error');
      }
    }
  };

  // Reset selection
  const reset = () => {
    setOrigin(null);
    setDestination(null);
    setSuggestion(null);
    setRouteShape([]);
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 7.1907, // Davao default
          longitude: 125.4553,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onPress={handleMapPress}
      >
        {origin && <Marker coordinate={origin} pinColor="green" />}
        {destination && <Marker coordinate={destination} pinColor="red" />}
        {routeShape.length > 0 && (
          <Polyline coordinates={routeShape} strokeColor="#007AFF" strokeWidth={4} />
        )}
      </MapView>
      <View style={styles.panel}>
        <Button title="Suggest Route" onPress={suggestRoute} />
        <Button title="Reset" onPress={reset} color="#888" />
        {suggestion && (
          <Text style={{ marginTop: 10 }}>
            {suggestion.type === 'direct' && suggestion.route_id
              ? `Suggested Route: ${suggestion.route_id}`
              : suggestion.message}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    elevation: 5,
  },
});
