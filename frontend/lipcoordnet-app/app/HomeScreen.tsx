import React, { useEffect, useState } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
  import { useNavigation, NavigationProp } from '@react-navigation/native';
  import { useTheme } from '../ThemeContext';
  import { auth } from '../firebaseConfig';
  import Icon from 'react-native-vector-icons/MaterialIcons';
  import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
  import { LinearGradient } from 'expo-linear-gradient';

  type TabParamList = {
    Home: undefined;
    Upload: undefined;
    Profile: undefined;
    Settings: undefined;
    OutputStack: { screen: string; params: { videoUri?: string; prediction?: string; outputType?: string } };
  };

  export default function HomeScreen() {
    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];
    const [userName, setUserName] = useState('User');
    const navigation = useNavigation<NavigationProp<TabParamList>>();

    const bannerOpacity = useSharedValue(0);
    const bannerTranslateX = useSharedValue(-50);
    const welcomeOpacity = useSharedValue(0);
    const welcomeTranslateY = useSharedValue(20);
    const buttonOpacity = useSharedValue(0);
    const buttonTranslateY = useSharedValue(50);

    useEffect(() => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUserName(currentUser.displayName || currentUser.email || 'User');
      }
    }, []);

    useEffect(() => {
      bannerOpacity.value = withTiming(1, { duration: 800 });
      bannerTranslateX.value = withTiming(0, { duration: 800 });
      setTimeout(() => {
        welcomeOpacity.value = withTiming(1, { duration: 800 });
        welcomeTranslateY.value = withTiming(0, { duration: 800 });
      }, 200);
      setTimeout(() => {
        buttonOpacity.value = withTiming(1, { duration: 800 });
        buttonTranslateY.value = withTiming(0, { duration: 800 });
      }, 400);
    }, []);

    const animatedBannerStyle = useAnimatedStyle(() => ({
      opacity: bannerOpacity.value,
      transform: [{ translateX: bannerTranslateX.value }],
    }));

    const animatedWelcomeStyle = useAnimatedStyle(() => ({
      opacity: welcomeOpacity.value,
      transform: [{ translateY: welcomeTranslateY.value }],
    }));

    const animatedButtonStyle = useAnimatedStyle(() => ({
      opacity: buttonOpacity.value,
      transform: [{ translateY: buttonTranslateY.value }],
    }));

    return (
      <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <Animated.View style={[styles.bannerContainer, animatedBannerStyle]}>
          <Image
            source={require('../assets/images/banner_image.png')}
            style={styles.banner}
            resizeMode="stretch"
            accessibilityLabel="VisioVox Banner"
          />
        </Animated.View>
        <Animated.Text style={[styles.greeting, { color: currentTheme.textColor }, animatedWelcomeStyle]}>
          Welcome, {userName}!
        </Animated.Text>
        <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
          <View style={styles.buttonRow}>
            <View style={styles.iconButtonWrapper}>
              <LinearGradient
                colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
                style={styles.iconButton}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate('Upload')}
                  accessibilityLabel="Upload Video"
                  accessibilityRole="button"
                >
                  <Icon name="upload" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
              <View style={[styles.buttonLabelContainer, { backgroundColor: theme === 'dark' ? '#000000' : '#D3D3D3' }]}>
                <Text style={[styles.buttonLabel, { color: '#FFFFFF' }]}>Upload Video</Text>
              </View>
            </View>
            <View style={styles.iconButtonWrapper}>
              <LinearGradient
                colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
                style={styles.iconButton}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate('OutputStack', { screen: 'Results', params: {} })}
                  accessibilityLabel="View Results"
                  accessibilityRole="button"
                >
                  <Icon name="visibility" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
              <View style={[styles.buttonLabelContainer, { backgroundColor: theme === 'dark' ? '#000000' : '#D3D3D3' }]}>
                <Text style={[styles.buttonLabel, { color: '#FFFFFF' }]}>View Results</Text>
              </View>
            </View>
          </View>
          <View style={styles.buttonRow}>
            <View style={styles.iconButtonWrapper}>
              <LinearGradient
                colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
                style={styles.iconButton}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate('Profile')}
                  accessibilityLabel="Go to Profile"
                  accessibilityRole="button"
                >
                  <Icon name="person" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
              <View style={[styles.buttonLabelContainer, { backgroundColor: theme === 'dark' ? '#000000' : '#D3D3D3' }]}>
                <Text style={[styles.buttonLabel, { color: '#FFFFFF' }]}>Profile</Text>
              </View>
            </View>
            <View style={styles.iconButtonWrapper}>
              <LinearGradient
                colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
                style={styles.iconButton}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate('Settings')}
                  accessibilityLabel="Go to Settings"
                  accessibilityRole="button"
                >
                  <Icon name="settings" size={30} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
              <View style={[styles.buttonLabelContainer, { backgroundColor: theme === 'dark' ? '#000000' : '#D3D3D3' }]}>
                <Text style={[styles.buttonLabel, { color: '#FFFFFF' }]}>Settings</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 0,
    },
    bannerContainer: {
      width: '100%',
      overflow: 'hidden',
      marginBottom: 20,
    },
    banner: {
      width: '100%',
      height: 320,
    },
    greeting: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 30,
    },
    buttonContainer: {
      width: '100%',
      paddingHorizontal: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    iconButtonWrapper: {
      alignItems: 'center',
      width: '48%',
    },
    iconButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
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
    buttonLabelContainer: {
      marginTop: 10,
      paddingVertical: 5,
      paddingHorizontal: 15,
      borderRadius: 15,
    },
    buttonLabel: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
    },
  });