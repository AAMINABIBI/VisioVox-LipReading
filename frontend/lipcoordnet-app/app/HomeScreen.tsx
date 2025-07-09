"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from "react-native"
import { useNavigation, type NavigationProp } from "@react-navigation/native"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated"
import Icon from "react-native-vector-icons/FontAwesome"
import { LinearGradient } from "expo-linear-gradient"

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

export type TabParamList = {
  Home: undefined
  Upload: undefined
  Profile: undefined
  Settings: undefined
}

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<TabParamList>>()
  const { user } = useAuth()
  const { currentTheme } = useTheme()
  const [loading, setLoading] = useState(false)

  const welcomeOpacity = useSharedValue(0)
  const buttonOpacity = useSharedValue(0)
  const footerOpacity = useSharedValue(0)

  useEffect(() => {
    welcomeOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    buttonOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })
    footerOpacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
  }, [])

  const animatedWelcomeStyle = useAnimatedStyle(() => {
    return {
      opacity: welcomeOpacity.value,
      transform: [
        {
          translateY: withTiming(welcomeOpacity.value * 10, { duration: 800 }),
        },
      ],
    }
  })

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [
        {
          scale: withTiming(buttonOpacity.value * 1.05, { duration: 1000 }),
        },
      ],
    }
  })

  const animatedFooterStyle = useAnimatedStyle(() => {
    return {
      opacity: footerOpacity.value,
    }
  })

  const handleLipReading = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigation.navigate("Upload")
    }, 800)
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor || "#F3F4F6" }]}>
      <Animated.Text style={[styles.greeting, { color: currentTheme.textColor || "#1E3A8A" }, animatedWelcomeStyle]}>
        Welcome, {user?.displayName || user?.email || "Guest"}!
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { color: currentTheme.textColor + "80" || "#6B7280" }, animatedWelcomeStyle]}>
        Experience AI-driven lip reading
      </Animated.Text>

      <View style={styles.bannerContainer}>
        <LinearGradient colors={["#1E3A8A", "#60A5FA"]} style={styles.bannerGradient}>
          <Icon name="video-camera" size={48} color="#FFFFFF" />
          <Text style={styles.bannerText}>LipCoordNet</Text>
          <Text style={styles.bannerSubText}>Seamless Lip Reading AI</Text>
        </LinearGradient>
      </View>

      <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
        <TouchableOpacity style={styles.iconButtonWrapper} onPress={handleLipReading} disabled={loading}>
          <LinearGradient colors={["#1E40AF", "#3B82F6"]} style={styles.iconButton}>
            <Icon name="microphone" size={30} color="#FFFFFF" />
          </LinearGradient>
          <View style={[styles.buttonLabelContainer, { backgroundColor: currentTheme.cardBackground || "#FFFFFF" }]}>
            <Text style={[styles.buttonLabel, { color: currentTheme.textColor || "#1E3A8A" }]}>Start Lip Reading</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text style={[styles.footerText, { color: currentTheme.textColor + "B3" || "#6B7280" }, animatedFooterStyle]}>
        LipCoordNet: Empowering communication with AI
      </Animated.Text>

      {loading && <ActivityIndicator size="large" color={currentTheme.primaryColor || "#3B82F6"} style={styles.loader} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 30,
  },
  bannerContainer: {
    width: "100%",
    marginBottom: 36,
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bannerGradient: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  bannerSubText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.9,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  iconButtonWrapper: {
    alignItems: "center",
    width: "45%",
  },
  iconButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonLabelContainer: {
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "400",
    textAlign: "center",
    opacity: 0.7,
  },
  loader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
})

export default HomeScreen