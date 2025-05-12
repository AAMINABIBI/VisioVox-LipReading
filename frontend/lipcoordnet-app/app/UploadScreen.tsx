import React, { useState, useEffect, useCallback } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
  import { useNavigation, NavigationProp, StackActions } from '@react-navigation/native';
  import * as DocumentPicker from 'expo-document-picker';
  import * as FileSystem from 'expo-file-system';
  import axios from 'axios';

  // Updated type definition to include initialParams
  type NavigationParams = {
    screen: string;
    params: { videoUri: string; prediction: any };
    initialParams?: { videoUri: string; prediction: any };
  };

  type RootParamList = {
    OutputStack: NavigationParams;
  };

  export default function UploadScreen() {
    const navigation = useNavigation<NavigationProp<RootParamList>>();
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const pickDocument = async () => {
      try {
        console.log('Launching document picker...');
        const result = await DocumentPicker.getDocumentAsync({
          type: 'video/*',
          copyToCacheDirectory: true,
        });
        console.log('DocumentPicker result:', JSON.stringify(result));

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const { uri } = result.assets[0];
          console.log('Original videoUri:', uri);

          const newUri = `${FileSystem.cacheDirectory}temp-video-${Date.now()}.mp4`;
          await FileSystem.copyAsync({ from: uri, to: newUri });
          console.log('Copied video to:', newUri);

          setVideoUri(newUri);
        }
      } catch (error: unknown) {
        console.error('Error in pickDocument:', error);
        Alert.alert('Error', 'Failed to pick video. Please try again.');
      }
    };

    const uploadVideo = useCallback(async () => {
      if (!videoUri) {
        Alert.alert('Error', 'Please select a video first.');
        return;
      }

      if (isUploading) {
        console.log('Upload in progress, aborting uploadVideo');
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        name: 'video.mp4',
        type: 'video/mp4',
      } as any);

      try {
        console.log('Uploading video to backend...');
        const response = await axios.post('http://192.168.100.19:8080/predict', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000,
        });
        console.log('Backend response:', response.data);

        const prediction = response.data.prediction;
        if (prediction) {
          console.log('Navigating to OutputSelection with prediction:', prediction);
          navigation.navigate('OutputStack', {
            screen: 'OutputSelection',
            params: {
              videoUri: encodeURIComponent(videoUri),
              prediction,
            },
            initialParams: {
              videoUri: encodeURIComponent(videoUri),
              prediction,
            },
          });
        } else {
          throw new Error('No prediction in response');
        }
      } catch (error: unknown) {
        console.error('Error in uploadVideo:', error);
        if ((error as any).response) {
          console.error('Response error:', (error as any).response.data);
        } else if ((error as any).request) {
          console.error('Request error:', (error as any).request);
        } else {
          console.error('Error message:', (error as Error).message);
        }
        Alert.alert('Upload Error', 'Failed to upload video. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }, [videoUri, isUploading, navigation]);

    useEffect(() => {
      return () => {
        setIsUploading(false);
      };
    }, []);

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Upload Video</Text>
        <TouchableOpacity style={styles.button} onPress={pickDocument}>
          <Text style={styles.buttonText}>Pick a Video</Text>
        </TouchableOpacity>
        {videoUri && (
          <TouchableOpacity
            style={[styles.button, isUploading && styles.buttonDisabled]}
            onPress={uploadVideo}
            disabled={isUploading}
          >
            <Text style={styles.buttonText}>{isUploading ? 'Uploading...' : 'Upload Video'}</Text>
          </TouchableOpacity>
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
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    button: {
      backgroundColor: '#007AFF',
      padding: 15,
      borderRadius: 10,
      marginVertical: 10,
    },
    buttonDisabled: {
      backgroundColor: '#A9A9A9',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
    },
  });