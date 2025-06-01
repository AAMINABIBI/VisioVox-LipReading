import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { Video, ResizeMode } from 'expo-video'; // Updated import from expo-av to expo-video
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

type RootStackParamList = {
  OutputStack: { screen: string; params: { videoUri?: string; prediction?: string; audioUri?: string; outputType?: string } };
  Upload: undefined;
  Results: { result?: string; outputType?: string; audioUri?: string; videoUri?: string };
};

type OutputSelectionScreenRouteProp = RouteProp<RootStackParamList, 'OutputStack'>;

export default function OutputSelectionScreen() {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || { backgroundColor: '#F3F4F6', textColor: '#1E3A8A', primaryColor: '#60A5FA' };
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<OutputSelectionScreenRouteProp>();
  const { videoUri, prediction, audioUri, outputType = 'text' } = route.params?.params || {};
  const processedVideoUri = videoUri && typeof videoUri === 'string' ? decodeURIComponent(videoUri) : undefined;
  const [isVideoLoading, setIsVideoLoading] = useState(!!processedVideoUri);
  const [videoError, setVideoError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (processedVideoUri) {
      videoOpacity.value = withTiming(1, { duration: 800 });
      timer = setTimeout(() => setIsVideoLoading(false), 800);
    } else {
      errorOpacity.value = withTiming(1, { duration: 500 });
      timer = setTimeout(() => navigation.navigate('Upload'), 2000); // Fixed navigation syntax
    }
    return () => clearTimeout(timer);
  }, [processedVideoUri, navigation]);

  const videoOpacity = useSharedValue(0);
  const errorOpacity = useSharedValue(0);

  const animatedVideoStyle = useAnimatedStyle(() => ({
    opacity: videoOpacity.value,
  }));

  const animatedErrorStyle = useAnimatedStyle(() => ({
    opacity: errorOpacity.value,
  }));

  const handleOutputSelection = (selectedOutputType: string) => {
    let result;
    switch (selectedOutputType) {
      case 'audio':
        result = audioUri ? 'Audio file available' : 'No audio available';
        break;
      case 'text':
        result = prediction || 'No prediction available';
        break;
      case 'video':
        result = processedVideoUri || 'No video available';
        break;
      default:
        result = 'Unknown output type';
    }
    navigation.navigate({ name: 'Results', params: { result, outputType: selectedOutputType, audioUri, videoUri: processedVideoUri } });
  };

  if (!processedVideoUri) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Upload')} // Fixed navigation syntax
          accessibilityLabel="Go Back to Upload"
          accessibilityRole="button"
        >
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.logo}
          accessibilityLabel="VisioVox Logo"
        />
        <Animated.Text style={[styles.errorText, animatedErrorStyle, { color: '#DC2626' }]}>
          No video selected. Redirecting to Upload...
        </Animated.Text>
        <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.button}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Upload')} // Fixed navigation syntax
            accessibilityLabel="Go to Upload Screen"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Go to Upload</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Upload')} // Fixed navigation syntax
        accessibilityLabel="Go Back to Upload"
        accessibilityRole="button"
      >
        <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
      </TouchableOpacity>
      <Image
        source={require('../assets/images/logo.jpg')}
        style={styles.logo}
        accessibilityLabel="VisioVox Logo"
      />
      <Text style={[styles.header, { color: currentTheme.textColor }]}>Selected Video</Text>
      {isVideoLoading ? (
        <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />
      ) : videoError || !processedVideoUri ? (
        <View>
          <Text style={{ color: currentTheme.textColor }}>{errorMessage || 'Video unavailable'}</Text>
          <TouchableOpacity onPress={() => setVideoError(false)}>
            <Text style={{ color: currentTheme.primaryColor, marginTop: 5 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={animatedVideoStyle}>
          <Video
            source={{ uri: processedVideoUri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping
            accessibilityLabel="Selected video preview"
            onError={(error: unknown) => {
              console.error('Video Error in OutputSelection:', error);
              setVideoError(true);
              setErrorMessage('Failed to load video. Please check the file.');
            }}
            onLoad={() => console.log('Video loaded successfully:', processedVideoUri)}
          />
        </Animated.View>
      )}
      <Text style={[styles.header, { color: currentTheme.textColor }, styles.chooseOutputText]}>Choose Output Type</Text>
      <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.button}>
        <TouchableOpacity
          onPress={() => handleOutputSelection('audio')}
          accessibilityLabel="Select Audio Output"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Audio</Text>
        </TouchableOpacity>
      </LinearGradient>
      <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.button}>
        <TouchableOpacity
          onPress={() => handleOutputSelection('text')}
          accessibilityLabel="Select Text Output"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Text</Text>
        </TouchableOpacity>
      </LinearGradient>
      <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.button}>
        <TouchableOpacity
          onPress={() => handleOutputSelection('video')}
          accessibilityLabel="Select Video Output"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Video</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}
// Styles remain unchanged

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
  logo: {
    width: 150,
    height: 50,
    marginBottom: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  chooseOutputText: {
    marginTop: 20,
    marginBottom: 10,
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginVertical: 8,
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
  errorText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 20,
  },
});