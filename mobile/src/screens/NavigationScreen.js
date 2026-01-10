import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { startSensorTracking, qrCodeCorrection } from "../lib/sensors/deadReckoning";
import { fetchPath } from "../lib/api/navigation";

export default function NavigationScreen({ route }) {
  const { hospitalId, initialStartNodeId, floorId, userEmail } = route.params;

  const [position, setPosition] = useState({ x: 0, y: 0, floor: parseInt(floorId || 1) });
  const [path, setPath] = useState([]);

  useEffect(() => {
    qrCodeCorrection(position.x, position.y, position.floor);

    const cleanup = startSensorTracking((newPosition) => setPosition(newPosition));

    fetchPath(hospitalId, initialStartNodeId, "destinationNode", userEmail)
      .then((res) => setPath(res.path || []))
      .catch((err) => Alert.alert("Access Denied", err.message));

    return cleanup;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>HospiNav - Real-Time Navigation</Text>

      <View style={styles.mapArea}>
        <View style={styles.dot} />
        <Text style={styles.label}>You Are Here</Text>
        <Text style={styles.coords}>X: {position.x.toFixed(2)}m</Text>
        <Text style={styles.coords}>Y: {position.y.toFixed(2)}m</Text>
        <Text style={styles.coords}>Floor: {position.floor}</Text>
        <Text style={styles.coords}>Heading: {position.heading?.toFixed(0)}°</Text>
      </View>

      <View style={styles.instructions}>
        {path.length ? (
          path.map((step, i) => (
            <Text key={i} style={styles.instructionText}>
              {step}
            </Text>
          ))
        ) : (
          <Text style={styles.instructionText}>📍 No path available</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f5f5" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  mapArea: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#3b82f6", marginBottom: 10 },
  label: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  coords: { fontSize: 14, color: "#666", marginBottom: 5 },
  instructions: { marginTop: 20, padding: 15, backgroundColor: "#e6ffe6", borderRadius: 10 },
  instructionText: { fontSize: 16, marginBottom: 10 },
});

