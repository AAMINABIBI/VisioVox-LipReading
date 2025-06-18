import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Video, ResizeMode } from 'expo-av';
import { RootStackParamList, TabParamList } from './_layout';

type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

export default function ResultsScreen() {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || { backgroundColor: '#F3F4F6', textColor: '#1E3A8A', primaryColor: '#60A5FA', cardBackground: '#FFFFFF' };
  const navigation = useNavigation<NavigationProp<TabParamList>>();
  const route = useRoute<ResultsScreenRouteProp>();
  const { result = '', outputType = 'text', audioUri, videoUri } = route.params || {};
  const [videoError, setVideoError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!result || !outputType) {
      navigation.navigate('Upload');
    }
  }, [result, outputType, navigation]);

  if (!result || !outputType) {
    return null;
  }

  const handleDownloadShare = async () => {
    setIsDownloading(true);
    let fileUri = '';
    try {
      if (outputType === 'audio' && audioUri) {
        fileUri = audioUri.startsWith('file://')
          ? audioUri
          : await FileSystem.downloadAsync(
              audioUri,
              FileSystem.documentDirectory + 'output_audio.mp3'
            ).then(({ uri }) => uri);

        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('Sharing not available', 'Please try downloading manually.');
          return;
        }

        await Sharing.shareAsync(fileUri, {
          mimeType: 'audio/mpeg',
          dialogTitle: 'Share or Download Audio',
          UTI: 'public.mp3',
        });
      } else if (outputType === 'video' && videoUri) {
        fileUri = videoUri.startsWith('file://')
          ? videoUri
          : await FileSystem.downloadAsync(
              videoUri,
              FileSystem.documentDirectory + 'output_video.mp4'
            ).then(({ uri }) => uri);

        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('Sharing not available', 'Please try downloading manually.');
          return;
        }

        await Sharing.shareAsync(fileUri, {
          mimeType: 'video/mp4',
          dialogTitle: 'Share or Download Video',
          UTI: 'public.mp4',
        });
      } else {
        Alert.alert('No File', 'No audio or video file is available for this result.');
        return;
      }
    } catch (error) {
      console.error('Download/Share error:', error);
      Alert.alert('Error', 'Failed to download or share the file.');
    } finally {
      if (fileUri && !fileUri.startsWith('file://')) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
      setIsDownloading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Upload')}
        accessibilityLabel="Go Back to Upload"
        accessibilityRole="button"
      >
        <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
      </TouchableOpacity>
      <Text style={[styles.header, { color: currentTheme.textColor }]}>Results</Text>
      <View style={[styles.resultCard, { backgroundColor: currentTheme.cardBackground }]}>
        {outputType === 'text' && (
          <Text style={[styles.resultText, { color: currentTheme.textColor }]}>TEXT: {result}</Text>
        )}
        {outputType === 'audio' && (
          <Text style={[styles.resultText, { color: currentTheme.textColor }]}>
            AUDIO: {audioUri ? 'Audio file available' : 'No audio available'}
          </Text>
        )}
        {outputType === 'video' && videoUri && !videoError ? (
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping
            accessibilityLabel="Video with captions"
            onError={(error: unknown) => {
              console.error('Video Error in Results:', error);
              setVideoError(true);
            }}
            onLoad={() => console.log('Video loaded successfully in Results:', videoUri)}
          />
        ) : outputType === 'video' ? (
          <Text style={[styles.resultText, { color: currentTheme.textColor }]}>VIDEO: No video available</Text>
        ) : null}
      </View>
      {(outputType === 'audio' || outputType === 'video') && (audioUri || videoUri) && (
        <LinearGradient
          colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
          style={styles.button}
        >
          <TouchableOpacity
            onPress={handleDownloadShare}
            accessibilityLabel={outputType === 'audio' ? 'Download or Share Audio' : 'Download or Share Video'}
            accessibilityRole="button"
            disabled={isDownloading}
          >
            <Text style={styles.buttonText}>
              {isDownloading ? 'Processing...' : outputType === 'audio' ? 'Download/Share Audio' : 'Download/Share Video'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
      <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.button}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Upload')}
          accessibilityLabel="Upload Another Video"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Upload Another Video</Text>
        </TouchableOpacity>
      </LinearGradient>
      {isDownloading && <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />}
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultCard: {
    padding: 20,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    borderRadius: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: {
    marginTop: 15,
  },
});