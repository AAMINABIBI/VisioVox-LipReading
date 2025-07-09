"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { auth } from "../firebaseConfig"
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface AuthContextType {
  user: import("firebase/auth").User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  hasCompletedOnboarding: boolean
  completeOnboarding: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<import("firebase/auth").User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const onboardingStatus = await AsyncStorage.getItem("hasCompletedOnboarding")
        setHasCompletedOnboarding(onboardingStatus === "true")
      } else {
        setHasCompletedOnboarding(false)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error("Login error:", error)
      throw new Error(error.message || "Failed to log in")
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string): Promise<void> => {
    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error("Signup error:", error)
      throw new Error(error.message || "Failed to sign up")
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setLoading(true)
    try {
      await signOut(auth)
      await AsyncStorage.removeItem("hasCompletedOnboarding")
    } catch (error: any) {
      console.error("Logout error:", error)
      throw new Error(error.message || "Failed to log out")
    } finally {
      setLoading(false)
    }
  }

  const completeOnboarding = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true")
      setHasCompletedOnboarding(true)
    } catch (error) {
      console.error("Failed to save onboarding status:", error)
    }
  }

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    loading,
    hasCompletedOnboarding,
    completeOnboarding,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }