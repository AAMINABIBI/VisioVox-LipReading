"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from "react-native"
import { useNavigation, type NavigationProp } from "@react-navigation/native"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated"
import Icon from "react-native-vector-icons/FontAwesome"
import { LinearGradient } from "expo-linear-gradient"

type RootStackParamList = {
  Home: undefined
  Upload: undefined
  LipReading: undefined
  SignLanguage: undefined
}

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const { userName } = useAuth()
  const { currentTheme } = useTheme()
  const [loading, setLoading] = useState(false)

  const welcomeOpacity = useSharedValue(0)
  const buttonOpacity = useSharedValue(0)

  useEffect(() => {
    welcomeOpacity.value = withTiming(1, { duration: 1000, easing: Easing.ease })
    buttonOpacity.value = withTiming(1, { duration: 1500, easing: Easing.ease })
  }, [])

  const animatedWelcomeStyle = useAnimatedStyle(() => {
    return {
      opacity: welcomeOpacity.value,
      transform: [
        {
          translateY: welcomeOpacity.value * 20,
        },
      ],
    }
  })

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
    }
  })

  const handleLipReading = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigation.navigate("Upload")
    }, 1500)
  }

  const handleSignLanguage = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // Navigate to sign language screen when available
      console.log("Sign Language feature coming soon!")
    }, 1500)
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Animated.Text style={[styles.greeting, { color: currentTheme.textColor }, animatedWelcomeStyle]}>
        Welcome, {userName}!
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { color: currentTheme.textColor }, animatedWelcomeStyle]}>
        Ready to analyze some lip reading?
      </Animated.Text>

      <View style={styles.bannerContainer}>
        <LinearGradient colors={["#3B82F6", "#8B5CF6"]} style={styles.bannerGradient}>
          <Icon name="video-camera" size={48} color="#FFFFFF" />
          <Text style={styles.bannerText}>AI-Powered Lip Reading</Text>
        </LinearGradient>
      </View>

      <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.iconButtonWrapper} onPress={handleLipReading} disabled={loading}>
            <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.iconButton}>
              <Icon name="microphone" size={32} color="#FFFFFF" />
            </LinearGradient>
            <View style={[styles.buttonLabelContainer, { backgroundColor: currentTheme.secondary }]}>
              <Text style={[styles.buttonLabel, { color: currentTheme.textOnSecondary }]}>Lip Reading</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButtonWrapper} onPress={handleSignLanguage} disabled={loading}>
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.iconButton}>
              <Icon name="hand-paper-o" size={32} color="#FFFFFF" />
            </LinearGradient>
            <View style={[styles.buttonLabelContainer, { backgroundColor: currentTheme.secondary }]}>
              <Text style={[styles.buttonLabel, { color: currentTheme.textOnSecondary }]}>Sign Language</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {loading && <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 32,
  },
  bannerContainer: {
    width: "100%",
    marginBottom: 40,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  bannerGradient: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  iconButtonWrapper: {
    alignItems: "center",
    width: "48%",
  },
  iconButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonLabelContainer: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  loader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
})

export default HomeScreen
