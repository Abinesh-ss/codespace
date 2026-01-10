"use client";

import { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Layout from "@/components/Layout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { 
  MaterialIcons,
  FontAwesome5,
  Feather,
  Entypo,
  FontAwesome 
} from "@expo/vector-icons";

export default function NavigateClient() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [destination, setDestination] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await AsyncStorage.getItem("isAuthenticated");
      if (auth !== "true") {
        router.replace("/login");
        return;
      }
      setIsAuthenticated(true);

      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          name: "Main Entrance",
          floor: "Level 1",
          coordinates: { x: loc.coords.latitude, y: loc.coords.longitude },
        });
      } else {
        setCurrentLocation({
          name: "Main Entrance",
          floor: "Level 1",
          coordinates: { x: 0, y: 0 },
        });
      }
    };
    checkAuth();
  }, []);

  const destinations = [
    { id: 1, name: "Emergency Room", floor: "Level 1", category: "Medical", estimatedTime: 3, distance: 85 },
    { id: 2, name: "Radiology Department", floor: "Level 2", category: "Medical", estimatedTime: 5, distance: 120 },
    { id: 3, name: "Pharmacy", floor: "Level 1", category: "Service", estimatedTime: 2, distance: 45 },
    { id: 4, name: "Cafeteria", floor: "Level 3", category: "Service", estimatedTime: 4, distance: 95 },
  ];

  const navigationSteps = [
    { instruction: "Head straight towards the main reception", direction: "straight", distance: 15, icon: <MaterialIcons name="arrow-right" size={20} /> },
    { instruction: "Turn left at the information desk", direction: "left", distance: 10, icon: <MaterialIcons name="arrow-left" size={20} /> },
    { instruction: "Continue straight down the corridor", direction: "straight", distance: 25, icon: <MaterialIcons name="arrow-right" size={20} /> },
    { instruction: "Take the elevator to Level 2", direction: "up", distance: 0, icon: <Entypo name="chevron-up" size={20} /> },
    { instruction: "Turn right after exiting the elevator", direction: "right", distance: 5, icon: <MaterialIcons name="arrow-right" size={20} /> },
    { instruction: "Radiology Department will be on your left", direction: "left", distance: 10, icon: <MaterialIcons name="arrow-left" size={20} /> },
  ];

  const quickDestinations = [
    { name: "Emergency Room", icon: <FontAwesome5 name="hospital" size={16} color="#fff" />, color: "#EF4444" },
    { name: "Restroom", icon: <FontAwesome name="male" size={16} color="#fff" />, color: "#3B82F6" },
    { name: "Elevator", icon: <Entypo name="arrow-up" size={16} color="#fff" />, color: "#10B981" },
    { name: "Accessible Route", icon: <Feather name="navigation" size={16} color="#fff" />, color: "#8B5CF6" },
  ];

  const startNavigation = (dest: string) => {
    setDestination(dest);
    setIsNavigating(true);
    setStepIndex(0);
    setSelectedRoute({
      destination: dest,
      totalTime: 5,
      totalDistance: 85,
      steps: navigationSteps,
    });
  };

  const nextStep = () => {
    if (stepIndex < navigationSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setIsNavigating(false);
      setDestination("");
      setSelectedRoute(null);
      setStepIndex(0);
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  if (!isAuthenticated || !currentLocation) return (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );

  return (
    <Layout showSidebar>
      <ScrollView className="p-6 space-y-6">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold text-gray-900">Live Navigation</Text>
            <Text className="text-gray-600 mt-1">Real-time indoor guidance</Text>
          </View>
          <View className="flex-row items-center space-x-3">
            <View className="flex-row items-center px-3 py-2 bg-green-100 rounded-lg">
              <CheckCircleIcon />
              <Text className="ml-2 text-green-800">GPS Active</Text>
            </View>
          </View>
        </View>

        <View className="space-y-6">
          {!isNavigating ? (
            <View className="bg-white rounded-xl border p-6 space-y-4">
              <Text className="text-lg font-semibold">Where would you like to go?</Text>

              <View className="relative">
                <TextInput
                  className="w-full pl-10 pr-12 py-3 border rounded-lg"
                  placeholder="Search destination..."
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>

              <View className="flex-row flex-wrap justify-between">
                {quickDestinations.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => startNavigation(d.name)}
                    style={{ backgroundColor: d.color, padding: 12, borderRadius: 12, margin: 4, flexDirection: "row", alignItems: "center" }}
                  >
                    {d.icon}
                    <Text className="ml-2 text-white">{d.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="space-y-2">
                {destinations.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => startNavigation(d.name)}
                    className="w-full p-4 bg-gray-50 rounded-lg"
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-3">
                        <MaterialIcons name="place" size={20} color="#6366F1" />
                        <View>
                          <Text className="font-medium">{d.name}</Text>
                          <Text className="text-sm text-gray-500">{d.floor}</Text>
                        </View>
                      </View>
                      <Text className="text-sm text-gray-600">{d.estimatedTime} min • {d.distance}m</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View className="bg-white rounded-xl border p-6 space-y-4">
              <Text className="text-lg font-semibold">
                Navigating to <Text className="text-indigo-600">{selectedRoute.destination}</Text>
              </Text>

              <View className="bg-indigo-50 rounded-xl p-4 flex-row items-center gap-4">
                {navigationSteps[stepIndex].icon}
                <View>
                  <Text className="font-medium">{navigationSteps[stepIndex].instruction}</Text>
                  {navigationSteps[stepIndex].distance > 0 && <Text>{navigationSteps[stepIndex].distance} meters</Text>}
                </View>
              </View>

              <View className="flex-row justify-between">
                <TouchableOpacity onPress={prevStep} disabled={stepIndex === 0} style={{ padding: 10, borderWidth: 1, borderRadius: 8, opacity: stepIndex === 0 ? 0.5 : 1 }}>
                  <Text>Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={nextStep} style={{ padding: 10, backgroundColor: "#6366F1", borderRadius: 8 }}>
                  <Text className="text-white">{stepIndex === navigationSteps.length - 1 ? "Complete" : "Next"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Sidebar (current location + emergency) */}
          <View className="space-y-4">
            <View className="bg-white rounded-xl border p-4">
              <Text className="font-semibold mb-2">Current Location</Text>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <View>
                  <Text className="font-medium">{currentLocation?.name}</Text>
                  <Text className="text-sm text-gray-500">{currentLocation?.floor}</Text>
                </View>
              </View>
            </View>

            <View className="bg-red-50 border border-red-200 rounded-xl p-4">
              <Text className="font-semibold text-red-700 mb-1 flex-row items-center gap-2">
                <MaterialIcons name="error-outline" size={20} color="#DC2626" />
                Emergency
              </Text>
              <Text className="text-sm text-red-600">Nearest exit: 25m ahead</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
}

// Dummy icon component for header
function CheckCircleIcon() {
  return <MaterialIcons name="check-circle" size={16} color="#10B981" />;
}

