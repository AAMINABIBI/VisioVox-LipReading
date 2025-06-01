import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type TabParamList = {
  Home: undefined;
  Upload: undefined;
  Profile: undefined;
  Settings: undefined;
  OutputStack: { screen: string; params: { videoUri?: string; prediction?: string; outputType?: string; audioUri?: string } };
};

export default function HomeScreen() {
  const { theme, themeStyles } = useTheme();
  const currentTheme = themeStyles[theme] || { backgroundColor: '#F3F4F6', textColor: '#1E3A8A', primaryColor: '#60A5FA' };
  const [isNavigating, setIsNavigating] = useState(false);
  const [userName, setUserName] = useState('User');
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<NavigationProp<TabParamList>>();

  const welcomeOpacity = useSharedValue(0);
  const welcomeTranslateY = useSharedValue(20);
  const bannerOpacity = useSharedValue(0);
  const bannerTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('User logged in:', user.uid);
        // Fetch username from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const displayName = data.displayName || user.email?.split('@')[0] || 'User';
            console.log('Fetched userName from Firestore:', displayName);
            setUserName(displayName);
          } else {
            console.log('No user document in Firestore, using default');
            setUserName(user.email?.split('@')[0] || 'User');
          }
        } catch (error) {
          console.error('Error fetching user data from Firestore:', error);
          setUserName(user.email?.split('@')[0] || 'User');
        }
      } else {
        console.log('No user logged in');
        setUserName('User');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      welcomeOpacity.value = withTiming(1, { duration: 800 });
      welcomeTranslateY.value = withTiming(0, { duration: 800 });
      setTimeout(() => {
        bannerOpacity.value = withTiming(1, { duration: 800 });
        bannerTranslateY.value = withTiming(0, { duration: 800 });
      }, 200);
      setTimeout(() => {
        buttonOpacity.value = withTiming(1, { duration: 800 });
        buttonTranslateY.value = withTiming(0, { duration: 800 });
      }, 400);
    }
  }, [isLoading]);

  const animatedWelcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
    transform: [{ translateY: welcomeTranslateY.value }],
  }));

  const animatedBannerStyle = useAnimatedStyle(() => ({
    opacity: bannerOpacity.value,
    transform: [{ translateY: bannerTranslateY.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));

  const handleNavigate = (destination: keyof TabParamList | { name: 'OutputStack'; params: { screen: string; params: { videoUri?: string; prediction?: string; outputType?: string; audioUri?: string } } }) => {
    setIsNavigating(true);
    setTimeout(() => {
      if (typeof destination === 'string') {
        navigation.navigate(destination);
      } else {
        navigation.navigate(destination);
      }
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 100);
      setIsNavigating(false);
    }, 500);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Animated.Text style={[styles.greeting, { color: currentTheme.textColor }, animatedWelcomeStyle]}>
        Welcome, {userName}!
      </Animated.Text>
      <Animated.View style={[styles.bannerContainer, animatedBannerStyle]}>
        <Image
          source={require('../assets/images/banner_image.png')}
          style={styles.banner}
          resizeMode="contain"
          accessibilityLabel="VisioVox Banner"
        />
      </Animated.View>
      <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
        <View style={styles.buttonRow}>
          <View style={styles.iconButtonWrapper}>
            <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.iconButton}>
              <TouchableOpacity
                onPress={() => handleNavigate('Upload')}
                accessibilityLabel="Upload a new video"
                accessibilityRole="button"
                disabled={isNavigating}
              >
                <Icon name="upload" size={30} color="#F9FAFB" />
              </TouchableOpacity>
            </LinearGradient>
            <View style={[styles.buttonLabelContainer, { backgroundColor: '#E5E7EB' }]}>
              <Text style={[styles.buttonLabel, { color: '#1E3A8A' }]}>Upload Video</Text>
            </View>
          </View>
          <View style={styles.iconButtonWrapper}>
            <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.iconButton}>
              <TouchableOpacity
                onPress={() => handleNavigate({ name: 'OutputStack', params: { screen: 'Results', params: {} } })}
                accessibilityLabel="View your lip-reading results"
                accessibilityRole="button"
                disabled={isNavigating}
              >
                <Icon name="visibility" size={30} color="#F9FAFB" />
              </TouchableOpacity>
            </LinearGradient>
            <View style={[styles.buttonLabelContainer, { backgroundColor: '#E5E7EB' }]}>
              <Text style={[styles.buttonLabel, { color: '#1E3A8A' }]}>View Results</Text>
            </View>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <View style={styles.iconButtonWrapper}>
            <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.iconButton}>
              <TouchableOpacity
                onPress={() => handleNavigate('Profile')}
                accessibilityLabel="Go to your profile"
                accessibilityRole="button"
                disabled={isNavigating}
              >
                <Icon name="person" size={30} color="#F9FAFB" />
              </TouchableOpacity>
            </LinearGradient>
            <View style={[styles.buttonLabelContainer, { backgroundColor: '#E5E7EB' }]}>
              <Text style={[styles.buttonLabel, { color: '#1E3A8A' }]}>Profile</Text>
            </View>
          </View>
          <View style={styles.iconButtonWrapper}>
            <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.iconButton}>
              <TouchableOpacity
                onPress={() => handleNavigate('Settings')}
                accessibilityLabel="Go to settings"
                accessibilityRole="button"
                disabled={isNavigating}
              >
                <Icon name="settings" size={30} color="#F9FAFB" />
              </TouchableOpacity>
            </LinearGradient>
            <View style={[styles.buttonLabelContainer, { backgroundColor: '#E5E7EB' }]}>
              <Text style={[styles.buttonLabel, { color: '#1E3A8A' }]}>Settings</Text>
            </View>
          </View>
        </View>
      </Animated.View>
      {isNavigating && (
        <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  bannerContainer: {
    width: '100%',
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
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
  banner: {
    width: '100%',
    height: 300,
    borderRadius: 15,
  },
  buttonContainer: {
    width: '100%',
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
  buttonLabelContainer: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});