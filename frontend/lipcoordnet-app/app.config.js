<<<<<<< HEAD
import 'dotenv/config'; // Load environment variables from .env

export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
      name: "LipCoordNet-app",
      slug: "lipcoordnet-app",
      scheme: "lipcoordnetapp",
      version: "1.0.0",
      extra: {
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "default-api-key",
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "default-auth-domain",
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "default-project-id",
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "default-storage-bucket",
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "default-sender-id",
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "default-app-id",
          measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "default-measurement-id",
        },
        eas: {
          projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "cf89d750-7ef8-4861-93c0-278edcd416ae",
        },
      },
      android: {
        package: "com.lipcoordnet.app",
        versionCode: 1,
        googleServicesFile: "./google-services.json",
      },
      ios: {
        bundleIdentifier: "com.lipcoordnet.app",
        // Removed googleServicesFile to avoid parsing error
=======


export default {
  expo: {
    name: "lipcoordnet-app",
    slug: "lipcoordnet-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.yourcompany.lipcoordnetapp",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-router", "expo-video"],
    extra: {
      firebase: {
        apiKey: "AIzaSyDpm_NtQdjGoXDEMkjj6xZVh2-TRefVqZk",
        authDomain: "visiovox-90dfb.firebaseapp.com",
        projectId: "visiovox-90dfb",
        storageBucket: "visiovox-90dfb.firebasestorage.app",
        messagingSenderId: "619681158693",
        appId: "1:619681158693:web:2886a82db1d2e80583d1cc",
        measurementId: "G-DW0DGYWDGE",
>>>>>>> parent of d642d9f (updates commit)
      },
    },
  },
};