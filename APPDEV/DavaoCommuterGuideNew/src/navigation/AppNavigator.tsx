import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import RouteDetailsScreen from '../screens/RouteDetailsScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            title: 'Davao Commuter Guide',
          }}
        />
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen}
          options={{
            title: 'Route Suggestions',
          }}
        />
        <Stack.Screen 
          name="RouteDetails" 
          component={RouteDetailsScreen}
          options={{
            title: 'Route Details',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 