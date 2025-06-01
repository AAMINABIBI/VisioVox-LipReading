import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Platform, Alert } from 'react-native';
import { auth } from '../firebaseConfig';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { ThemeContext } from '../ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

type RootParamList = {
  login: undefined;
};

export default function SettingsScreen() {
  const { theme, toggleTheme, themeStyles } = useContext(ThemeContext);
  const currentTheme = themeStyles[theme];
  const navigation = useNavigation<NavigationProp<RootParamList>>();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await auth.signOut();
      console.log('Logout successful');
      navigation.reset({
        index: 0,
        routes: [{ name: 'login' }],
      });
    } catch (err: unknown) {
      console.error('Logout error:', (err as Error).message);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Text style={[styles.logoText, { color: currentTheme.textColor }]}>Settings</Text>
      <View style={[styles.settingsCard, { backgroundColor: currentTheme.cardBackground || currentTheme.backgroundColor }]}>
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: currentTheme.textColor }]}>
            Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: currentTheme.primaryColor }}
            thumbColor={currentTheme.buttonBackground || '#f4f3f4'}
            accessibilityLabel="Toggle theme between light and dark"
          />
        </View>
        <LinearGradient
          colors={theme === 'dark' ? ['#000080', '#1E90FF'] : ['#1E90FF', '#6200ea']}
          style={styles.button}
        >
          <TouchableOpacity
            onPress={handleLogout}
            accessibilityLabel="Log Out"
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Logging Out...' : 'Log Out'}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
      {isLoading && <ActivityIndicator size="large" color={currentTheme.primaryColor} style={styles.loader} />}
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
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  settingsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
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
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});