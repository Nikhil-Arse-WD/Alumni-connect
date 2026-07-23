import React, { useEffect, useRef } from "react";
import Footer from "../components/Footer";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import {
  Animated,
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const isWeb = width >= 768;

// ✅ Responsive font scaling
const scaleFont = (size: number) =>
  size / PixelRatio.getFontScale();

export default function AboutScreen() {
  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

  const slideAnim = useRef(
    new Animated.Value(40)
  ).current;

  const scaleAnim = useRef(
    new Animated.Value(0.92)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const services = [
    {
      title: "Events",
      icon: "calendar-outline",
      desc: "Networking sessions & alumni meetups",
      color: "#EEF2FF",
      iconColor: "#4F46E5",
    },

    {
      title: "Career",
      icon: "briefcase-outline",
      desc: "Mentorship, guidance & opportunities",
      color: "#DCFCE7",
      iconColor: "#16A34A",
    },

    {
      title: "Community",
      icon: "people-outline",
      desc: "Social initiatives & alumni bonding",
      color: "#FCE7F3",
      iconColor: "#DB2777",
    },

    {
      title: "Scholarship",
      icon: "school-outline",
      desc: "Helping and supporting students",
      color: "#FEF3C7",
      iconColor: "#D97706",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 30,
      }}
    >
      {/* HERO */}
      <LinearGradient
        colors={[
          "#312EBA",
          "#5B21B6",
          "#EC1D8F",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.hero,
          isWeb && styles.heroWeb,
        ]}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim,
              },
            ],
          }}
        >
          <View style={styles.heroBadge}>
            <Ionicons
              name="people-outline"
              size={18}
              color="#fff"
            />

            <Text style={styles.heroBadgeText}>
              SVIMAA
            </Text>
          </View>

          <Text
            style={styles.heroTitle}
            allowFontScaling={false}
          >
            About Our Alumni Network
          </Text>

          <Text
            style={styles.heroSub}
            allowFontScaling={false}
          >
            Building bridges • Creating opportunities •
            Inspiring excellence
          </Text>
        </Animated.View>

        {/* STATS */}
        <View style={styles.heroStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              1000+
            </Text>

            <Text style={styles.statLabel}>
              Alumni
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              50+
            </Text>

            <Text style={styles.statLabel}>
              Events
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              10+
            </Text>

            <Text style={styles.statLabel}>
              Countries
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* IMAGE SECTION */}
      <Animated.View
        style={[
          styles.imageSection,
          {
            opacity: fadeAnim,
            transform: [
              {
                scale: scaleAnim,
              },
            ],
          },
        ]}
      >
        <Image
          source={require("../../assets/Alumni_Pics/img3.jpg")}
          style={styles.image}
        />

        <View style={styles.imageOverlay}>
          <Text
            style={styles.imageTitle}
            allowFontScaling={false}
          >
            Welcome to SVIMAA
          </Text>

          <Text
            style={styles.imageText}
            allowFontScaling={false}
          >
            A vibrant alumni community helping members
            stay connected, grow professionally, and
            support future generations.
          </Text>
        </View>
      </Animated.View>

      {/* VISION + MISSION */}
      <View
        style={[
          styles.infoWrapper,
          isWeb && styles.infoWrapperWeb,
        ]}
      >
        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.cardIcon}>
            <Ionicons
              name="eye-outline"
              size={24}
              color="#4F46E5"
            />
          </View>

          <Text
            style={styles.cardTitle}
            allowFontScaling={false}
          >
            Our Vision
          </Text>

          <Text
            style={styles.cardText}
            allowFontScaling={false}
          >
            To become an institute of excellence and
            create a strong lifelong alumni network that
            empowers students and graduates globally.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.cardIcon}>
            <Ionicons
              name="rocket-outline"
              size={24}
              color="#EC4899"
            />
          </View>

          <Text
            style={styles.cardTitle}
            allowFontScaling={false}
          >
            Our Mission
          </Text>

          <View style={{ marginTop: 10 }}>
            {[
              "Quality Education",
              "Value Based Learning",
              "Leadership & Innovation",
              "Professional Growth",
            ].map((item, index) => (
              <View
                key={index}
                style={styles.missionRow}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#16A34A"
                />

                <Text
                  style={styles.missionText}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      {/* WHAT WE DO */}
      <Text
        style={styles.sectionTitle}
        allowFontScaling={false}
      >
        What We Do
      </Text>

      <Text style={styles.sectionSub}>
        Connecting alumni, students, and opportunities
        together.
      </Text>

      <View
        style={[
          styles.grid,
          isWeb && styles.gridWeb,
        ]}
      >
        {services.map((item, index) => {
          const anim = new Animated.Value(0);

          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            delay: index * 150,
            useNativeDriver: true,
          }).start();

          return (
            <Animated.View
              key={index}
              style={[
                styles.serviceCard,
                isWeb && styles.serviceCardWeb,
                {
                  opacity: anim,
                  transform: [
                    {
                      translateY:
                        anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0],
                        }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.serviceIcon,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={26}
                  color={item.iconColor}
                />
              </View>

              <Text
                style={styles.serviceTitle}
                allowFontScaling={false}
              >
                {item.title}
              </Text>

              <Text
                style={styles.serviceText}
                allowFontScaling={false}
              >
                {item.desc}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      {/* CTA */}
      <LinearGradient
        colors={[
          "#4F46E5",
          "#7C3AED",
          "#EC4899",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cta}
      >
        <Text style={styles.ctaTitle}>
          Together We Grow Stronger
        </Text>

        <Text style={styles.ctaText}>
          Our alumni association builds lifelong
          relationships through mentorship, networking,
          and collaboration.
        </Text>
      </LinearGradient>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    marginBottom:Platform.OS === "web" ?0:30
  },

  // HERO
  hero: {
    paddingBottom: 90,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },

  heroWeb: {
    minHeight: 430,
    justifyContent: "center",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor:
      "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 30,
    marginTop:Platform.OS === "web" ?0:20,
    gap: 8,
  },

  heroBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  heroTitle: {
    fontSize: isWeb
      ? scaleFont(44)
      : scaleFont(30),
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },

  heroSub: {
    marginTop: 14,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    lineHeight: 24,
    fontSize: scaleFont(14),
    maxWidth: 700,
  },

  // STATS
  heroStats: {
    flexDirection: "row",
    gap: 14,
    marginTop: 34,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  statCard: {
    backgroundColor:
      "rgba(255,255,255,0.12)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 100,
  },

  statNumber: {
    color: "#fff",
    fontSize: scaleFont(22),
    fontWeight: "900",
  },

  statLabel: {
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    fontSize: scaleFont(12),
  },

  // IMAGE
  imageSection: {
    marginHorizontal: 18,
    marginTop: -80,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 6,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  image: {
    width: "100%",
    height: isWeb ? 420 : 240,
  },

  imageOverlay: {
    padding: 24,
  },

  imageTitle: {
    fontSize: scaleFont(22),
    fontWeight: "800",
    color: "#0F172A",
  },

  imageText: {
    marginTop: 10,
    lineHeight: 24,
    color: "#64748B",
    fontSize: scaleFont(14),
  },

  // INFO
  infoWrapper: {
    paddingHorizontal: 18,
    marginTop: 26,
  },

  infoWrapperWeb: {
    flexDirection: "row",
    gap: 18,
  },

  infoCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 24,
    marginBottom: 18,
    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  cardIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: scaleFont(20),
    fontWeight: "800",
    color: "#0F172A",
  },

  cardText: {
    marginTop: 12,
    lineHeight: 24,
    color: "#64748B",
    fontSize: scaleFont(14),
  },

  missionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },

  missionText: {
    color: "#475569",
    fontSize: scaleFont(14),
    fontWeight: "600",
  },

  // SECTION
  sectionTitle: {
    textAlign: "center",
    fontSize: scaleFont(28),
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 16,
  },

  sectionSub: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 22,
  },

  // SERVICES
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginTop: 20,
  },

  gridWeb: {
    justifyContent: "center",
    gap: 18,
  },

  serviceCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    marginBottom: 16,

    elevation: 3,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  serviceCardWeb: {
    width: 260,
  },

  serviceIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  serviceTitle: {
    fontSize: scaleFont(16),
    fontWeight: "800",
    color: "#0F172A",
  },

  serviceText: {
    marginTop: 8,
    color: "#64748B",
    lineHeight: 22,
    fontSize: scaleFont(13),
  },

  // CTA
  cta: {
    marginHorizontal: 18,
    marginTop: 10,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom:10
  },

  ctaTitle: {
    color: "#fff",
    fontSize: scaleFont(26),
    fontWeight: "900",
    textAlign: "center",
  },

  ctaText: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 24,
    maxWidth: 700,
  },
});