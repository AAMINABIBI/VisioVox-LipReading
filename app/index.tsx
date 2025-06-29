import React, { useEffect } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Platform } from 'react-native';

type RootStackParamList = {
  signup: undefined;
};

export default function Index() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'signup' }],
    });
  }, [navigation]);

  return null;
}