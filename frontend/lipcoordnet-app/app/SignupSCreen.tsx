import React, { useState, useContext } from 'react';
  import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
  import { ThemeContext } from '../ThemeContext';
  import { auth } from '../firebaseConfig';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { useNavigation, NavigationProp } from '@react-navigation/native';
  import { LinearGradient } from 'expo-linear-gradient';

  type RootParamList = {
    login: undefined;
  };

  export default function SignupScreen() {
    const { theme, themeStyles } = useContext(ThemeContext);
    const currentTheme = themeStyles[theme];
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigation = useNavigation<NavigationProp<RootParamList>>();

    const handleSignup = async () => {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        // Navigation to Home is handled by _layout.tsx
      } catch (err: unknown) {
        setError('Failed to sign up: ' + (err as Error).message);
      }
    };

    const navigateToLogin = () => {
      navigation.navigate('login');
    };

    return (
      <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.logo}
          accessibilityLabel="VisioVox Logo"
        />
        <Text style={[styles.header, { color: currentTheme.textColor }]}>Sign Up</Text>
        <TextInput
          style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.primaryColor }]}
          placeholder="Email"
          placeholderTextColor={theme === 'dark' ? '#AAA' : '#666'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.primaryColor }]}
          placeholder="Password"
          placeholderTextColor={theme === 'dark' ? '#AAA' : '#666'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <LinearGradient
          colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
          style={styles.button}
        >
          <TouchableOpacity onPress={handleSignup} accessibilityLabel="Sign Up" accessibilityRole="button">
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </LinearGradient>
        <TouchableOpacity onPress={navigateToLogin} accessibilityLabel="Go to Login">
          <Text style={[styles.link, { color: currentTheme.primaryColor }]}>
            Already have an account? Log In
          </Text>
        </TouchableOpacity>
        {error ? (
          <Text style={[styles.error, { color: theme === 'dark' ? '#FF4D4D' : '#D32F2F' }]}>
            {error}
          </Text>
        ) : null}
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
      marginBottom: 40,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    input: {
      width: '100%',
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      marginVertical: 10,
      fontSize: 16,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 40,
      borderRadius: 25,
      marginVertical: 10,
      width: '100%',
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    link: {
      marginTop: 10,
      fontSize: 14,
    },
    error: {
      fontSize: 14,
      marginTop: 10,
      textAlign: 'center',
    },
  });