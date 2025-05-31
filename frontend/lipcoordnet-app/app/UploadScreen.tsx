import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

type RootStackParamList = {
  Upload: undefined;
  OutputStack: { screen: string; params: { videoUri?: string; prediction?: string; audioUri?: string } };
};

export default function UploadScreen() {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme];
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isUploading, setIsUploading] = useState(false);

  const pickDocument = async () => {
    console.log('Launching document picker...');
    setIsUploading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
      console.log('DocumentPicker result:', result);

      if (!result.canceled && result.assets) {
        const videoUri = result.assets[0].uri;
        console.log('Original videoUri:', videoUri);

        // Copy the video to a temporary location
        const tempUri = `${FileSystem.cacheDirectory}temp-video-${Date.now()}.mp4`;
        await FileSystem.copyAsync({ from: videoUri, to: tempUri });
        console.log('Copied video to:', tempUri);

        // Upload to backend
        console.log('Uploading video to backend...');
        const formData = new FormData();
        formData.append('file', {
          uri: tempUri,
          name: result.assets[0].name,
          type: result.assets[0].mimeType ?? 'video/mp4', // Default to 'video/mp4' if undefined
        } as any); // Use 'as any' to bypass strict typing for FormData.append

        const response = await fetch('http://192.168.100.19:8080/predict', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        console.log('Backend response:', data);

        // Navigate to OutputSelection with the correct params
        console.log('Navigating to OutputSelection with prediction:', data.prediction);
        navigation.navigate('OutputStack', {
          screen: 'OutputSelection',
          params: {
            videoUri: data.videoUri,
            prediction: data.prediction,
            audioUri: data.audioUri,
          },
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Image
        source={require('../assets/images/logo.jpg')}
        style={styles.logo}
        accessibilityLabel="VisioVox Logo"
      />
      <Text style={[styles.header, { color: currentTheme.textColor }]}>
        Upload Your Video
      </Text>
      <Text style={[styles.subHeader, { color: currentTheme.textColor }]}>
        Select a video to process with lip-reading technology
      </Text>
      {isUploading ? (
        <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />
      ) : (
        <LinearGradient
          colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
          style={styles.button}
        >
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
    width: 200,
    height: 60,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 25,
    alignItems: 'center',
    width: '80%',
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
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: {
    marginBottom: 20,
  },
});