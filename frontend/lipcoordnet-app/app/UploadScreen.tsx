import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

type RootStackParamList = {
  Upload: undefined;
  OutputStack: { screen: string; params: { videoUri?: string; prediction?: string; audioUri?: string } };
};

export default function UploadScreen() {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || { backgroundColor: '#F3F4F6', textColor: '#1E3A8A', primaryColor: '#60A5FA' };
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const pickDocument = async () => {
    setIsUploading(true);
    setError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const { uri } = result.assets[0];
        const newUri = `${FileSystem.cacheDirectory}temp-video-${Date.now()}.mp4`;
        await FileSystem.copyAsync({ from: uri, to: newUri });
        setVideoUri(newUri);
      }
    } catch (error) {
      setError((error as Error).message || 'Failed to pick video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadVideo = useCallback(async () => {
    if (!videoUri || isUploading) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', { uri: videoUri, name: 'video.mp4', type: 'video/mp4' } as any);

    try {
      const response = await axios.post('http://192.168.100.19:8080/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percentCompleted);
        },
      });

      const { videoUri: processedUri, prediction, audioUri } = response.data;
      navigation.navigate('OutputStack', { screen: 'OutputSelection', params: { videoUri: processedUri, prediction, audioUri } });
    } catch (error) {
      setError((error as Error).message || 'Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (videoUri) await FileSystem.deleteAsync(videoUri, { idempotent: true });
    }
  }, [videoUri, isUploading, navigation]);

  useEffect(() => {
    return () => setIsUploading(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Text style={[styles.header, { color: currentTheme.textColor }]}>Upload Your Video</Text>
      <TouchableOpacity style={styles.button} onPress={pickDocument} disabled={isUploading}>
        <Text style={styles.buttonText}>Pick a Video</Text>
      </TouchableOpacity>
      {videoUri && (
        <TouchableOpacity style={[styles.button, isUploading && styles.buttonDisabled]} onPress={uploadVideo} disabled={isUploading}>
          <Text style={styles.buttonText}>{isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Video'}</Text>
        </TouchableOpacity>
      )}
      {error ? <Text style={[styles.error, { color: '#DC2626' }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  button: {
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 40, alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 4 } }),
  },
  buttonText: { color: '#F9FAFB', fontSize: 16, fontWeight: '500' },
  buttonDisabled: { backgroundColor: '#A9A9A9' },
  error: { fontSize: 14, marginTop: 10, textAlign: 'center' },
});