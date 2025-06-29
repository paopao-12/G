import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  TextInput,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://192.168.254.108:4000'; // Update to your backend URL

const LoginSignupScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    AsyncStorage.clear();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('user_role', data.role);
        if (data.token) {
          await AsyncStorage.setItem('jwt_token', data.token);
        }
        (navigation as any).navigate('Home');
      } else {
        Alert.alert('Login Failed', data.message ?? 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error, Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Signup Success', 'You can now log in.');
        setEmail('');
        setPassword('');
      } else {
        Alert.alert('Signup Failed', data.message ?? 'Could not sign up');
      }
    } catch (error) {
      Alert.alert('Error, Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      Alert.alert('Forgot Password', data.message);
      setShowForgot(false);
      setForgotEmail('');
    } catch (error) {
      Alert.alert('Error Could not connect to server');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(prev => !prev)}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Text style={styles.showHideText}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <Button title="Login" onPress={handleLogin} disabled={loading} />
        <Button title="Sign Up" onPress={handleSignup} disabled={loading} />
      </View>

      <View style={{ marginTop: 16 }}>
        <Text
          style={styles.forgotText}
          onPress={() => setShowForgot(true)}
        >
          Forgot Password?
        </Text>
      </View>

      <Modal visible={showForgot} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.forgotModal}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Enter your email:
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Button title="Send Reset Link" onPress={handleForgotPassword} />
            <TouchableOpacity
              onPress={() => setShowForgot(false)}
              style={{ marginTop: 12 }}
            >
              <Text style={{ color: '#0a662e' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#0a662e',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    width: 280,
    height: 48,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  showHideText: {
    color: '#0a662e',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    marginTop: 8,
  },
  forgotText: {
    color: '#0a662e',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotModal: {
    width: 320,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
});

export default LoginSignupScreen;
