import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { Video, AVPlaybackError } from 'expo-av';
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
  const currentTheme = themeStyles[theme];
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<OutputSelectionScreenRouteProp>();
  console.log('Raw route params:', route.params);
  
  // Fixed parameter extraction
  const { videoUri, prediction, audioUri, outputType = 'text' } = route.params || {};
  const processedVideoUri = videoUri && typeof videoUri === 'string' ? decodeURIComponent(videoUri) : undefined;

  const videoOpacity = useSharedValue(0);
  const errorOpacity = useSharedValue(0);
  const [isVideoLoading, setIsVideoLoading] = useState(!!processedVideoUri);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    console.log('OutputSelection Processed Params:', { videoUri, prediction, outputType, audioUri, processedVideoUri });
    if (processedVideoUri) {
      videoOpacity.value = withTiming(1, { duration: 800 });
      setTimeout(() => setIsVideoLoading(false), 800);
    } else {
      console.log('No processedVideoUri, redirecting to Upload');
      errorOpacity.value = withTiming(1, { duration: 500 });
      const timer = setTimeout(() => navigation.navigate('Upload'), 2000);
      return () => clearTimeout(timer);
    }
  }, [processedVideoUri, navigation]);

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
    console.log('Navigating to Results with params:', { result, outputType: selectedOutputType, audioUri, videoUri: processedVideoUri });
    navigation.navigate('Results', { 
      result, 
      outputType: selectedOutputType, 
      audioUri, 
      videoUri: processedVideoUri 
    });
  };

  if (!processedVideoUri) {
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
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.logo}
          accessibilityLabel="VisioVox Logo"
        />
        <Animated.Text style={[styles.errorText, animatedErrorStyle, { color: theme === 'dark' ? '#FF4D4D' : '#D32F2F' }]}>
          No video selected. Please upload a video first. Redirecting...
        </Animated.Text>
        <LinearGradient
          colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
          style={styles.button}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Upload')}
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
        onPress={() => navigation.navigate('Upload')}
        accessibilityLabel="Go Back"
        accessibilityRole="button"
      >
        <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
      </TouchableOpacity>
      <Image
        source={require('../assets/images/logo.jpg')}
        style={styles.logo}
        accessibilityLabel="VisioVox Logo"
      />
      <Text style={[styles.header, { color: currentTheme.textColor }]}>
        Selected Video
      </Text>
      {isVideoLoading ? (
        <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />
      ) : videoError || !processedVideoUri ? (
        <Text style={{ color: currentTheme.textColor }}>Video unavailable</Text>
      ) : (
        <Animated.View style={animatedVideoStyle}>
          <Video
            source={{ uri: processedVideoUri }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
            isLooping
            accessibilityLabel="Selected video preview"
            onError={(e: AVPlaybackError) => {
              console.error('Video Error in OutputSelection:', e);
              setVideoError(true);
            }}
            onLoad={() => console.log('Video loaded successfully:', processedVideoUri)}
          />
        </Animated.View>
      )}
      <Text style={[styles.header, { color: currentTheme.textColor }, styles.chooseOutputText]}>
        Choose Output Type
      </Text>
      <LinearGradient
        colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
        style={styles.button}
      >
        <TouchableOpacity
          onPress={() => handleOutputSelection('audio')}
          accessibilityLabel="Select Audio Output"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Audio</Text>
        </TouchableOpacity>
      </LinearGradient>
      <LinearGradient
        colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
        style={styles.button}
      >
        <TouchableOpacity
          onPress={() => handleOutputSelection('text')}
          accessibilityLabel="Select Text Output"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Text</Text>
        </TouchableOpacity>
      </LinearGradient>
      <LinearGradient
        colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
        style={styles.button}
      >
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
    width: 200,
    height: 60,
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
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
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 20,
  },
});