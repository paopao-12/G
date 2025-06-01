import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api, { Route, Stop, FareInfo } from '../services/api';
import { RootStackParamList } from '../types/navigation';
import { RouteSuggestion, LocationOption, PassengerType } from '../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [originStop, setOriginStop] = useState<number | null>(null);
  const [destinationStop, setDestinationStop] = useState<number | null>(null);
  const [passengerType, setPassengerType] = useState<PassengerType>('regular');
  const [fareInfo, setFareInfo] = useState<FareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesData, stopsData] = await Promise.all([
        api.getRoutes(),
        api.getStops()
      ]);
      setRoutes(routesData);
      setStops(stopsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load routes and stops');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateFare = async () => {
    if (!originStop || !destinationStop) {
      Alert.alert('Error', 'Please select both origin and destination stops');
      return;
    }

    try {
      setCalculating(true);
      const fareData = await api.getFare(originStop, destinationStop);
      setFareInfo(fareData);

      // Create a route suggestion
      const route = routes.find(r => r.id === selectedRoute);
      if (route) {
        const originStopData = route.stops.find(s => s.stop_id === originStop);
        const destinationStopData = route.stops.find(s => s.stop_id === destinationStop);
        
        if (originStopData && destinationStopData) {
          const from: LocationOption = {
            id: originStopData.stop_id.toString(),
            name: originStopData.stop_name,
            latitude: originStopData.latitude,
            longitude: originStopData.longitude,
          };

          const to: LocationOption = {
            id: destinationStopData.stop_id.toString(),
            name: destinationStopData.stop_name,
            latitude: destinationStopData.latitude,
            longitude: destinationStopData.longitude,
          };

          const suggestion: RouteSuggestion = {
            id: `${route.id}-${originStop}-${destinationStop}`,
            from,
            to,
            distance: fareData.distance_km * 1000, // Convert to meters
            estimatedTime: 30, // Default duration in minutes
            fare: fareData.fare,
            type: 'jeepney',
            stops: route.stops.map(stop => ({
              id: stop.stop_id.toString(),
              name: stop.stop_name,
              latitude: stop.latitude,
              longitude: stop.longitude,
            })),
            routeName: route.name,
          };

          // Navigate to Results screen
          navigation.navigate('Results', {
            origin: originStopData.stop_name,
            destination: destinationStopData.stop_name,
            passengerType,
            suggestedRoutes: [suggestion],
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to calculate fare');
      console.error(error);
    } finally {
      setCalculating(false);
    }
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Route</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedRoute}
            onValueChange={(value) => {
              setSelectedRoute(value);
              setOriginStop(null);
              setDestinationStop(null);
              setFareInfo(null);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select a route" value={null} />
            {routes.map((route) => (
              <Picker.Item
                key={route.id}
                label={route.name}
                value={route.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Stops</Text>
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Origin Stop</Text>
          <Picker
            selectedValue={originStop}
            onValueChange={setOriginStop}
            style={styles.picker}
            enabled={!!selectedRoute}
          >
            <Picker.Item label="Select origin stop" value={null} />
            {selectedRoute && routes
              .find(r => r.id === selectedRoute)
              ?.stops.map((stop) => (
                <Picker.Item
                  key={stop.stop_id}
                  label={stop.stop_name}
                  value={stop.stop_id}
                />
              ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Destination Stop</Text>
          <Picker
            selectedValue={destinationStop}
            onValueChange={setDestinationStop}
            style={styles.picker}
            enabled={!!selectedRoute}
          >
            <Picker.Item label="Select destination stop" value={null} />
            {selectedRoute && routes
              .find(r => r.id === selectedRoute)
              ?.stops.map((stop) => (
                <Picker.Item
                  key={stop.stop_id}
                  label={stop.stop_name}
                  value={stop.stop_id}
                />
              ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Passenger Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={passengerType}
            onValueChange={(value) => setPassengerType(value as PassengerType)}
            style={styles.picker}
          >
            <Picker.Item label="Regular" value="regular" />
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Senior Citizen" value="senior" />
            <Picker.Item label="PWD" value="pwd" />
          </Picker>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCalculateFare}
        disabled={calculating || !originStop || !destinationStop}
      >
        {calculating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Calculate Fare</Text>
        )}
      </TouchableOpacity>

      {fareInfo && (
        <View style={styles.fareInfo}>
          <Text style={styles.fareTitle}>Fare Information</Text>
          <Text style={styles.fareText}>Route: {fareInfo.route_name}</Text>
          <Text style={styles.fareText}>Distance: {fareInfo.distance_km.toFixed(2)} km</Text>
          <Text style={styles.fareText}>
            Base Fare: ₱{fareInfo.fare.toFixed(2)}
          </Text>
          <Text style={styles.fareText}>
            Discounted Fare: ₱{getDiscountedFare(fareInfo.fare, passengerType).toFixed(2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  picker: {
    height: 50,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fareInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fareTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  fareText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
});

export default HomeScreen; 