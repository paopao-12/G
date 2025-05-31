import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteSuggestion, PassengerType, LocationOption } from '../types';

type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;
type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;

type Props = {
  route: ResultsScreenRouteProp;
  navigation: ResultsScreenNavigationProp;
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

      {suggestedRoutes && suggestedRoutes.length > 0 ? (
        suggestedRoutes.map((route) => (
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
            
            <View style={{ backgroundColor: '#FFEB3B', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 8 }}>
              <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 15 }}>{route.routeName}</Text>
            </View>
            
            <Text style={styles.routeText}>
              {route.from.name} → {route.to.name}
            </Text>
            
            <View style={styles.routeInfoRow}>
              <Text style={styles.fareText}>
                ₱ {getDiscountedFare(route.fare, passengerType).toFixed(2)}
              </Text>
              <Text style={styles.timeText}>{Math.round(route.estimatedTime)} min</Text>
            </View>

            <View style={styles.stopsContainer}>
              <Text style={styles.stopsTitle}>Stops:</Text>
              {route.stops.map((stop: LocationOption, index: number) => (
                <Text key={stop.id} style={styles.stopText}>
                  {index + 1}. {stop.name}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.noRoutesContainer}>
          <MaterialIcons name="error-outline" size={48} color="#666" />
          <Text style={styles.noRoutesText}>No routes found</Text>
          <Text style={styles.noRoutesSubtext}>
            Try selecting different origin and destination points
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 15,
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
    marginBottom: 10,
  },
  routeType: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  routeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  fareText: {
    color: '#ff8800',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stopsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  stopText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  noRoutesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
  },
  noRoutesText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  noRoutesSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
}); 