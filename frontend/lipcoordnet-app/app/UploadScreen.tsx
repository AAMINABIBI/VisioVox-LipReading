import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
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

  const pickDocument = async () => {
    setIsUploading(true);
    setError('');
    let tempUri = '';

    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
      if (result.canceled || !result.assets) {
        setIsUploading(false);
        return;
      }

      const video = result.assets[0];
      const videoUri = video.uri;

      if (video.size && video.size > 50 * 1024 * 1024) {
        throw new Error('Video file size must be less than 50MB.');
      }

      const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
      if (video.mimeType && !allowedTypes.includes(video.mimeType)) {
        throw new Error('Please upload a valid video file (MP4, MPEG, or MOV).');
      }

      tempUri = `${FileSystem.cacheDirectory}temp-video-${Date.now()}.mp4`;
      await FileSystem.copyAsync({ from: videoUri, to: tempUri });

      const formData = new FormData();
      formData.append('file', {
        uri: tempUri,
        name: video.name,
        type: video.mimeType ?? 'video/mp4',
      } as any);

      const response = await axios.post('http://192.168.100.19:8080/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percentCompleted);
        },
      });

      const data = response.data;
      navigation.navigate({ name: 'OutputStack', params: { screen: 'OutputSelection', params: { videoUri: data.videoUri, prediction: data.prediction, audioUri: data.audioUri } } });
    } catch (error) {
      setError((error as Error).message || 'Failed to upload video. Please try again.');
    } finally {
      if (tempUri) await FileSystem.deleteAsync(tempUri, { idempotent: true });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Image
        source={require('../assets/images/logo.jpg')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="VisioVox Logo"
      />
      <Text style={[styles.header, { color: currentTheme.textColor }]}>Upload Your Video</Text>
      <Text style={[styles.subHeader, { color: '#6B7280' }]}>Select a video to process with lip-reading technology</Text>
      {error ? (
        <Text style={[styles.error, { color: '#DC2626' }]}>{error}</Text>
      ) : null}
      {isUploading ? (
        <View>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />
          <Text style={[styles.progress, { color: currentTheme.textColor }]}>{uploadProgress}%</Text>
        </View>
      ) : (
        <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.button}>
          <TouchableOpacity
            onPress={pickDocument}
            accessibilityLabel="Upload Video"
            accessibilityRole="button"
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>Upload Video</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 30,
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '500',
  },
  loader: {
    marginBottom: 10,
  },
  error: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  progress: {
    textAlign: 'center',
    marginTop: 5,
  },
});