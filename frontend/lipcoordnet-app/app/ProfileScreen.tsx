import React, { useState, useEffect } from 'react';
  import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
  import { useNavigation, NavigationProp } from '@react-navigation/native';
  import { useTheme } from '../ThemeContext';
  import { LinearGradient } from 'expo-linear-gradient';
  import { auth } from '../firebaseConfig';
  import Icon from 'react-native-vector-icons/MaterialIcons';

  type RootStackParamList = {
    Upload: undefined;
  };

  type User = {
    name?: string;
    email?: string;
  };

  export default function ProfileScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [userName, setUserName] = useState<string>('');
    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    useEffect(() => {
      if (auth.currentUser) {
        setUserName(auth.currentUser.displayName || '');
        setUser({
          name: auth.currentUser.displayName || '',
          email: auth.currentUser.email || '',
        });
      }
    }, []);

    const handleUpdateProfile = () => {
      if (auth.currentUser) {
        auth.currentUser
          .updateProfile({ displayName: userName })
          .then(() => {
            setUser((prev) => prev ? { ...prev, name: userName } : { name: userName, email: auth.currentUser?.email || '' });
            Alert.alert('Success', 'Profile updated successfully');
          })
          .catch((err: Error) => {
            console.log('Update failed:', err.message);
            Alert.alert('Update Failed', err.message);
          });
      }
    };

    const handleLogout = () => {
      auth.signOut()
        .then(() => {
          navigation.navigate('Upload');
        })
        .catch((err: Error) => {
          console.log('Logout failed:', err.message);
          Alert.alert('Logout Failed', err.message);
        });
    };

    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Upload')}
          accessibilityLabel="Go Back"
          accessibilityRole="button"
        >
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: currentTheme.textColor }]}>Profile</Text>
        {user && (
          <View>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Name:</Text>
            <TextInput
              style={[styles.input, { borderColor: currentTheme.primaryColor, color: currentTheme.textColor }]}
              value={userName}
              onChangeText={setUserName}
              placeholder="Enter your name"
              placeholderTextColor="#888"
            />
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Email:</Text>
            <Text style={[styles.text, { color: currentTheme.textColor }]}>{user.email}</Text>
          </View>
        )}
        <LinearGradient
          colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
          style={[styles.button, { backgroundColor: currentTheme.buttonBackground }]}
        >
          <TouchableOpacity onPress={handleUpdateProfile} accessibilityLabel="Update Profile">
            <Text style={styles.buttonText}>Update Profile</Text>
          </TouchableOpacity>
        </LinearGradient>
        <LinearGradient
          colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
          style={[styles.button, { backgroundColor: currentTheme.buttonBackground }]}
        >
          <TouchableOpacity onPress={handleLogout} accessibilityLabel="Logout">
            <Text style={styles.buttonText}>Logout</Text>
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
    label: {
      fontSize: 16,
      marginBottom: 5,
    },
    input: {
      width: '80%',
      height: 50,
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 15,
      paddingHorizontal: 10,
    },
    text: {
      fontSize: 16,
      marginBottom: 15,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 40,
      borderRadius: 25,
      marginVertical: 10,
      width: '80%',
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
  });