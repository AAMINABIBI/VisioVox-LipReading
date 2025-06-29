import React, { createContext, useContext, useState, useMemo } from 'react';

// Define theme type
type Theme = 'light' | 'dark';

// Define theme styles interface
type ThemeStyles = {
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  cardBackground: string;
  background: string;
  buttonBackground: string;
};

// Define theme objects
const lightTheme: ThemeStyles = {
  backgroundColor: '#d5e9f9',
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

// Define context value type
type ThemeContextType = {
  theme: Theme;
  themeStyles: Record<Theme, ThemeStyles>;
  toggleTheme: () => void;
};

// Create context with proper default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themeStyles: { light: lightTheme, dark: darkTheme },
  toggleTheme: () => {}, // Will be overridden by provider
});

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  // Memoize themeStyles to prevent unnecessary re-renders
  const themeStyles = useMemo(() => ({ light: lightTheme, dark: darkTheme }), []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeStyles, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => useContext(ThemeContext);