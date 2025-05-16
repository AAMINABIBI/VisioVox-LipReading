

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
      },
    },
  },
};