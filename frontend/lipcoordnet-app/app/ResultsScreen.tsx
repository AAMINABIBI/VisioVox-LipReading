"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native"
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from "@react-navigation/native"
import { useTheme } from "../contexts/ThemeContext"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import { Video, ResizeMode } from "expo-av"
import type { RootStackParamList, TabParamList } from "./_layout"

// Simple clipboard implementation without expo-clipboard
const setClipboard = async (text: string): Promise<void> => {
  try {
    // For React Native, we can use the Clipboard API if available
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for mobile - we'll show an alert with the text
      Alert.alert("Copy Text", `Text to copy:\n\n${text}`, [
        { text: "Cancel", style: "cancel" },
        { text: "OK", style: "default" },
      ])
    }
  } catch (error) {
    console.error("Clipboard error:", error)
    // Show the text in an alert as fallback
    Alert.alert("Copy Text", `Text to copy:\n\n${text}`, [
      { text: "Cancel", style: "cancel" },
      { text: "OK", style: "default" },
    ])
  }
}

type ResultsScreenRouteProp = RouteProp<RootStackParamList, "Results">

export default function ResultsScreen() {
  const { currentTheme } = useTheme()
  const navigation = useNavigation<NavigationProp<TabParamList>>()
  const route = useRoute<ResultsScreenRouteProp>()
  const { result = "", outputType = "text", audioUri, videoUri } = route.params || {}
  const [videoError, setVideoError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(30))

  useEffect(() => {
    if (!result || !outputType) {
      navigation.navigate("Upload")
    }
  }, [result, outputType, navigation])

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

  if (!result || !outputType) {
    return null
  }

  const handleCopyText = async () => {
    if (!result) return

    setIsCopying(true)
    try {
      await setClipboard(result)
      Alert.alert("Copied!", "Text has been copied to clipboard", [{ text: "OK" }])
    } catch (error) {
      console.error("Copy error:", error)
      Alert.alert("Error", "Failed to copy text to clipboard")
    } finally {
      setIsCopying(false)
    }
  }

  const handleDownloadShare = async (type: "audio" | "video") => {
    setIsDownloading(true)
    let fileUri = ""
    const uri = type === "audio" ? audioUri : videoUri

    if (!uri) {
      Alert.alert("No File", `No ${type} file is available for this result.`)
      setIsDownloading(false)
      return
    }

    try {
      const fileExtension = type === "audio" ? "mp3" : "mp4"
      const fileName = `lipreading_${type}_${Date.now()}.${fileExtension}`

      fileUri = uri.startsWith("file://")
        ? uri
        : await FileSystem.downloadAsync(uri, FileSystem.documentDirectory + fileName).then(({ uri }) => uri)

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available", "Please try downloading manually.")
        return
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: type === "audio" ? "audio/mpeg" : "video/mp4",
        dialogTitle: `Share or Download ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        UTI: type === "audio" ? "public.mp3" : "public.mp4",
      })
    } catch (error) {
      console.error("Download/Share error:", error)
      Alert.alert("Error", `Failed to download or share the ${type} file.`)
    } finally {
      if (fileUri && !fileUri.startsWith("file://")) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true })
      }
      setIsDownloading(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: currentTheme.cardBackground }]}
            onPress={() => navigation.navigate("Upload")}
            accessibilityLabel="Go Back to Upload"
            accessibilityRole="button"
          >
            <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: currentTheme.textColor }]}>Analysis Results</Text>
        </View>

        {/* Results Card */}
        <View style={[styles.resultsCard, { backgroundColor: currentTheme.cardBackground }]}>
          <LinearGradient colors={["#1E40AF", "#3B82F6"]} style={styles.resultHeader}>
            <Icon name="analytics" size={32} color="#FFFFFF" />
            <Text style={styles.resultHeaderText}>Lip Reading Analysis</Text>
          </LinearGradient>

          {/* Text Result */}
          {outputType === "text" && (
            <View style={styles.textResultSection}>
              <View style={styles.textHeader}>
                <Icon name="text-fields" size={24} color={currentTheme.primaryColor} />
                <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>Predicted Text</Text>
              </View>
              <View style={[styles.textContainer, { backgroundColor: currentTheme.backgroundColor }]}>
                <Text style={[styles.resultText, { color: currentTheme.textColor }]} selectable>
                  {result}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.copyButton, { backgroundColor: currentTheme.primaryColor }]}
                onPress={handleCopyText}
                disabled={isCopying}
              >
                {isCopying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="content-copy" size={20} color="#FFFFFF" />
                    <Text style={styles.copyButtonText}>Copy Text</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Audio Result */}
          {outputType === "audio" && (
            <View style={styles.audioResultSection}>
              <View style={styles.audioHeader}>
                <Icon name="volume-up" size={24} color={currentTheme.primaryColor} />
                <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>Generated Audio</Text>
              </View>
              <View style={[styles.audioContainer, { backgroundColor: currentTheme.backgroundColor }]}>
                <Icon name="audiotrack" size={48} color={currentTheme.primaryColor} />
                <Text style={[styles.audioText, { color: currentTheme.textColor }]}>
                  {audioUri ? "Audio file ready for download" : "No audio available"}
                </Text>
              </View>
              {audioUri && (
                <TouchableOpacity
                  style={[styles.downloadButton, { backgroundColor: "#10B981" }]}
                  onPress={() => handleDownloadShare("audio")}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="download" size={20} color="#FFFFFF" />
                      <Text style={styles.downloadButtonText}>Download Audio</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Video Result */}
          {outputType === "video" && (
            <View style={styles.videoResultSection}>
              <View style={styles.videoHeader}>
                <Icon name="video-library" size={24} color={currentTheme.primaryColor} />
                <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>Processed Video</Text>
              </View>
              {videoUri && !videoError ? (
                <View style={styles.videoContainer}>
                  <Video
                    source={{ uri: videoUri }}
                    style={styles.video}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                    isLooping
                    accessibilityLabel="Video with captions"
                    onError={(error: unknown) => {
                      console.error("Video Error in Results:", error)
                      setVideoError(true)
                    }}
                    onLoad={() => console.log("Video loaded successfully in Results:", videoUri)}
                  />
                  <TouchableOpacity
                    style={[styles.downloadButton, { backgroundColor: "#8B5CF6" }]}
                    onPress={() => handleDownloadShare("video")}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Icon name="download" size={20} color="#FFFFFF" />
                        <Text style={styles.downloadButtonText}>Download Video</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.noVideoContainer, { backgroundColor: currentTheme.backgroundColor }]}>
                  <Icon name="video-library" size={48} color="#9CA3AF" />
                  <Text style={[styles.noVideoText, { color: currentTheme.textColor }]}>No video available</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <LinearGradient colors={["#1E40AF", "#3B82F6"]} style={styles.actionButton}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Upload")}
              style={styles.actionButtonContent}
              accessibilityLabel="Upload Another Video"
              accessibilityRole="button"
            >
              <Icon name="add" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Analyze Another Video</Text>
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: currentTheme.primaryColor }]}
            onPress={() => navigation.navigate("Home")}
            accessibilityLabel="Go to Home"
            accessibilityRole="button"
          >
            <Icon name="home" size={20} color={currentTheme.primaryColor} />
            <Text style={[styles.secondaryButtonText, { color: currentTheme.primaryColor }]}>Back to Home</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={[styles.statsSection, { backgroundColor: currentTheme.cardBackground }]}>
          <Text style={[styles.statsTitle, { color: currentTheme.textColor }]}>Analysis Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <LinearGradient colors={["#10B981", "#059669"]} style={styles.statIcon}>
                <Icon name="check-circle" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.statLabel, { color: currentTheme.textColor }]}>Status</Text>
              <Text style={[styles.statValue, { color: "#10B981" }]}>Complete</Text>
            </View>
            <View style={styles.statItem}>
              <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.statIcon}>
                <Icon name="text-fields" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.statLabel, { color: currentTheme.textColor }]}>Text Length</Text>
              <Text style={[styles.statValue, { color: currentTheme.primaryColor }]}>{result.length} chars</Text>
            </View>
            <View style={styles.statItem}>
              <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.statIcon}>
                <Icon name="timer" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.statLabel, { color: currentTheme.textColor }]}>Processing</Text>
              <Text style={[styles.statValue, { color: "#8B5CF6" }]}>AI Powered</Text>
            </View>
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
  },
  resultsCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  resultHeaderText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  textResultSection: {
    padding: 20,
  },
  textHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  textContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  audioResultSection: {
    padding: 20,
  },
  audioHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  audioContainer: {
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  audioText: {
    fontSize: 16,
    textAlign: "center",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  videoResultSection: {
    padding: 20,
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  videoContainer: {
    gap: 16,
  },
  video: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  noVideoContainer: {
    alignItems: "center",
    padding: 24,
    borderRadius: 12,
    gap: 12,
  },
  noVideoText: {
    fontSize: 16,
    textAlign: "center",
  },
  actionSection: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 12,
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
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsSection: {
    borderRadius: 16,
    padding: 20,
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
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
})