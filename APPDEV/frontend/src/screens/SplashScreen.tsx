import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, StackActions } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.dispatch(StackActions.replace('LoginSignup'));
    }, 3000); // 3 seconds splash
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
    textShadowColor: '#00000066',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    textAlign: 'center',
    fontFamily: 'sans-serif-condensed',
  },
});

export default SplashScreen;
