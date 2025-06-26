import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import RouteDetailsScreen from './src/screens/RouteDetailsScreen';
import { RootStackParamList } from './src/types/navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AdminUsersScreen from './src/screens/AdminUsersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['myapp://', 'https://myapp.com', 'http://localhost:4000'], // Add your custom scheme and web URLs
  config: {
    screens: {
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (token: string) => token,
        },
      },
      // ...other screens if you want to support deep links for them
    },
  },
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer linking={linking}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
            headerShown: false, // Hide default header to implement custom header
          contentStyle: {
            backgroundColor: '#f5f5f5',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
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
        <Stack.Screen 
          name="LoginSignup" 
          component={require('./src/screens/LoginSignupScreen').default}
          options={{
            title: 'Login / Signup',
          }}
        />
        <Stack.Screen 
          name="ResetPassword" 
          component={require('./src/screens/ResetPasswordScreen').default}
          options={{
            title: 'Reset Password',
          }}
        />
        <Stack.Screen 
          name="AdminUsers" 
          component={AdminUsersScreen}
          options={{ title: 'All Users' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
