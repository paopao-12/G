import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { RouteSuggestion, PassengerType } from '../types';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  route: RouteProp<RootStackParamList, 'Results'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
};

export const ResultsScreen = ({ route, navigation }: Props) => {
  const { origin, destination, passengerType, suggestedRoutes } = route.params;

  const getTransportIcon = (type: 'jeepney'): keyof typeof MaterialIcons.glyphMap => {
    return 'directions-bus-filled';
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suggested Routes</Text>
      </View>

      {suggestedRoutes.map((route) => (
        <TouchableOpacity
          key={route.id}
          style={styles.routeCard}
          onPress={() => navigation.navigate('RouteDetails', { route, passengerType })}
        >
          <View style={styles.routeHeader}>
            <MaterialIcons
              name={getTransportIcon(route.type)}
              size={24}
              color="#007AFF"
            />
            <Text style={styles.routeType}>
              {route.type.charAt(0).toUpperCase() + route.type.slice(1)}
            </Text>
          </View>
          
          <View style={styles.routeNameContainer}>
            <Text style={styles.routeName}>{route.routeName}</Text>
          </View>
          
          <Text style={styles.routeText}>
            {route.from.name} → {route.to.name}
          </Text>
          
          <View style={styles.routeInfoRow}>
            <Text style={styles.fareText}>
              ₱ {getDiscountedFare(route.estimatedFare, passengerType).toFixed(2)}
            </Text>
            <Text style={styles.timeText}>{Math.round(route.duration)} min</Text>
          </View>

          <View style={styles.stopsContainer}>
            <Text style={styles.stopsTitle}>Stops:</Text>
            {route.stops.map((stop, index) => (
              <Text key={stop.id} style={styles.stopText}>
                {index + 1}. {stop.name}
              </Text>
            ))}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  routeCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  routeNameContainer: {
    backgroundColor: '#FFEB3B',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  routeName: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
  },
  routeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  routeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fareText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  timeText: {
    fontSize: 16,
    color: '#666',
  },
  stopsContainer: {
    marginTop: 8,
  },
  stopsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stopText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
}); 