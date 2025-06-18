import 'dotenv/config'; // Load environment variables from .env

export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
      name: "LipCoordNet-app",
      slug: "lipcoordnet-app",
      scheme: "lipcoordnetapp", // Recommended for deep linking
      version: "1.0.0",
      orientation: "portrait", // From Snippet 2
      icon: "./assets/images/icon.png", // From Snippet 2
      userInterfaceStyle: "automatic", // From Snippet 2
      splash: {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      }, // From Snippet 2
      assetBundlePatterns: ["**/*"], // From Snippet 2
      plugins: ["expo-router", "expo-video"], // From Snippet 2
      extra: {
        firebase: {
          // Use environment variables for sensitive Firebase credentials
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-firebase-api-key",
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-firebase-auth-domain",
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-firebase-project-id",
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-firebase-storage-bucket",
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-firebase-messaging-sender-id",
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-firebase-app-id",
          measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "your-firebase-measurement-id",
        },
        eas: {
          // EAS Project ID, replace with your actual ID if different
          projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "cf89d750-7ef8-4861-93c0-278edcd416ae",
        },
      },
      android: {
        package: "com.lipcoordnet.app", // Ensure this is the correct package name for your app
        versionCode: 1, // Increment this for new Android releases
        googleServicesFile: "./google-services.json", // Path to your google-services.json file
        adaptiveIcon: {
          foregroundImage: "./assets/images/adaptive-icon.png",
          backgroundColor: "#ffffff",
        },
      },
      ios: {
        bundleIdentifier: "com.lipcoordnet.app", // Ensure this is the correct bundle identifier
        supportsTablet: true,
        // For iOS Google Services, you typically link GoogleService-Info.plist through Xcode
        // or a specific plugin, not directly via googleServicesFile here.
      },
      web: {
        favicon: "./assets/favicon.png",
      },
    },
  };
};
