import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigation, NavigationProp, RouteProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import UploadScreen from './UploadScreen';
import OutputSelectionScreen from './OutputSelectionScreen';
import ResultsScreen from './ResultsScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupSCreen';
import { ThemeProvider } from '../ThemeContext';
import { auth } from '../firebaseConfig';
import { Text, TouchableOpacity, Alert } from 'react-native';

export type RootStackParamList = {
  signup: undefined;
  login: undefined;
  Main: undefined;
  OutputSelection: { videoUri?: string; prediction?: string; outputType?: string; audioUri?: string };
  Results: { result?: string; outputType?: string; audioUri?: string; videoUri?: string };
};

export type TabParamList = {
  Home: undefined;
  Upload: undefined;
  Profile: undefined;
  Settings: undefined;
  OutputStack: { screen: keyof OutputStackParamList; params?: OutputStackParams };
  Logout: undefined;
};

type OutputStackParamList = {
  OutputSelection: { videoUri?: string; prediction?: string; outputType?: string; audioUri?: string };
  Results: { result?: string; outputType?: string; audioUri?: string; videoUri?: string };
};

type OutputStackParams = OutputStackParamList[keyof OutputStackParamList];

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
          <Text style={{ color: '#1E3A8A', fontSize: 16, marginBottom: 10 }}>Something went wrong. Please try again.</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })}>
            <Text style={{ color: '#60A5FA', fontSize: 14 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function OutputStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OutputSelection" component={OutputSelectionScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
}

function LogoutScreen({ navigation }: { navigation: NavigationProp<RootStackParamList> }) {
  useEffect(() => {
    const handleLogout = async () => {
      try {
        await auth.signOut();
        navigation.reset({ index: 0, routes: [{ name: 'signup' }] });
      } catch (error) {
        Alert.alert('Logout Failed', 'Please try again.');
      }
    };
    handleLogout();
  }, [navigation]);

  return null;
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: RouteProp<TabParamList, keyof TabParamList> }) => {
        const scale = useSharedValue(1);
        const opacity = useSharedValue(0.7);

        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ scale: scale.value }],
          opacity: opacity.value,
        }));

        return {
          headerShown: false,
          tabBarActiveTintColor: '#F9FAFB',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            paddingBottom: Platform.OS === 'ios' ? 10 : 20,
            paddingTop: 10,
            height: 80,
            position: 'absolute',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              },
              android: {
                elevation: 12,
              },
            }),
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={['#1E3A8A', '#60A5FA']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 5,
          },
          tabBarIconStyle: {
            marginTop: 5,
          },
          tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
            useEffect(() => {
              scale.value = withTiming(focused ? 1.2 : 1, { duration: 200 });
              opacity.value = withTiming(focused ? 1 : 0.7, { duration: 200 });
            }, [focused]);

            let iconName: string;
            if (route.name === 'Home') {
              iconName = 'home';
            } else if (route.name === 'Upload') {
              iconName = 'upload';
            } else if (route.name === 'Profile') {
              iconName = 'person';
            } else if (route.name === 'Settings') {
              iconName = 'settings';
            } else if (route.name === 'Logout') {
              iconName = 'logout';
            } else {
              iconName = 'play-arrow';
            }

            return (
              <View style={focused ? styles.activeTabContainer : null}>
                <Animated.View style={animatedStyle}>
                  <Icon name={iconName} size={size} color={color} />
                  {focused && (
                    <View style={styles.activeIndicator} />
                  )}
                </Animated.View>
              </View>
            );
          },
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Upload" component={UploadScreen} options={{ tabBarLabel: 'Upload' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
      <Tab.Screen name="Logout" component={LogoutScreen} options={{ tabBarLabel: 'Logout' }} />
      <Tab.Screen name="OutputStack" component={OutputStackNavigator} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}

function AuthHandler() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        setIsAuthenticated(false);
        navigation.reset({ index: 0, routes: [{ name: 'signup' }] });
      }
    });
    return unsubscribe;
  }, [navigation]);

  return null;
}

export default function Layout() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <ErrorBoundary>
          <SafeAreaView style={{ flex: 1 }}>
            <Stack.Navigator initialRouteName="signup" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="signup" component={SignupScreen} />
              <Stack.Screen name="login" component={LoginScreen} />
              <Stack.Screen name="Main" component={TabNavigator} />
            </Stack.Navigator>
            <AuthHandler />
          </SafeAreaView>
        </ErrorBoundary>
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  activeTabContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    width: 30,
    height: 3,
    backgroundColor: '#F9FAFB',
    borderRadius: 2,
    marginTop: 5,
    alignSelf: 'center',
  },
});