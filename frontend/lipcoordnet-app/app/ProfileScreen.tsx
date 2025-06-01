import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { auth } from '../firebaseConfig';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, AuthError } from 'firebase/auth';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoadingUsername, setIsLoadingUsername] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      console.log('ProfileScreen - Initial Display Name:', user.displayName);
      setUsername(user.displayName || user.email?.split('@')[0] || 'User');
    }
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleUpdateUsername = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('No user is logged in.');
      return;
    }

    if (!username) {
      alert('Please enter a username.');
      return;
    }

    setIsLoadingUsername(true);
    try {
      console.log('Updating username to:', username);
      await updateProfile(user, { displayName: username });
      console.log('Username updated on server. New Display Name:', user.displayName);
      alert('Username updated successfully! Please log out and log back in to see the change on the home screen.');
    } catch (error) {
      const authError = error as AuthError; // Cast error to AuthError
      console.error('Failed to update username:', authError.message);
      alert('Failed to update username: ' + authError.message);
    } finally {
      setIsLoadingUsername(false);
    }
  };

  const handleUpdatePassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      alert('No user is logged in.');
      return;
    }

    if (!currentPassword || !newPassword) {
      alert('Please enter both current and new passwords.');
      return;
    }

    setIsLoadingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      alert('Password updated successfully! Please log out and log back in with your new password.');
      setNewPassword('');
      setCurrentPassword('');
    } catch (error) {
      const authError = error as AuthError; // Cast error to AuthError
      alert('Failed to update password: ' + authError.message);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.formContainer, animatedStyle]}>
        <Text style={styles.title}>Profile Settings</Text>
        <View style={styles.inputContainer}>
          <Icon name="person" size={20} color="#60A5FA" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#9CA3AF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!isLoadingUsername}
          />
        </View>
        <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.button}>
          <TouchableOpacity
            onPress={handleUpdateUsername}
            disabled={isLoadingUsername}
            accessibilityLabel="Update Username"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>
              {isLoadingUsername ? <ActivityIndicator color="#F9FAFB" /> : 'Update Username'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#60A5FA" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Current Password"
            placeholderTextColor="#9CA3AF"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            editable={!isLoadingPassword}
          />
        </View>
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#60A5FA" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#9CA3AF"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!isLoadingPassword}
          />
        </View>
        <LinearGradient colors={['#1E3A8A', '#60A5FA']} style={styles.button}>
          <TouchableOpacity
            onPress={handleUpdatePassword}
            disabled={isLoadingPassword}
            accessibilityLabel="Update Password"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>
              {isLoadingPassword ? <ActivityIndicator color="#F9FAFB" /> : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
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
    marginBottom: 20,
  },
  buttonText: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
});