import React from 'react';
  import { NavigationContainer, useNavigation, useNavigationState, NavigationProp } from '@react-navigation/native';
  import { createStackNavigator } from '@react-navigation/stack';
  import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
  import Icon from 'react-native-vector-icons/MaterialIcons';
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
  import { useEffect, useState } from 'react';
  import { Text, View } from 'react-native';

  type RootStackParamList = {
    signup: undefined;
    login: undefined;
    Main: undefined;
    OutputSelection: { videoUri?: string; prediction?: string; outputType?: string };
    Results: { result?: string; outputType?: string };
  };

  type TabParamList = {
    Home: undefined;
    Upload: undefined;
    Profile: undefined;
    Settings: undefined;
    OutputStack: undefined;
  };

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
          <View>
            <Text>Something went wrong in OutputSelectionScreen. Please try again.</Text>
          </View>
        );
      }
      return this.props.children;
    }
  }

  function OutputStackNavigator() {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="OutputSelection"
          component={OutputSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  function TabNavigator() {
    return (
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#1E90FF',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Icon name="home" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Upload"
          component={UploadScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Icon name="upload" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Icon name="person" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Icon name="settings" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="OutputStack"
          component={OutputStackNavigator}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Icon name="play-arrow" color={color} size={size} />,
            tabBarStyle: { display: 'none' },
          }}
        />
      </Tab.Navigator>
    );
  }

  function AuthHandler() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const state = useNavigationState((state) => state);
    const [currentRoute, setCurrentRoute] = useState<string | null>(null);

    useEffect(() => {
      if (state && state.routes && state.routes.length > 0) {
        setCurrentRoute(state.routes[state.routes.length - 1].name);
        console.log('Current route updated:', state.routes[state.routes.length - 1].name);
      } else {
        setCurrentRoute(null);
        console.log('Current route is null (no routes)');
      }
    }, [state]);

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('Auth state changed - User:', user ? user.uid : 'null', 'Current route:', currentRoute);
        if (user) {
          console.log('User logged in, navigating to Main');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          console.log('User logged out, navigating to signup');
          if (currentRoute && currentRoute !== 'login' && currentRoute !== 'signup') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'signup' }],
            });
          }
        }
      });
      return unsubscribe;
    }, [navigation, currentRoute]);

    return null;
  }

  export default function Layout() {
    return (
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="signup">
            <Stack.Screen name="signup" component={SignupScreen} options={{ headerShown: false }} />
            <Stack.Screen name="login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          </Stack.Navigator>
          <AuthHandler />
        </NavigationContainer>
      </ThemeProvider>
    );
  }