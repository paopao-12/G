import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

const AdminUsersScreen = () => {
  const [users, setUsers] = useState<Array<{ id: number; email: string; role: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getAllUsers();
        setUsers(data || []);
      } catch (err) {
        // Optionally handle or log the error, or remove the catch if not needed
        Alert.alert('Error', 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0a662e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Users</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No users found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  email: { fontSize: 16 },
  role: { fontSize: 16, fontWeight: 'bold', color: '#0a662e' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AdminUsersScreen;
