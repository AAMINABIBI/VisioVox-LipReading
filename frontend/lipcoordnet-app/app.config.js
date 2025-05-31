// app.config.js
export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
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
      },
    },
  };
};