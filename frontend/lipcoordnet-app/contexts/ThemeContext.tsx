"use client"

import type React from "react"
import { createContext, useContext, useState, useMemo, type ReactNode } from "react"

// Define theme type
type Theme = "light" | "dark"

// Define theme styles interface
interface ThemeStyles {
  backgroundColor: string
  textColor: string
  primaryColor: string
  cardBackground: string
  background: string
  buttonBackground: string
  textOnPrimary: string
  textOnSecondary: string
  secondary: string
}

// Define theme objects
const lightTheme: ThemeStyles = {
  backgroundColor: "#F3F4F6",
  textColor: "#1E3A8A",
  primaryColor: "#3B82F6",
  cardBackground: "#FFFFFF",
  background: "#F9FAFB",
  buttonBackground: "#E5E7EB",
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#1E3A8A",
  secondary: "#E5E7EB",
}

const darkTheme: ThemeStyles = {
  backgroundColor: "#1F2937",
  textColor: "#F9FAFB",
  primaryColor: "#60A5FA",
  cardBackground: "#374151",
  background: "#111827",
  buttonBackground: "#4B5563",
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#F9FAFB",
  secondary: "#4B5563",
}

// Define context value type
interface ThemeContextType {
  theme: Theme
  themeStyles: Record<Theme, ThemeStyles>
  currentTheme: ThemeStyles
  toggleTheme: () => void
}

// Create context with proper default values
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  themeStyles: { light: lightTheme, dark: darkTheme },
  currentTheme: lightTheme,
  toggleTheme: () => {},
})

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("light")

  // Memoize themeStyles to prevent unnecessary re-renders
  const themeStyles = useMemo(() => ({ light: lightTheme, dark: darkTheme }), [])

  const currentTheme = themeStyles[theme]

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"))
  }

  const value: ThemeContextType = {
    theme,
    themeStyles,
    currentTheme,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export { ThemeContext }
