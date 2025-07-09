"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Switch, Platform, TouchableOpacity, ActivityIndicator, Modal } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useTheme } from "../contexts/ThemeContext"
import { useAuth } from "../contexts/AuthContext"
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated"

const SettingsScreen = () => {
  const { theme, currentTheme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false)

  const headerOpacity = useSharedValue(0)
  const cardOpacity = useSharedValue(0)

  useEffect(() => {
    // Animation setup
    headerOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    cardOpacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })
  }, [])

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: withTiming(headerOpacity.value * 10, { duration: 800 }) }],
    }
  })

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ scale: withTiming(cardOpacity.value, { duration: 1000 }) }],
    }
  })

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Animated.View style={[styles.header, animatedHeaderStyle]}>
        <LinearGradient colors={["#3B82F6", "#60A5FA"]} style={styles.headerIcon}>
          <Icon name="settings" size={36} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.logoText, { color: currentTheme.textColor }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: currentTheme.textColor + "B3" }]}>
          Customize your LipCoordNet experience
        </Text>
      </Animated.View>

      <Animated.View
        style={[styles.settingsCard, { backgroundColor: currentTheme.cardBackground || currentTheme.backgroundColor }, animatedCardStyle]}
      >
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: currentTheme.textColor }]}>Account</Text>
            <Text style={[styles.settingDescription, { color: currentTheme.textColor + "B3" }]}>
              {user?.email || "No user logged in"}
            </Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: currentTheme.textColor }]}>Appearance</Text>
            <Text style={[styles.settingDescription, { color: currentTheme.textColor + "B3" }]}>
              {theme === "dark" ? "Dark mode enabled" : "Light mode enabled"}
            </Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#D1D5DB", true: currentTheme.primaryColor }}
            thumbColor={theme === "dark" ? "#FFFFFF" : "#F3F4F6"}
            accessibilityLabel="Toggle theme between light and dark"
          />
        </View>

        <TouchableOpacity onPress={() => setIsAboutModalVisible(true)} style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: currentTheme.textColor }]}>About LipCoordNet</Text>
            <Text style={[styles.settingDescription, { color: currentTheme.textColor + "B3" }]}>
              Learn more about our AI-powered platform
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={currentTheme.primaryColor} />
        </TouchableOpacity>

        <LinearGradient colors={["#3B82F6", "#1E3A8A"]} style={styles.button}>
          <TouchableOpacity onPress={handleLogout} accessibilityLabel="Log Out" disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? "Logging Out..." : "Log Out"}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* About Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isAboutModalVisible}
        onRequestClose={() => setIsAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground || currentTheme.backgroundColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.textColor }]}>About LipCoordNet</Text>
              <TouchableOpacity onPress={() => setIsAboutModalVisible(false)}>
                <Icon name="close" size={24} color={currentTheme.textColor} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalText, { color: currentTheme.textColor + "B3" }]}>
              LipCoordNet is an innovative platform that uses AI to analyze lip movements and generate accurate text, audio, and video outputs, enhancing communication accessibility.
            </Text>
            <Text style={[styles.modalText, { color: currentTheme.textColor + "B3" }]}>
              Version: 1.0.0
            </Text>
           
            <LinearGradient colors={["#3B82F6", "#1E3A8A"]} style={styles.modalButton}>
              <TouchableOpacity onPress={() => setIsAboutModalVisible(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {isLoading && <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoText: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    opacity: 0.7,
    textAlign: "center",
  },
  settingsCard: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 8,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: "400",
    opacity: 0.7,
    marginTop: 4,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  loader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalLink: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
})

export default SettingsScreen