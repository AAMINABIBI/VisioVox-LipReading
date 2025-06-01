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
      },
    },
  };
};