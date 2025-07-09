"use client"

import { useRef, useState } from "react"
import { View, Text, StyleSheet, ScrollView, Platform, Animated, TextInput, TouchableOpacity, ActivityIndicator } from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { updateProfile } from "firebase/auth"

const ProfileScreen = () => {
  const { user, logout } = useAuth()
  const { currentTheme } = useTheme()
  const scrollY = useRef(new Animated.Value(0)).current
  const [username, setUsername] = useState(user?.displayName || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const headerHeight = 200
  const diffClamp = Animated.diffClamp(scrollY, 0, headerHeight)
  const translateY = diffClamp.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
  })

  const animatedStyle = {
    transform: [{ translateY }],
  }

  const handleSaveChanges = async () => {
    if (!user) {
      setError("No user is logged in")
      return
    }

    if (!username.trim()) {
      setError("Username cannot be empty")
      return
    }

    setIsUpdating(true)
    setError("")
    setSuccess("")

    try {
      await updateProfile(user, { displayName: username.trim() })
      setSuccess("Username updated successfully")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Failed to update profile:", error)
      setError(error.message || "Failed to update username")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearUsername = () => {
    setUsername("")
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error: any) {
      console.error("Logout failed:", error)
      setError(error.message || "Failed to log out")
    }
  }

  // Get initials for profile picture
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((name) => name.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return "U"
  }

  const lastUpdated = user?.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleString()
    : "Not available"

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.backgroundColor || "#F3F4F6",
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
    initials: {
      fontSize: 28,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    formContainer: {
      width: "100%",
      backgroundColor: currentTheme.cardBackground || "#FFFFFF",
      borderRadius: 20,
      padding: 24,
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
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: currentTheme.textColor || "#1E3A8A",
      textAlign: "center",
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: currentTheme.textColor || "#1E3A8A",
      marginBottom: 16,
      marginTop: 8,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentTheme.inputBackground || "#F9FAFB",
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: currentTheme.borderColor || "#E5E7EB",
    },
    icon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 52,
      fontSize: 16,
      color: currentTheme.textColor || "#1E3A8A",
    },
    clearButton: {
      padding: 8,
    },
    button: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
      marginBottom: 24,
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
      color: "#F9FAFB",
      fontSize: 16,
      fontWeight: "600",
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FEE2E2",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      color: "#DC2626",
      fontSize: 14,
      flex: 1,
    },
    successContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#DCFCE7",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    successText: {
      color: "#15803D",
      fontSize: 14,
      flex: 1,
    },
    infoText: {
      fontSize: 14,
      color: currentTheme.textColor + "80" || "#6B7280",
      textAlign: "center",
      marginTop: 8,
    },
  })

  return (
    <ScrollView
      style={styles.container}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      scrollEventThrottle={16}
    >
      <Animated.View style={[animatedStyle]}>
        <View style={styles.header}>
          <LinearGradient colors={["#1E3A8A", "#60A5FA"]} style={styles.headerIcon}>
            <Text style={styles.initials}>{getInitials()}</Text>
          </LinearGradient>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Profile Settings</Text>

          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.inputContainer}>
            <Icon name="person-outline" size={24} color={currentTheme.textColor || "#1E3A8A"} style={styles.icon} />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={currentTheme.textColor + "80" || "#6B7280"}
              autoCapitalize="none"
              editable={!isUpdating}
            />
            {username && (
              <TouchableOpacity onPress={handleClearUsername} disabled={isUpdating} style={styles.clearButton}>
                <Icon name="clear" size={20} color={currentTheme.textColor + "80" || "#6B7280"} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Icon name="email" size={24} color={currentTheme.textColor || "#1E3A8A"} style={styles.icon} />
            <TextInput
              style={styles.input}
              value={user?.email || "No email available"}
              editable={false}
              placeholder="Email"
              placeholderTextColor={currentTheme.textColor + "80" || "#6B7280"}
            />
          </View>

          <Text style={styles.infoText}>Last updated: {lastUpdated}</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={20} color="#DC2626" style={styles.icon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.successContainer}>
              <Icon name="check-circle" size={20} color="#15803D" style={styles.icon} />
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          <LinearGradient colors={["#1E40AF", "#3B82F6"]} style={styles.button}>
            <TouchableOpacity onPress={handleSaveChanges} disabled={isUpdating}>
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Security</Text>
          <LinearGradient colors={["#DC2626", "#F87171"]} style={styles.button}>
            <TouchableOpacity onPress={handleLogout} disabled={isUpdating}>
              <Text style={styles.buttonText}>Log Out</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>
    </ScrollView>
  )
}

export default ProfileScreen