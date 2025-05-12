import React, { useContext } from 'react';
  import { View, Text, TouchableOpacity, StyleSheet, Platform, Switch } from 'react-native';
  import { auth } from '../firebaseConfig';
  import { useNavigation, NavigationProp } from '@react-navigation/native';
  import { ThemeContext } from '../ThemeContext';

  type RootParamList = {
    login: undefined;
  };

  export default function SettingsScreen() {
    const { theme, toggleTheme, themeStyles } = useContext(ThemeContext);
    const currentTheme = themeStyles[theme];
    const navigation = useNavigation<NavigationProp<RootParamList>>();

    const handleLogout = async () => {
      try {
        await auth.signOut();
        console.log('Logout successful');
        navigation.reset({
          index: 0,
          routes: [{ name: 'login' }],
        });
      } catch (err: unknown) {
        console.error('Logout error:', (err as Error).message);
      }
    };

    return (
      <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#1C2526' : '#F5F5F5' }]}>
        <Text style={[styles.logoText, { color: theme === 'dark' ? currentTheme.textColor : '#000000' }]}>Settings</Text>
        <View style={[styles.settingsCard, { backgroundColor: theme === 'dark' ? '#2A3439' : '#FFFFFF' }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme === 'dark' ? currentTheme.textColor : '#000000' }]}>
              Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme === 'dark' ? '#000080' : '#1E90FF' }}
              thumbColor={theme === 'dark' ? '#6B46C1' : '#f4f3f4'}
              accessibilityLabel="Toggle theme between light and dark"
            />
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme === 'dark' ? '#000080' : '#1E90FF' }]}
            onPress={handleLogout}
            accessibilityLabel="Log out"
          >
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
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
  });