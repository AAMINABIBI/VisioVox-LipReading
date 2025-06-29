"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
  Animated,
} from "react-native"
import { useNavigation, type NavigationProp } from "@react-navigation/native"
import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system"
import { useTheme } from "../contexts/ThemeContext"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import axios from "axios"
import type { RootStackParamList } from "./_layout"

const API_BASE_URL = "http://192.168.100.19:8080" // Update this to your server IP

export default function UploadScreen() {
  const { currentTheme } = useTheme()
  const navigation = useNavigation<NavigationProp<RootStackParamList>>()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoUri, setVideoUri] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>("")
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(50))

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

  // Test server connection
  const testConnection = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/healthz`, { timeout: 5000 })
      console.log("Server connection test:", response.data)
      return true
    } catch (error) {
      console.error("Server connection failed:", error)
      setError("Cannot connect to server. Please check your network connection.")
      return false
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  const pickDocument = async () => {
    setError("")
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        const { uri, name, size } = asset

        // Check file size (limit to 100MB)
        if (size && size > 100 * 1024 * 1024) {
          setError("File too large. Please select a video smaller than 100MB.")
          return
        }

        // Copy to cache directory with a clean name
        const fileExtension = name?.split(".").pop() || "mp4"
        const newUri = `${FileSystem.cacheDirectory}temp-video-${Date.now()}.${fileExtension}`

        await FileSystem.copyAsync({ from: uri, to: newUri })
        setVideoUri(newUri)
        setSelectedFileName(name || "Selected Video")

        console.log("Video selected:", { uri: newUri, name, size })
      }
    } catch (error) {
      console.error("Document picker error:", error)
      setError("Failed to pick video. Please try again.")
    }
  }

  const uploadVideo = useCallback(async () => {
    if (!videoUri || isUploading) return

    // Test connection first
    const isConnected = await testConnection()
    if (!isConnected) return

    setIsUploading(true)
    setError("")
    setUploadProgress(0)

    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(videoUri)
      if (!fileInfo.exists) {
        throw new Error("Video file not found. Please select again.")
      }

      // Create FormData
      const formData = new FormData()
      formData.append("file", {
        uri: videoUri,
        name: "video.mp4",
        type: "video/mp4",
      } as any)

      console.log("Uploading to:", `${API_BASE_URL}/predict`)

      const response = await axios.post(`${API_BASE_URL}/predict`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000, // 5 minutes timeout
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        },
      })

      console.log("Upload response:", response.data)

      if (response.data.success) {
        const { videoUri: processedUri, prediction, audioUri } = response.data

        // Navigate directly to OutputSelection screen
        navigation.navigate("OutputSelection", {
          videoUri: processedUri,
          prediction,
          audioUri,
        })
      } else {
        throw new Error(response.data.detail || "Upload failed")
      }
    } catch (error: any) {
      console.error("Upload error:", error)

      let errorMessage = "Failed to upload video. Please try again."

      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.detail || `Server error: ${error.response.status}`
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection and server status."
      } else if (error.message) {
        errorMessage = error.message
      }

      setError(errorMessage)
      Alert.alert("Upload Failed", errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)

      // Clean up temporary file
      if (videoUri) {
        try {
          await FileSystem.deleteAsync(videoUri, { idempotent: true })
          setVideoUri(null)
          setSelectedFileName("")
        } catch (cleanupError) {
          console.warn("Failed to cleanup temp file:", cleanupError)
        }
      }
    }
  }, [videoUri, isUploading, navigation])

  useEffect(() => {
    return () => {
      setIsUploading(false)
      // Cleanup on unmount
      if (videoUri) {
        FileSystem.deleteAsync(videoUri, { idempotent: true }).catch(console.warn)
      }
    }
  }, [videoUri])

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <LinearGradient colors={["#1E3A8A", "#60A5FA"]} style={styles.headerGradient}>
            <Icon name="video-library" size={48} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.header, { color: currentTheme.textColor }]}>Upload Your Video</Text>
          <Text style={[styles.subtitle, { color: currentTheme.textColor }]}>
            Select a video file to analyze lip movements and generate text predictions
          </Text>
        </View>

        {/* Upload Section */}
        <View style={[styles.uploadSection, { backgroundColor: currentTheme.cardBackground }]}>
          <TouchableOpacity
            style={[styles.uploadArea, { borderColor: currentTheme.primaryColor }]}
            onPress={pickDocument}
            disabled={isUploading}
          >
            <LinearGradient colors={["#1E40AF", "#3B82F6"]} style={styles.uploadIcon}>
              <Icon name="cloud-upload" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.uploadText, { color: currentTheme.textColor }]}>
              {selectedFileName ? "Change Video" : "Tap to select video"}
            </Text>
            <Text style={[styles.uploadSubtext, { color: currentTheme.textColor }]}>MP4, MOV, AVI • Max 100MB</Text>
          </TouchableOpacity>

          {selectedFileName && (
            <View style={[styles.fileInfo, { backgroundColor: currentTheme.backgroundColor }]}>
              <Icon name="video-file" size={24} color={currentTheme.primaryColor} />
              <View style={styles.fileDetails}>
                <Text style={[styles.fileName, { color: currentTheme.textColor }]} numberOfLines={1}>
                  {selectedFileName}
                </Text>
                <Text style={[styles.fileStatus, { color: currentTheme.primaryColor }]}>Ready to upload</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setVideoUri(null)
                  setSelectedFileName("")
                }}
              >
                <Icon name="close" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {videoUri && (
          <View style={styles.actionSection}>
            <LinearGradient
              colors={isUploading ? ["#9CA3AF", "#6B7280"] : ["#1E40AF", "#3B82F6"]}
              style={[styles.actionButton, isUploading && styles.buttonDisabled]}
            >
              <TouchableOpacity onPress={uploadVideo} disabled={isUploading} style={styles.buttonContent}>
                {isUploading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.buttonText}>Processing {uploadProgress}%</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContentRow}>
                    <Icon name="analytics" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Analyze Video</Text>
                  </View>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Progress Section */}
        {isUploading && (
          <View style={[styles.progressSection, { backgroundColor: currentTheme.cardBackground }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: currentTheme.textColor }]}>
                {uploadProgress < 50 ? "Uploading video..." : "Analyzing lip movements..."}
              </Text>
              <Text style={[styles.progressPercent, { color: currentTheme.primaryColor }]}>{uploadProgress}%</Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: currentTheme.backgroundColor }]}>
              <LinearGradient
                colors={["#3B82F6", "#8B5CF6"]}
                style={[styles.progressBar, { width: `${uploadProgress}%` }]}
              />
            </View>
            <Text style={[styles.progressSubtext, { color: currentTheme.textColor }]}>
              This may take 1-3 minutes depending on video length
            </Text>
          </View>
        )}

        {/* Error Section */}
        {error && (
          <View style={styles.errorSection}>
            <LinearGradient colors={["#FEE2E2", "#FECACA"]} style={styles.errorContainer}>
              <Icon name="error-outline" size={24} color="#DC2626" />
              <View style={styles.errorContent}>
                <Text style={styles.errorTitle}>Upload Failed</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <TouchableOpacity onPress={() => setError("")} style={styles.errorClose}>
                <Icon name="close" size={20} color="#DC2626" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: currentTheme.cardBackground }]}>
          <Text style={[styles.infoTitle, { color: currentTheme.textColor }]}>How it works</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <LinearGradient colors={["#3B82F6", "#8B5CF6"]} style={styles.infoIcon}>
                <Text style={styles.infoNumber}>1</Text>
              </LinearGradient>
              <Text style={[styles.infoText, { color: currentTheme.textColor }]}>Upload your video file</Text>
            </View>
            <View style={styles.infoItem}>
              <LinearGradient colors={["#3B82F6", "#8B5CF6"]} style={styles.infoIcon}>
                <Text style={styles.infoNumber}>2</Text>
              </LinearGradient>
              <Text style={[styles.infoText, { color: currentTheme.textColor }]}>AI analyzes lip movements</Text>
            </View>
            <View style={styles.infoItem}>
              <LinearGradient colors={["#3B82F6", "#8B5CF6"]} style={styles.infoIcon}>
                <Text style={styles.infoNumber}>3</Text>
              </LinearGradient>
              <Text style={[styles.infoText, { color: currentTheme.textColor }]}>Get text, audio & video results</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  content: {
    flex: 1,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  headerGradient: {
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
  header: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 22,
  },
  uploadSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginBottom: 16,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  fileStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionSection: {
    marginBottom: 20,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  buttonContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  progressSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
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
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  errorSection: {
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    lineHeight: 20,
  },
  errorClose: {
    padding: 4,
  },
  infoSection: {
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
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  infoNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
})
