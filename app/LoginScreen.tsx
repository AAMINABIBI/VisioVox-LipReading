"use client"

import { useState } from "react"
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Platform, Alert } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { currentTheme } = useTheme()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      await login(email, password)
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <LinearGradient colors={["#3B82F6", "#8B5CF6"]} style={styles.logoContainer}>
        <Icon name="video-library" size={48} color="#FFFFFF" />
      </LinearGradient>

      <View style={[styles.formContainer, { backgroundColor: currentTheme.cardBackground }]}>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>Welcome Back</Text>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: currentTheme.backgroundColor, borderColor: currentTheme.primaryColor },
          ]}
        >
          <Icon name="email" size={24} color={currentTheme.primaryColor} style={styles.icon} />
          <TextInput
            style={[styles.input, { color: currentTheme.textColor }]}
            placeholder="Email"
            placeholderTextColor={currentTheme.textColor + "80"}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View
          style={[
            styles.inputContainer,
            { backgroundColor: currentTheme.backgroundColor, borderColor: currentTheme.primaryColor },
          ]}
        >
          <Icon name="lock" size={24} color={currentTheme.primaryColor} style={styles.icon} />
          <TextInput
            style={[styles.input, { color: currentTheme.textColor }]}
            placeholder="Password"
            placeholderTextColor={currentTheme.textColor + "80"}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.button}>
          <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.buttonContent}>
            <Text style={styles.buttonText}>{loading ? "Signing In..." : "Sign In"}</Text>
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity>
          <Text style={[styles.link, { color: currentTheme.primaryColor }]}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 48,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
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
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    marginTop: 16,
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
  buttonContent: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "500",
  },
})

export default LoginScreen
