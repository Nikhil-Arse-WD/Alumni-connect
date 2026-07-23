import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

export default function BirthdayModal() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [isVisible, setIsVisible] = useState(false);
  const [firstName, setFirstName] = useState("Alumni");

  // Animation Values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (API_BASE) {
      checkBirthday();
    }
  }, []);

  // Trigger animations when visibility changes
  useEffect(() => {
    if (isVisible) {
      scale.value = withSpring(1, { damping: 14, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const checkBirthday = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) return;
      
      const user = JSON.parse(userData);
      if (!user?.id) return;

      // Extract First Name for personalization
      if (user.full_name) {
        setFirstName(user.full_name.split(" ")[0]);
      }

      // ── "SHOW ONCE PER YEAR" LOGIC ──
      const currentYear = new Date().getFullYear();
      const storageKey = `@bday_wished_${user.id}_${currentYear}`;
      const alreadyWished = await AsyncStorage.getItem(storageKey);
      
      if (alreadyWished === "true") return; // Silently exit if already shown this year

      // Fetch today's birthdays from server
      const res = await axios.get(`${API_BASE}/birthdays/today`);
      if (!res.data.success) return;

      const birthdays = res.data.birthdays || [];
      const myBirthday = birthdays.find((item: any) => Number(item.id) === Number(user.id));

      if (myBirthday) {
        setIsVisible(true);
        await AsyncStorage.setItem(storageKey, "true"); // Lock it so it doesn't show again
      }
    } catch (err) {
      console.log("Birthday check failed:", err);
    }
  };

  const closeModal = () => {
    setIsVisible(false);
  };

  return (
    <Modal
      transparent
      animationType="none" // Handled by Reanimated
      visible={isVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalWrapper, isDesktop && styles.modalWrapperWeb, animatedStyle]}>
          <LinearGradient
            colors={["#4F46E5", "#EC1D8F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            {/* Decorative Background Elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />

            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>🎂</Text>
            </View>

            <Text style={styles.title}>
              Happy Birthday,{"\n"}{firstName}!
            </Text>

            <Text style={styles.message}>
              Wishing you a fantastic day filled with joy and success from your entire SVIMSAA alumni family.
            </Text>

            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.85}
              onPress={closeModal}
            >
              <Text style={styles.buttonText}>Thank You!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)", // Rich dark slate overlay
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalWrapper: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#EC1D8F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 15,
  },
  modalWrapperWeb: {
    maxWidth: 420,
  },
  gradientCard: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    position: "relative",
  },
  
  // Decorative floating blobs
  decorCircle1: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.1)", top: -30, left: -30 },
  decorCircle2: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.08)", bottom: -20, right: -20 },
  decorCircle3: { position: "absolute", width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", top: 40, right: 30 },

  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  emoji: {
    fontSize: 40,
    ...Platform.select({
      ios: { lineHeight: 46 }, // Fixes emoji clipping on some iOS devices
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: "500",
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: "#EC1D8F",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});