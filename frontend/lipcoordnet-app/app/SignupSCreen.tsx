import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile, AuthError } from 'firebase/auth';

type RootStackParamList = {
  signup: undefined;
  login: undefined;
};

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleSignup = async () => {
    if (!username || !email || !password) {
      alert('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('SignupScreen - User created:', user.uid);
      await updateProfile(user, { displayName: username });
      console.log('SignupScreen - Display Name set to:', user.displayName);
      navigation.reset({ index: 0, routes: [{ name: 'login' }] });
    } catch (error) {
      const authError = error as AuthError; // Cast error to AuthError
      console.error('Signup Failed:', authError.message);
      alert('Signup Failed: ' + authError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/logo.jpg')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="VisioVox Logo"
      />
      <Animated.View style={[styles.formContainer, animatedStyle]}>
        <Text style={styles.title}>Create Account</Text>
        <View style={styles.inputContainer}>
          <Icon name="person" size={20} color="#60A5FA" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="#60A5FA" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#60A5FA" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>
        <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.button}>
          <TouchableOpacity
            onPress={handleSignup}
            disabled={isLoading}
            accessibilityLabel="Sign Up"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>
              {isLoading ? <ActivityIndicator color="#F9FAFB" /> : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
        <TouchableOpacity
          onPress={() => navigation.navigate('login')}
          disabled={isLoading}
          accessibilityLabel="Already have an account? Log in"
          accessibilityRole="button"
        >
          <Text style={styles.link}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1E3A8A',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#60A5FA',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
});