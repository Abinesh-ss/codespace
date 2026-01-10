import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import ScanQRScreen from "./src/screens/ScanQRScreen";
import NavigationScreen from "./src/screens/NavigationScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ScanQR">
        <Stack.Screen
          name="ScanQR"
          component={ScanQRScreen}
          options={{ title: "Scan Entrance QR" }}
        />
        <Stack.Screen
          name="Navigation"
          component={NavigationScreen}
          options={{ title: "Navigate" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

