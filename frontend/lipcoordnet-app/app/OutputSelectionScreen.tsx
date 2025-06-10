import React from 'react';
import { View, Button, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from './_layout';

export default function OutputSelectionScreen({ route }: { route: { params?: { videoUri?: string; prediction?: string; audioUri?: string } } }) {
  const { videoUri, prediction, audioUri } = route.params || {};
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {videoUri && (
        <Video
          source={{ uri: videoUri }}
          style={{ width: 300, height: 200 }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
        />
      )}
      <Text>{prediction || 'No prediction available'}</Text>
      <Button
        title="View Results"
        onPress={() => navigation.navigate('Results', { result: prediction, audioUri, videoUri })}
      />
    </View>
  );
}