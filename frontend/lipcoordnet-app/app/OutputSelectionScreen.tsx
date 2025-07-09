"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, Animated } from "react-native"
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from "@react-navigation/native"
import { useTheme } from "../contexts/ThemeContext"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import { Video, ResizeMode } from "expo-av"
import type { RootStackParamList } from "./_layout"

type OutputSelectionRouteProp = RouteProp<RootStackParamList, "OutputSelection">

export default function OutputSelectionScreen() {
  const { currentTheme } = useTheme()
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const route = useRoute<OutputSelectionRouteProp>()
  const { videoUri, prediction, audioUri } = route.params || {}
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(30))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleViewResults = (outputType: string) => {
    navigation.navigate("Results", {
      result: prediction || "No prediction available",
      outputType,
      audioUri,
      videoUri,
    })
  }

  const handleNavigateToMain = () => {
    navigation.navigate("Main")
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={["#1E40AF", "#3B82F6"]} style={styles.headerIcon}>
            <Icon name="done-all" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: currentTheme.textColor }]}>Analysis Complete!</Text>
          <Text style={[styles.headerSubtitle, { color: currentTheme.textColor }]}>
            Your lip reading analysis is ready. Choose how you'd like to view the results.
          </Text>
        </View>

        {/* Results Summary */}
        <View style={[styles.summarySection, { backgroundColor: currentTheme.cardBackground }]}>
          <View style={styles.summaryHeader}>
            <Icon name="analytics" size={24} color={currentTheme.primaryColor} />
            <Text style={[styles.summaryTitle, { color: currentTheme.textColor }]}>Analysis Summary</Text>
          </View>

          {prediction && (
            <View style={[styles.predictionPreview, { backgroundColor: currentTheme.backgroundColor }]}>
              <Text style={[styles.predictionLabel, { color: currentTheme.textColor }]}>Predicted Text:</Text>
              <Text style={[styles.predictionText, { color: currentTheme.textColor }]} numberOfLines={2}>
                "{prediction}"
              </Text>
            </View>
          )}

          <View style={styles.availableOutputs}>
            <Text style={[styles.availableTitle, { color: currentTheme.textColor }]}>Available Outputs:</Text>
            <View style={styles.outputIndicators}>
              <View style={styles.indicator}>
                <Icon name="text-fields" size={16} color="#10B981" />
                <Text style={[styles.indicatorText, { color: "#10B981" }]}>Text</Text>
              </View>
              {audioUri && (
                <View style={styles.indicator}>
                  <Icon name="volume-up" size={16} color="#3B82F6" />
                  <Text style={[styles.indicatorText, { color: "#3B82F6" }]}>Audio</Text>
                </View>
              )}
              {videoUri && (
                <View style={styles.indicator}>
                  <Icon name="video-library" size={16} color="#8B5CF6" />
                  <Text style={[styles.indicatorText, { color: "#8B5CF6" }]}>Video</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Preview Section */}
        {videoUri && (
          <View style={[styles.previewSection, { backgroundColor: currentTheme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>Video Preview</Text>
            <Video
              source={{ uri: videoUri }}
              style={styles.previewVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping
              accessibilityLabel="Processed video preview with captions"
            />
            <Text style={[styles.previewNote, { color: currentTheme.textColor }]}>
              Video includes original footage with generated captions and audio
            </Text>
          </View>
        )}

        {/* Output Options */}
        <View style={styles.optionsSection}>
          <Text style={[styles.optionsTitle, { color: currentTheme.textColor }]}>Choose Output Format:</Text>

          {/* Text Option */}
          <TouchableOpacity
            style={[styles.optionCard, { backgroundColor: currentTheme.cardBackground }]}
            onPress={() => handleViewResults("text")}
          >
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.optionIcon}>
              <Icon name="text-fields" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: currentTheme.textColor }]}>Text Result</Text>
              <Text style={[styles.optionDescription, { color: currentTheme.textColor }]}>
                View and copy the predicted text from lip reading analysis
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={currentTheme.primaryColor} />
          </TouchableOpacity>

          {/* Audio Option */}
          {audioUri && (
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: currentTheme.cardBackground }]}
              onPress={() => handleViewResults("audio")}
            >
              <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.optionIcon}>
                <Icon name="volume-up" size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: currentTheme.textColor }]}>Audio Result</Text>
                <Text style={[styles.optionDescription, { color: currentTheme.textColor }]}>
                  Download generated speech audio from the predicted text
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color={currentTheme.primaryColor} />
            </TouchableOpacity>
          )}

          {/* Video Option */}
          {videoUri && (
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: currentTheme.cardBackground }]}
              onPress={() => handleViewResults("video")}
            >
              <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.optionIcon}>
                <Icon name="video-library" size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: currentTheme.textColor }]}>Video Result</Text>
                <Text style={[styles.optionDescription, { color: currentTheme.textColor }]}>
                  Download video with captions and synchronized audio
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color={currentTheme.primaryColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { borderColor: currentTheme.primaryColor }]}
            onPress={() => navigation.navigate("Upload")}
          >
            <Icon name="add" size={20} color={currentTheme.primaryColor} />
            <Text style={[styles.quickActionText, { color: currentTheme.primaryColor }]}>New Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { borderColor: currentTheme.primaryColor }]}
            onPress={handleNavigateToMain}
          >
            <Icon name="home" size={20} color={currentTheme.primaryColor} />
            <Text style={[styles.quickActionText, { color: currentTheme.primaryColor }]}>Home</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 22,
  },
  summarySection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  predictionPreview: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  predictionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.8,
  },
  predictionText: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    fontStyle: "italic",
  },
  availableOutputs: {
    marginTop: 8,
  },
  availableTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.8,
  },
  outputIndicators: {
    flexDirection: "row",
    gap: 16,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: "500",
  },
  previewSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  previewVideo: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  previewNote: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    fontStyle: "italic",
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: "600",
  },
})