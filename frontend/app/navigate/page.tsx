import { Suspense } from "react";
import NavigateClient from "./NavigateClient";
import { View, Text, ActivityIndicator } from "react-native";

export default function NavigatePage() {
  return (
    <Suspense fallback={
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text>Loading navigation…</Text>
      </View>
    }>
      <NavigateClient />
    </Suspense>
  );
}

