import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useNavigation, StackActions } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.dispatch(StackActions.replace('Home'));
    }, 3000); // 3 seconds splash
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/g-logo.png')} // Adjust the path to your logo
        style={styles.logo}
        resizeMode="contain" // Adjust the resize mode as needed
      />
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
  logo: {
    width: 200, // Set the width of the logo
    height: 200, // Set the height of the logo
  },
});

export default SplashScreen;
