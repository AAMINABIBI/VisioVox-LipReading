"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, ScrollView, Animated } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Icon from "react-native-vector-icons/MaterialIcons"
import { useTheme } from "../contexts/ThemeContext"
import { useAuth } from "../contexts/AuthContext"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

interface OnboardingSlide {
  id: number
  title: string
  subtitle: string
  description: string
  icon: string
  gradient: string[]
}

const onboardingData: OnboardingSlide[] = [
  {
    id: 1,
    title: "AI-Powered Lip Reading",
    subtitle: "Revolutionary Technology",
    description:
      "Transform silent videos into text using advanced artificial intelligence and machine learning algorithms.",
    icon: "psychology",
    gradient: ["#667eea", "#764ba2"],
  },
  {
    id: 2,
    title: "Upload & Analyze",
    subtitle: "Simple Process",
    description: "Upload any video file and let our AI analyze lip movements to generate accurate text predictions.",
    icon: "cloud-upload",
    gradient: ["#f093fb", "#f5576c"],
  },
  {
    id: 3,
    title: "Multiple Outputs",
    subtitle: "Versatile Results",
    description: "Get your results as text, downloadable audio speech, or video with synchronized captions.",
    icon: "dynamic-feed",
    gradient: ["#4facfe", "#00f2fe"],
  },
  {
    id: 4,
    title: "Ready to Start?",
    subtitle: "Join Thousands of Users",
    description:
      "Experience the future of accessibility technology. Create your account and start analyzing videos today.",
    icon: "rocket-launch",
    gradient: ["#43e97b", "#38f9d7"],
  },
]

const OnboardingScreen = () => {
  const { currentTheme } = useTheme()
  const { completeOnboarding } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [currentSlide])

  const handleNext = () => {
    if (currentSlide < onboardingData.length - 1) {
      const nextSlide = currentSlide + 1
      setCurrentSlide(nextSlide)
      scrollViewRef.current?.scrollTo({
        x: nextSlide * screenWidth,
        animated: true,
      })

      // Reset animations for new slide
      fadeAnim.setValue(0)
      slideAnim.setValue(50)

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      handleGetStarted()
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1
      setCurrentSlide(prevSlide)
      scrollViewRef.current?.scrollTo({
        x: prevSlide * screenWidth,
        animated: true,
      })
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const handleGetStarted = () => {
    completeOnboarding()
  }

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
    if (slideIndex !== currentSlide) {
      setCurrentSlide(slideIndex)
    }
  }

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <View key={slide.id} style={[styles.slide, { width: screenWidth }]}>
      <Animated.View
        style={[
          styles.slideContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Icon Section */}
        <View style={styles.iconSection}>
          <LinearGradient colors={slide.gradient} style={styles.iconContainer}>
            <Icon name={slide.icon} size={80} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={[styles.subtitle, { color: currentTheme.primaryColor }]}>{slide.subtitle}</Text>
          <Text style={[styles.title, { color: currentTheme.textColor }]}>{slide.title}</Text>
          <Text style={[styles.description, { color: currentTheme.textColor }]}>{slide.description}</Text>
        </View>

        {/* Features List for specific slides */}
        {slide.id === 3 && (
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <LinearGradient colors={["#10B981", "#059669"]} style={styles.featureIcon}>
                <Icon name="text-fields" size={16} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.featureText, { color: currentTheme.textColor }]}>Text Output</Text>
            </View>
            <View style={styles.featureItem}>
              <LinearGradient colors={["#3B82F6", "#1D4ED8"]} style={styles.featureIcon}>
                <Icon name="volume-up" size={16} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.featureText, { color: currentTheme.textColor }]}>Audio Speech</Text>
            </View>
            <View style={styles.featureItem}>
              <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.featureIcon}>
                <Icon name="video-library" size={16} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.featureText, { color: currentTheme.textColor }]}>Video Captions</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: currentTheme.primaryColor }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentSlide ? currentTheme.primaryColor : currentTheme.primaryColor + "30",
                  width: index === currentSlide ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentSlide > 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={[styles.navButton, { borderColor: currentTheme.primaryColor }]}
            >
              <Icon name="arrow-back" size={20} color={currentTheme.primaryColor} />
              <Text style={[styles.navButtonText, { color: currentTheme.primaryColor }]}>Previous</Text>
            </TouchableOpacity>
          )}

          <View style={styles.spacer} />

          <LinearGradient
            colors={
              currentSlide === onboardingData.length - 1
                ? ["#10B981", "#059669"]
                : [currentTheme.primaryColor, "#1D4ED8"]
            }
            style={styles.primaryButton}
          >
            <TouchableOpacity onPress={handleNext} style={styles.primaryButtonContent}>
              <Text style={styles.primaryButtonText}>
                {currentSlide === onboardingData.length - 1 ? "Get Started" : "Next"}
              </Text>
              <Icon
                name={currentSlide === onboardingData.length - 1 ? "rocket-launch" : "arrow-forward"}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: 20,
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconSection: {
    marginBottom: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  contentSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 38,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  featuresList: {
    gap: 16,
    alignItems: "center",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    transition: "all 0.3s ease",
  },
  navigationButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  spacer: {
    flex: 1,
  },
  primaryButton: {
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default OnboardingScreen
