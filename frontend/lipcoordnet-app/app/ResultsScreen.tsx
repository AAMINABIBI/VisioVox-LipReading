import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { VideoView } from 'expo-video';

type RootStackParamList = {
  Results: { result?: string; outputType?: string; audioUri?: string; videoUri?: string };
  Upload: undefined;
};

type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

export default function ResultsScreen() {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<ResultsScreenRouteProp>();
  const { result = '', outputType = 'text', audioUri, videoUri } = route.params || {};
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    console.log('Results Raw Params:', route.params);
    console.log('Results Processed Params:', { result, outputType, audioUri, videoUri });
    if (!result || !outputType) {
      console.log('No result or outputType, redirecting to Upload');
      navigation.navigate('Upload');
    }
  }, [result, outputType, audioUri, videoUri, navigation]);

  if (!result || !outputType) {
    return null;
  }

  const handleDownloadShare = async () => {
    if (outputType === 'audio' && audioUri) {
      try {
        // Download the audio file to a local URI
        const fileUri = audioUri.startsWith('file://') 
          ? audioUri 
          : await FileSystem.downloadAsync(
              audioUri,
              FileSystem.documentDirectory + 'output_audio.mp3'
            ).then(({ uri }) => uri);

        // Check if sharing is available
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('Sharing not available', 'Please try downloading manually.');
          return;
        }

        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'audio/mpeg',
          dialogTitle: 'Share or Download Audio',
          UTI: 'public.mp3',
        });
      } catch (error) {
        console.error('Download/Share error:', error);
        Alert.alert('Error', 'Failed to download or share the audio.');
      }
    } else if (outputType === 'video' && videoUri) {
      try {
        const fileUri = videoUri.startsWith('file://') 
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
      } catch (error) {
        console.error('Download/Share error:', error);
        Alert.alert('Error', 'Failed to download or share the video.');
      }
    } else {
      Alert.alert('No File', 'No audio or video file is available for this result.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Upload')}
        accessibilityLabel="Go Back"
        accessibilityRole="button"
      >
        <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
      </TouchableOpacity>
      <Text style={[styles.header, { color: currentTheme.textColor }]}>Results</Text>
      <View style={[styles.resultCard, { backgroundColor: currentTheme.cardBackground || currentTheme.backgroundColor }]}>
        {outputType === 'text' && (
          <Text style={[styles.resultText, { color: currentTheme.textColor }]}>
            TEXT: {result}
          </Text>
        )}
        {outputType === 'audio' && (
          <Text style={[styles.resultText, { color: currentTheme.textColor }]}>
            AUDIO: {audioUri ? 'Audio file available' : 'No audio available'}
          </Text>
        )}
        {outputType === 'video' && videoUri && !videoError ? (
          <VideoView
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
            isLooping
            accessibilityLabel="Video with captions"
            onError={(e) => {
              console.error('Video Error in Results:', e);
              setVideoError(true);
            }}
            onLoad={() => console.log('Video loaded successfully in Results:', videoUri)}
          />
        ) : outputType === 'video' ? (
          <Text style={[styles.resultText, { color: currentTheme.textColor }]}>
            VIDEO: No video available
          </Text>
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
          >
            <Text style={styles.buttonText}>
              {outputType === 'audio' ? 'Download/Share Audio' : 'Download/Share Video'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
      <LinearGradient
        colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
        style={styles.button}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('Upload')}
          accessibilityLabel="Upload Another Video"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Upload Another Video</Text>
        </TouchableOpacity>
      </LinearGradient>
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
    marginBottom: 20,
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
});