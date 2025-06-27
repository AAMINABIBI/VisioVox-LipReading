"use client"

import { useState } from "react"
import { View, Text, StyleSheet, Switch, Platform, TouchableOpacity, ActivityIndicator } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useTheme } from "../contexts/ThemeContext"
import { useAuth } from "../contexts/AuthContext"

const SettingsScreen = () => {
  const { theme, currentTheme, toggleTheme } = useTheme()
  const { logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

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
      <View style={styles.header}>
        <LinearGradient colors={["#1E3A8A", "#60A5FA"]} style={styles.headerIcon}>
          <Icon name="settings" size={40} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.logoText, { color: currentTheme.textColor }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: currentTheme.textColor }]}>Customize your app experience</Text>
      </View>

      <View
        style={[styles.settingsCard, { backgroundColor: currentTheme.cardBackground || currentTheme.backgroundColor }]}
      >
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: currentTheme.textColor }]}>Appearance</Text>
            <Text style={[styles.settingDescription, { color: currentTheme.textColor }]}>
              {theme === "dark" ? "Dark mode enabled" : "Light mode enabled"}
            </Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: currentTheme.primaryColor }}
            thumbColor={currentTheme.buttonBackground || "#f4f3f4"}
            accessibilityLabel="Toggle theme between light and dark"
          />
        </View>

        <LinearGradient colors={["#000080", "#1E90FF"]} style={styles.button}>
          <TouchableOpacity onPress={handleLogout} accessibilityLabel="Log Out" disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? "Logging Out..." : "Log Out"}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
      {isLoading && <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoText: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
  },
  settingsCard: {
    width: "100%",
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    width: "100%",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loader: {
    marginTop: 20,
  },
})

export default SettingsScreen
