import "dotenv/config";

export default ({ config }) => ({
  ...config,

  name: "Ungal Vazhikatti",
  slug: "vazhikatti",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",

  icon: "./assets/icon.png",

  // Deep linking scheme
  scheme: "vazhikatti",

  // Disable new architecture (FIXES PlatformConstants error)
  newArchEnabled: false,

  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },

  ios: {
    bundleIdentifier: "com.vazhikatti.app",
    supportsTablet: true,
    buildNumber: "1"
  },

  android: {
    package: "com.vazhikatti.app",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: [
      "CAMERA",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "RECORD_AUDIO"
    ]
  },

  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro"
  },

  plugins: [
    "expo-asset",
    [
      "expo-camera",
      {
        cameraPermission: "Allow Ungal Vazhikatti to access your camera",
        microphonePermission: "Allow Ungal Vazhikatti to access your microphone",
        recordAudioAndroid: true
      }
    ]
  ],

  extra: {
    API_BASE_URL: process.env.EXPO_PUBLIC_BACKEND_URL,
    FRONTEND_URL: process.env.EXPO_PUBLIC_FRONTEND_URL,
    ENV: "development",
    eas: {
      projectId: "18c54572-4af3-47c4-ace7-a858e3deee46"
    }
  }
});

