import { initializeApp } from "firebase/app"
import { initializeAuth, getReactNativePersistence } from "firebase/auth"
import AsyncStorage from "@react-native-async-storage/async-storage"

const firebaseConfig = {
  apiKey: "AIzaSyDpm_NtQdjGoXDEMkjj6xZVh2-TRefVqZk",
  authDomain: "visiovox-90dfb.firebaseapp.com",
  projectId: "visiovox-90dfb",
  storageBucket: "visiovox-90dfb.firebasestorage.app",
  messagingSenderId: "619681158693",
  appId: "1:619681158693:web:2886a82db1d2e80583d1cc",
  measurementId: "G-DW0DGYWDGE",
}

const app = initializeApp(firebaseConfig)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
})

export { app, auth }