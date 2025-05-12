import React, { useEffect } from 'react';
  import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
  import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
  import { useTheme } from '../ThemeContext';
  import { LinearGradient } from 'expo-linear-gradient';
  import Icon from 'react-native-vector-icons/MaterialIcons';

  type RootStackParamList = {
    Results: { result?: string; outputType?: string };
    Upload: undefined;
  };

  type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

  export default function ResultsScreen() {
    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const route = useRoute<ResultsScreenRouteProp>();
    const { result = '', outputType = 'text' } = route.params || {};

    useEffect(() => {
      console.log('Results Raw Params:', route.params);
      console.log('Results Processed Params:', { result, outputType });
      if (!result || !outputType) {
        console.log('No result or outputType, redirecting to Upload');
        navigation.navigate('Upload');
      }
    }, [result, outputType, navigation]);

    if (!result || !outputType) {
      return null;
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
        <Text style={[styles.header, { color: currentTheme.textColor }]}>Results</Text>
        <View style={[styles.resultCard, { backgroundColor: currentTheme.cardBackground || currentTheme.backgroundColor }]}>
          <Text style={[styles.resultText, { color: currentTheme.textColor }]}>
            {outputType.toUpperCase()}: {result}
          </Text>
        </View>
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