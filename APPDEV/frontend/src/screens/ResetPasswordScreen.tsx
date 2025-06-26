import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

const BACKEND_URL = 'http://localhost:4000'; // Change if needed

type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

type Props = {
  navigation: any;
  route: ResetPasswordScreenRouteProp;
};

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const navRoute = useRoute();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to get token from route params (deep link)
    if (route?.params?.token) {
      setToken(route.params.token);
    } else if ((navRoute as any)?.params?.token) {
      setToken((navRoute as any).params.token);
    }
  }, [route, navRoute]);

  const handleResetPassword = async () => {
    if (!token) {
      Alert.alert('Error', 'Reset token is missing.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Password reset successful. You can now log in.', [
          { text: 'OK', onPress: () => navigation.navigate('LoginSignup') }
        ]);
      } else {
        Alert.alert('Error', data.message ?? 'Could not reset password.');
      }
    } catch (error) {
      // Optionally handle or log the error, or remove the catch if not needed
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Reset Token"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Button title={loading ? 'Resetting...' : 'Reset Password'} onPress={handleResetPassword} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#0a662e',
  },
  input: {
    width: 280,
    height: 48,
    borderColor: '#0a662e',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
});

export default ResetPasswordScreen;
