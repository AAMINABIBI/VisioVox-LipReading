import React, { createContext, useContext, useState } from 'react';

  type Theme = 'light' | 'dark';

  type ThemeStyles = {
    backgroundColor: string;
    textColor: string;
    primaryColor: string;
    cardBackground: string;
    background: string;
    buttonBackground: string;
  };

  const lightTheme: ThemeStyles = {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    primaryColor: '#1E90FF',
    cardBackground: '#F5F5F5',
    background: '#F9F9F9',
    buttonBackground: '#E0E0E0',
  };

  const darkTheme: ThemeStyles = {
    backgroundColor: '#1A1A2E',
    textColor: '#FFFFFF',
    primaryColor: '#1E90FF',
    cardBackground: '#2E2E44',
    background: '#25253A',
    buttonBackground: '#404057',
  };

  export const ThemeContext = createContext<{
    theme: Theme;
    themeStyles: Record<Theme, ThemeStyles>;
    toggleTheme: () => void;
  }>({
    theme: 'light',
    themeStyles: { light: lightTheme, dark: darkTheme },
    toggleTheme: () => {},
  });

  export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');

    const toggleTheme = () => {
      setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
      <ThemeContext.Provider value={{ theme, themeStyles: { light: lightTheme, dark: darkTheme }, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  };

  export const useTheme = () => useContext(ThemeContext);