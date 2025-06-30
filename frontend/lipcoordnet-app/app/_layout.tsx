"use client"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { View, ActivityIndicator } from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"

// Context Providers
import { AuthProvider, useAuth } from "../contexts/AuthContext"
import { ThemeProvider, useTheme } from "../contexts/ThemeContext"

// Screens
import OnboardingScreen from "./OnboardingScreen"
import LoginScreen from "./LoginScreen"
import SignupScreen from "./SignupSCreen"
import HomeScreen from "./HomeScreen"
import UploadScreen from "./UploadScreen"
import ResultsScreen from "./ResultsScreen"
import OutputSelectionScreen from "./OutputSelectionScreen"
import ProfileScreen from "./ProfileScreen"
import SettingsScreen from "./SettingsScreen"

// Navigation Types
export type RootStackParamList = {
  Onboarding: undefined
  Auth: undefined
  Main: undefined
  Upload: undefined
  Results: {
    result: string
    outputType: string
    audioUri?: string
    videoUri?: string
  }
  OutputSelection: {
    videoUri?: string
    prediction?: string
    audioUri?: string
  }
}

export type AuthStackParamList = {
  login: undefined
  signup: undefined
}

export type TabParamList = {
  Home: undefined
  Upload: undefined
  Profile: undefined
  Settings: undefined
}

const Stack = createStackNavigator<RootStackParamList>()
const AuthStack = createStackNavigator<AuthStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

// Loading Screen Component
function LoadingScreen() {
  const { currentTheme } = useTheme()

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: currentTheme.backgroundColor,
      }}
    >
      <ActivityIndicator size="large" color={currentTheme.primaryColor} />
    </View>
  )
}

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="login" component={LoginScreen} />
      <AuthStack.Screen name="signup" component={SignupScreen} />
    </AuthStack.Navigator>
  )
}

// Tab Navigator
function TabNavigator() {
  const { currentTheme } = useTheme()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          switch (route.name) {
            case "Home":
              iconName = "home"
              break
            case "Upload":
              iconName = "cloud-upload"
              break
            case "Profile":
              iconName = "person"
              break
            case "Settings":
              iconName = "settings"
              break
            default:
              iconName = "circle"
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: currentTheme.primaryColor,
        tabBarInactiveTintColor: currentTheme.textColor + "80",
        tabBarStyle: {
          backgroundColor: currentTheme.cardBackground,
          borderTopColor: currentTheme.primaryColor + "20",
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

// Main App Navigator
function AppNavigator() {
  const { user, loading, hasCompletedOnboarding } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          // Show onboarding if not completed
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : user ? (
          // Show main app if user is authenticated
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Results" component={ResultsScreen} />
            <Stack.Screen name="OutputSelection" component={OutputSelectionScreen} />
          </>
        ) : (
          // Show auth screens if user is not authenticated
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// Root Layout Component
export default function Layout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  )
}
