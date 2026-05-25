import React, { useEffect, useRef } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";

import {
  Animated,
  Dimensions,
  Image,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

const { width } = Dimensions.get("window");

// ✅ Responsive font function
const scaleFont = (size: number) => size / PixelRatio.getFontScale();

export default function AboutScreen() {

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <Header />

      {/* 🔥 HERO */}
      <Animated.View
        style={[
          styles.hero,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.heroTitle} allowFontScaling={false}>
          About Our Alumni Association
        </Text>
        <Text style={styles.heroSub} allowFontScaling={false}>
          Building bridges • Creating opportunities • Inspiring excellence
        </Text>
      </Animated.View>

      {/* 🔥 IMAGE */}
      <Animated.View
        style={[
          styles.section,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require("../../assets/Alumni_Pics/img1.jpg")}
          style={styles.image}
        />
        <Text style={styles.heading} allowFontScaling={false}>
          Welcome to SVIM Alumni Association
        </Text>
        <Text style={styles.text} allowFontScaling={false}>
          We are a vibrant community of alumni helping each other grow and stay connected.
        </Text>
      </Animated.View>

      {/* 🔥 CARDS */}
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <Text style={styles.cardTitle} allowFontScaling={false}>Our Vision</Text>
        <Text style={styles.cardText} allowFontScaling={false}>
          An Institute of Choice in Higher Education.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <Text style={styles.cardTitle} allowFontScaling={false}>Our Mission</Text>
        <Text style={styles.cardText} allowFontScaling={false}>• Quality Education</Text>
        <Text style={styles.cardText} allowFontScaling={false}>• Value Based Learning</Text>
        <Text style={styles.cardText} allowFontScaling={false}>• Leadership & Innovation</Text>
      </Animated.View>

      {/* 🔥 SERVICES */}
      <Text style={styles.sectionTitle} allowFontScaling={false}>
        What We Do
      </Text>

      <View style={styles.grid}>
        {["Events", "Career", "Community", "Scholarship"].map((item, index) => {
          const anim = new Animated.Value(0);

          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            delay: index * 200,
            useNativeDriver: true,
          }).start();

          return (
            <Animated.View
              key={index}
              style={[
                styles.serviceCard,
                {
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.serviceTitle} allowFontScaling={false}>
                {item}
              </Text>
              <Text style={styles.serviceText} allowFontScaling={false}>
                {item === "Events"
                  ? "Networking & Meetups"
                  : item === "Career"
                  ? "Mentorship & Jobs"
                  : item === "Community"
                  ? "Social Work"
                  : "Support Students"}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      {/* 🔥 STATS */}
      <Animated.View
        style={[
          styles.stats,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.stat} allowFontScaling={false}>1000+ Alumni</Text>
        <Text style={styles.stat} allowFontScaling={false}>50+ Events</Text>
        <Text style={styles.stat} allowFontScaling={false}>10+ Countries</Text>
      </Animated.View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },

  hero: {
    backgroundColor: "#0d6efd",
    padding: 25,
    alignItems: "center",
  },

  heroTitle: {
    color: "#fff",
    fontSize: scaleFont(22),
    fontWeight: "bold",
    textAlign: "center",
  },

  heroSub: {
    color: "#fff",
    marginTop: 10,
    fontSize: scaleFont(13),
    textAlign: "center",
  },

  section: {
    padding: 15,
    alignItems: "center",
  },

  image: {
    width: width - 30,
    height: 200,
    borderRadius: 10,
  },

  heading: {
    fontSize: scaleFont(18),
    fontWeight: "bold",
    marginTop: 10,
  },

  text: {
    textAlign: "center",
    marginTop: 5,
    fontSize: scaleFont(13),
  },

  card: {
    backgroundColor: "#f8f9fa",
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },

  cardTitle: {
    fontSize: scaleFont(16),
    fontWeight: "bold",
  },

  cardText: {
    marginTop: 5,
    fontSize: scaleFont(13),
  },

  sectionTitle: {
    textAlign: "center",
    fontSize: scaleFont(20),
    fontWeight: "bold",
    marginTop: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
  },

  serviceCard: {
    width: "45%",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    elevation: 3,
  },

  serviceTitle: {
    fontWeight: "bold",
    fontSize: scaleFont(14),
  },

  serviceText: {
    marginTop: 5,
    fontSize: scaleFont(12),
  },

  stats: {
    backgroundColor: "#0d6efd",
    padding: 20,
    alignItems: "center",
  },

  stat: {
    color: "#fff",
    fontSize: scaleFont(15),
    marginVertical: 3,
  },
});