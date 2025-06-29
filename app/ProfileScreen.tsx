"use client"

import { useRef } from "react"
import { View, Text, StyleSheet, ScrollView, Platform, Animated } from "react-native"
import Icon from "react-native-vector-icons/MaterialIcons"
import { LinearGradient } from "expo-linear-gradient"

const ProfileScreen = () => {
  const scrollY = useRef(new Animated.Value(0)).current

  const headerHeight = 200 // Adjust as needed
  const diffClamp = Animated.diffClamp(scrollY, 0, headerHeight)
  const translateY = diffClamp.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
  })

  const animatedStyle = {
    transform: [{ translateY }],
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F3F4F6",
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
    formContainer: {
      width: "100%",
      backgroundColor: "#FFFFFF",
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
      color: "#1E3A8A",
      textAlign: "center",
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#1E3A8A",
      marginBottom: 16,
      marginTop: 8,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F9FAFB",
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    icon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 52,
      fontSize: 16,
      color: "#1E3A8A",
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
            <Icon name="person" size={40} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Profile Settings</Text>

          <Text style={styles.sectionTitle}>Account Information</Text>
          {/* Username section */}

          <Text style={styles.sectionTitle}>Security</Text>
          {/* Password section */}
        </View>
      </Animated.View>
    </ScrollView>
  )
}

export default ProfileScreen
