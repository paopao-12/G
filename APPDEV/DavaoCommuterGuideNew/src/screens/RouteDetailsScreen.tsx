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
import { RouteSuggestion, PassengerType } from '../types';

type RouteDetailsScreenRouteProp = RouteProp<RootStackParamList, 'RouteDetails'>;
type RouteDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RouteDetails'>;

type Props = {
  route: RouteDetailsScreenRouteProp;
  navigation: RouteDetailsScreenNavigationProp;
};

export const RouteDetailsScreen = ({ route, navigation }: Props) => {
  const { route: routeData, passengerType } = route.params;

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
        <Text style={styles.headerTitle}>Route Details</Text>
      </View>

      <View style={{ backgroundColor: '#FFEB3B', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 12 }}>
        <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>{routeData.routeName}</Text>
      </View>

      <View style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <MaterialIcons
            name={getTransportIcon(routeData.type)}
            size={24}
            color="#007AFF"
          />
          <Text style={styles.routeType}>
            {routeData.type.charAt(0).toUpperCase() + routeData.type.slice(1)}
          </Text>
        </View>

        <View style={styles.routeInfo}>
          <View style={styles.routePoint}>
            <MaterialIcons name="trip-origin" size={24} color="#4CAF50" />
            <Text style={styles.routePointText}>{routeData.from.name}</Text>
          </View>
          
          <View style={styles.routeLine} />
          
          <View style={styles.routePoint}>
            <MaterialIcons name="place" size={24} color="#F44336" />
            <Text style={styles.routePointText}>{routeData.to.name}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MaterialIcons name="attach-money" size={20} color="#FF9800" />
            <Text style={styles.fareText}>
              ₱ {getDiscountedFare(routeData.fare, passengerType).toFixed(2)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="access-time" size={20} color="#2196F3" />
            <Text style={styles.timeText}>{Math.round(routeData.estimatedTime)} min</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="straighten" size={20} color="#4CAF50" />
            <Text style={styles.distanceText}>{routeData.distance.toFixed(1)} km</Text>
          </View>
        </View>

        <View style={styles.stopsContainer}>
          <Text style={styles.stopsTitle}>Stops along the route:</Text>
          {routeData.stops.map((stop, index) => (
            <View key={stop.id} style={styles.stopItem}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stopName}>{stop.name}</Text>
            </View>
          ))}
        </View>
      </View>
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
    margin: 15,
    padding: 20,
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
    marginBottom: 20,
  },
  routeType: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  routeInfo: {
    marginBottom: 20,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  routePointText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#ddd',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareText: {
    marginLeft: 5,
    color: '#FF9800',
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeText: {
    marginLeft: 5,
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 16,
  },
  distanceText: {
    marginLeft: 5,
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stopsContainer: {
    marginTop: 10,
  },
  stopsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stopNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stopName: {
    fontSize: 16,
    color: '#333',
  },
}); 