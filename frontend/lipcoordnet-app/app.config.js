import 'dotenv/config'; // Load environment variables from .env

export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
      name: "LipCoordNet-app",
      slug: "lipcoordnet-app",
      scheme: "lipcoordnetapp", // Add this line
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
        auth: {
          google: {
            expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || "619681158693-2659po4jq9kqo2ht7qgglnnfu4jubsjl.apps.googleusercontent.com",
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "YOUR_IOS_CLIENT_ID",
            androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "619681158693-v2o5b2pkk368ouedb6iqoml52cf6319t.apps.googleusercontent.com",
          },
        },
        eas: {
          projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || "cf89d750-7ef8-4861-93c0-278edcd416ae",
        },
      },
      android: {
        package: "host.exp.exponent",
        googleServicesFile: "./google-services.json",
      },
      ios: {
        bundleIdentifier: "host.exp.exponent",
        googleServicesFile: "./GoogleService-Info.plist",
      },
    },
  };
};