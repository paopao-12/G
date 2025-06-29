import React from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';

export function ResultsScreen({ route, navigation }: any) {
  const { suggestions, userLocation, destLoc } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suggested Routes</Text>
      <FlatList
        data={suggestions}
        keyExtractor={item => item.shape_id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>Route: {item.shape_id}</Text>
            <Text>Entry Distance: {item.entryDistance.toFixed(1)} m</Text>
            <Text>Exit Distance: {item.exitDistance.toFixed(1)} m</Text>
            <Button
              title="Details"
              onPress={() => navigation.navigate('RouteDetails', { suggestion: item, userLocation, destLoc })}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  item: { marginBottom: 16, padding: 12, borderWidth: 1, borderRadius: 8 },
});