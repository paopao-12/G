import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, StackActions } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.dispatch(StackActions.replace('LoginSignup'));
    }, 2000); // Show splash for 2 seconds
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>G!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a662e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 96,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#0a662e',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 6,
    textAlign: 'center',
  },
});

export default SplashScreen;