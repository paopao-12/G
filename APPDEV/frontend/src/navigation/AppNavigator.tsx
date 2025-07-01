import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
//import LoginSignupScreen from '../screens/LoginSignupScreen';
import HomeScreen from '../screens/HomeScreen';
//import RouteSuggestScreen from '../screens/RouteSuggestScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import RouteDetailsScreen from '../screens/RouteDetailsScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  // Debug: log when AppNavigator renders
  console.log('AppNavigator rendered');
  return (
    <NavigationContainer
      onStateChange={state => {
        const currentRoute = state?.routes[state.index]?.name;
        console.log('Current route:', currentRoute);
      }}
    >
      <Stack.Navigator 
        initialRouteName="Splash"
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
          name="Splash" 
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        {/* <Stack.Screen 
          name="LoginSignup" 
          component={LoginSignupScreen}
          options={{ headerShown: false }}
        /> */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        {/* <Stack.Screen 
          name="RouteSuggest" 
          component={RouteSuggestScreen}
          options={{
            title: 'Suggest Route',
          }}
        /> */}
        <Stack.Screen 
          name="Results" 
          component={ResultsScreen}
          options={{ headerShown: false }}
          
        />
        <Stack.Screen 
          name="RouteDetails" 
          component={RouteDetailsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}