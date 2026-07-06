import React from "react";
import Footer from "../components/Footer";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";


export default function ContactScreen() {
  const { width } = useWindowDimensions();
  const router= useRouter();
  const isWeb = width >= 768;

  const CONTACTS = [
    {
      name: "Mr. Sujeet Singhal",
      role: "Contact Person",
      phone: "+91 9753545667",
      whatsapp: "919753545667",
      location: "Indore, MP",
      color: ["#4F46E5", "#7C3AED"],
    },
    {
      name: "Mr. Upendra Jain",
      role: "Contact Person",
      phone: "+91 9827044277",
      whatsapp: "919827044277",
      location: "Indore, MP",
      color: ["#EC4899", "#DB2777"],
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO */}
      <LinearGradient
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.hero,
          isWeb && styles.heroWeb,
        ]}
      >
        <View style={styles.heroBadge}>
          <Ionicons
            name="mail-open-outline"
            size={20}
            color="#fff"
          />
          <Text style={styles.heroBadgeText}>
            CONTACT SUPPORT
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          Get In Touch
        </Text>

        <Text style={styles.heroText}>
          We’d love to hear from you. Reach out anytime for
          alumni support, events, guidance, or collaboration.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Support</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2+</Text>
            <Text style={styles.statLabel}>Contacts</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>
      </LinearGradient>

      {/* INTRO */}
      <View style={styles.introCard}>
        <Ionicons
          name="information-circle-outline"
          size={24}
          color="#4F46E5"
        />

        <Text style={styles.introText}>
          If you have any questions, suggestions, or need
          assistance regarding the Alumni Portal, feel free
          to contact our support team.
        </Text>
      </View>

      {/* CONTACTS */}
      <View
        style={[
          styles.contactWrapper,
          isWeb && styles.contactWrapperWeb,
        ]}
      >
        {CONTACTS.map((item, index) => (
          <LinearGradient
            key={index}
            colors={item.color as any}
            style={[
              styles.contactCard,
              isWeb && styles.contactCardWeb,
            ]}
          >
            <View style={styles.contactTop}>
              <View style={styles.avatar}>
                <Ionicons
                  name="person"
                  size={28}
                  color="#fff"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>
                  {item.name}
                </Text>

                <Text style={styles.contactRole}>
                  {item.role}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                Linking.openURL(`tel:${item.phone}`)
              }
            >
              <Ionicons
                name="call-outline"
                size={18}
                color="#fff"
              />

              <Text style={styles.actionText}>
                {item.phone}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/${item.whatsapp}`
                )
              }
            >
              <Ionicons
                name="logo-whatsapp"
                size={18}
                color="#fff"
              />

              <Text style={styles.actionText}>
                WhatsApp Chat
              </Text>
            </TouchableOpacity>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#fff"
              />

              <Text style={styles.locationText}>
                {item.location}
              </Text>
            </View>
          </LinearGradient>
        ))}
      </View>

      {/* INFO GRID */}
      <View
        style={[
          styles.infoGrid,
          isWeb && styles.infoGridWeb,
        ]}
      >
        {/* EMAIL */}
        <View
          style={[
            styles.infoCard,
            isWeb && styles.infoCardWeb,
          ]}
        >
          <View style={styles.infoIcon}>
            <Ionicons
              name="mail-outline"
              size={26}
              color="#4F46E5"
            />
          </View>

          <Text style={styles.infoTitle}>
            Email Us
          </Text>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "mailto:svimaa@svimi.org"
              )
            }
          >
            <Text style={styles.infoLink}>
              svimaa@svimi.org
            </Text>
          </TouchableOpacity>
        </View>

        {/* HOURS */}
        <View
          style={[
            styles.infoCard,
            isWeb && styles.infoCardWeb,
          ]}
        >
          <View style={styles.infoIcon}>
            <Ionicons
              name="time-outline"
              size={26}
              color="#EC4899"
            />
          </View>

          <Text style={styles.infoTitle}>
            Office Hours
          </Text>

          <Text style={styles.infoText}>
            Monday - Friday
          </Text>

          <Text style={styles.infoSub}>
            9:00 AM - 6:00 PM
          </Text>

          <Text style={[styles.infoText, { marginTop: 10 }]}>
            Saturday
          </Text>

          <Text style={styles.infoSub}>
            10:00 AM - 4:00 PM
          </Text>

          <Text style={styles.closedText}>
            Sunday Closed
          </Text>
        </View>

        {/* LOCATION */}
        <View
          style={[
            styles.infoCard,
            isWeb && styles.infoCardWeb,
          ]}
        >
          <View style={styles.infoIcon}>
            <Ionicons
              name="location-outline"
              size={26}
              color="#16A34A"
            />
          </View>

          <Text style={styles.infoTitle}>
            Visit Us
          </Text>

          <Text style={styles.infoText}>
            SVIM Alumni Association
          </Text>

          <Text style={styles.infoSub}>
            Indore, MP - 452001
          </Text>

          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() =>
              Linking.openURL(
                "https://www.google.com/maps/dir/?api=1&destination=Shri+Vaishnav+Institute+of+Management+%26+Sciences+Indore"
              )
            }
          >
            <Ionicons
              name="navigate-outline"
              size={18}
              color="#fff"
            />

            <Text style={styles.mapText}>
              Get Directions
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CTA */}
      <LinearGradient
        colors={["#4F46E5", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cta}
      >
        <Text style={styles.ctaTitle}>
          Stay Connected With Alumni Network
        </Text>

        <Text style={styles.ctaText}>
          Join discussions, attend events, and build your
          professional community.
        </Text>

        <TouchableOpacity style={styles.ctaBtn} onPress={()=> router.push("/")}>
          <Text style={styles.ctaBtnText}>
            Explore Community
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    marginBottom: Platform.OS === "web" ?0:50
  },

  // HERO
  hero: {
    paddingTop: Platform.OS === "web" ? 20 : 30,
    paddingBottom: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    alignItems: "center",
  },

  heroWeb: {
    minHeight: 420,
    justifyContent: "center",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 22,
  },

  heroBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  heroTitle: {
    fontSize: Platform.OS === "web" ? 54 : 38,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },

  heroText: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 700,
  },

  heroStats: {
    flexDirection: "row",
    gap: 14,
    marginTop: 32,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  statCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 100,
  },

  statNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  statLabel: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    fontSize: 12,
  },

  // INTRO
  introCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: -28,
    borderRadius: 22,
    padding: 22,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  introText: {
    flex: 1,
    color: "#475569",
    lineHeight: 24,
    fontSize: 14,
  },

  // CONTACTS
  contactWrapper: {
    paddingHorizontal: 18,
    marginTop: 28,
  },

  contactWrapperWeb: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },

  contactCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
  },

  contactCardWeb: {
    flex: 1,
    maxWidth: 500,
  },

  contactTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  contactName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  contactRole: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontSize: 13,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 10,
  },

  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },

  locationText: {
    color: "#fff",
    fontSize: 14,
  },

  // INFO GRID
  infoGrid: {
    paddingHorizontal: 18,
    marginTop: 6,
    marginBottom: 20,
  },

  infoGridWeb: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    justifyContent: "center",
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 24,
    marginBottom: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  infoCardWeb: {
    width: 340,
    marginBottom: 0,
  },

  infoIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  infoTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 14,
  },

  infoText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },

  infoSub: {
    color: "#64748B",
    marginTop: 4,
    fontSize: 14,
  },

  infoLink: {
    color: "#4F46E5",
    fontWeight: "700",
    fontSize: 15,
  },

  closedText: {
    color: "#DC2626",
    marginTop: 10,
    fontWeight: "700",
  },

  mapBtn: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
  },

  mapText: {
    color: "#fff",
    fontWeight: "800",
  },

  // CTA
  cta: {
    marginHorizontal: 18,
    marginBottom: 28,
    borderRadius: 30,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  ctaTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },

  ctaText: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 24,
    maxWidth: 650,
  },

  ctaBtn: {
    backgroundColor: "#fff",
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
  },

  ctaBtnText: {
    color: "#4F46E5",
    fontWeight: "800",
    fontSize: 15,
  },
});