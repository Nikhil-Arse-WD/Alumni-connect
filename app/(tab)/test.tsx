import axios from "axios";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../components/Header";

const API_URL = "http://192.168.29.217:2000/alumni/profile";

const AVATAR_COLORS = [
  "#378ADD",
  "#D4537E",
  "#1D9E75",
  "#BA7517",
  "#7F77DD",
  "#D85A30",
];

const getAvatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function AlumniProfileScreen() {
  const router = useRouter();

  const { width } = useWindowDimensions();

  const isWide = width >= 768;

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  ////////////////////////////////////////////////////////
  // FETCH PROFILE
  ////////////////////////////////////////////////////////

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/${id}`);

      setUser(res.data.data);
    } catch (err) {
      console.log(err);

      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  ////////////////////////////////////////////////////////
  // LOADING
  ////////////////////////////////////////////////////////

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#D4537E" />
      </View>
    );
  }

  ////////////////////////////////////////////////////////
  // NO USER
  ////////////////////////////////////////////////////////

  if (!user) {
    return (
      <View style={styles.loader}>
        <Text>User not found</Text>
      </View>
    );
  }

  ////////////////////////////////////////////////////////
  // ACTIONS
  ////////////////////////////////////////////////////////

  const handleEmail = () => {
    if (user.email) {
      Linking.openURL(`mailto:${user.email}`);
    }
  };

  const handleCall = () => {
    if (user.mobile) {
      Linking.openURL(`tel:${user.mobile}`);
    }
  };

  ////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Header />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>Alumni Profile</Text>

        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color="#111827"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View
          style={[
            styles.mainLayout,
            isWide && styles.mainLayoutWide,
          ]}
        >
          {/* LEFT PROFILE CARD */}
          <View
            style={[
              styles.profileCard,
              isWide && styles.profileCardWide,
            ]}
          >
            {/* AVATAR */}
            <View
              style={[
                styles.avatarBox,
                {
                  backgroundColor: getAvatarColor(
                    user.full_name
                  ),
                },
              ]}
            >
              {user.profile_photo ? (
                <Image
                  source={{
                    uri: `http://192.168.29.217:2000/uploads/${user.profile_photo}`,
                  }}
                  style={styles.profileImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarText}>
                  {getInitials(user.full_name)}
                </Text>
              )}
            </View>

            {/* NAME */}
            <Text style={styles.name}>
              {user.full_name}
            </Text>

            {/* DESIGNATION */}
            <Text style={styles.role}>
              {user.designation || "Alumni"}
            </Text>

            {/* COMPANY */}
            {user.organisation && (
              <Text style={styles.company}>
                {user.organisation}
              </Text>
            )}

            {/* BADGES */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  styles.badgePurple,
                ]}
              >
                <Text style={styles.badgePurpleText}>
                  {user.programme}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  styles.badgeGreen,
                ]}
              >
                <Text style={styles.badgeGreenText}>
                  {user.batch_year}
                </Text>
              </View>
            </View>

            {/* BUTTONS */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleEmail}
              >
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color="#fff"
                />

                <Text style={styles.primaryBtnText}>
                  Message
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleCall}
              >
                <Ionicons
                  name="call-outline"
                  size={16}
                  color="#111827"
                />

                <Text style={styles.secondaryBtnText}>
                  Call
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* RIGHT DETAILS */}
          <View style={styles.detailsColumn}>
            {/* ACADEMIC */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>
                ACADEMIC INFO
              </Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoTitle}>
                    Programme
                  </Text>

                  <Text style={styles.infoValue}>
                    {user.programme}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoTitle}>
                    Batch Year
                  </Text>

                  <Text style={styles.infoValue}>
                    {user.batch_year}
                  </Text>
                </View>

                {user.industry && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoTitle}>
                      Industry
                    </Text>

                    <Text style={styles.infoValue}>
                      {user.industry}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* CONTACT */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>
                CONTACT INFO
              </Text>

              {/* EMAIL */}
              {user.email && (
                <TouchableOpacity
                  style={styles.contactCard}
                  onPress={handleEmail}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: "#E6F1FB" },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color="#185FA5"
                    />
                  </View>

                  <View style={styles.contactText}>
                    <Text style={styles.contactLabel}>
                      Email
                    </Text>

                    <Text
                      style={styles.contactValue}
                      numberOfLines={1}
                    >
                      {user.email}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* MOBILE */}
              {user.mobile && (
                <TouchableOpacity
                  style={styles.contactCard}
                  onPress={handleCall}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: "#E1F5EE" },
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color="#085041"
                    />
                  </View>

                  <View style={styles.contactText}>
                    <Text style={styles.contactLabel}>
                      Mobile
                    </Text>

                    <Text style={styles.contactValue}>
                      {user.mobile}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* LOCATION */}
              <View style={styles.contactCard}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: "#FBEAF0" },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color="#993556"
                  />
                </View>

                <View style={styles.contactText}>
                  <Text style={styles.contactLabel}>
                    Location
                  </Text>

                  <Text style={styles.contactValue}>
                    {user.city}, {user.country}
                  </Text>
                </View>
              </View>

              {/* COMPANY */}
              {user.organisation && (
                <View style={styles.contactCard}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: "#FAEEDA" },
                    ]}
                  >
                    <Ionicons
                      name="briefcase-outline"
                      size={18}
                      color="#854F0B"
                    />
                  </View>

                  <View style={styles.contactText}>
                    <Text style={styles.contactLabel}>
                      Organisation
                    </Text>

                    <Text style={styles.contactValue}>
                      {user.organisation}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  ////////////////////////////////////////////////////////
  // TOP BAR
  ////////////////////////////////////////////////////////

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },

  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },

  topTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  ////////////////////////////////////////////////////////
  // LAYOUT
  ////////////////////////////////////////////////////////

  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },

  mainLayout: {
    flexDirection: "column",
    gap: 16,
  },

  mainLayoutWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  ////////////////////////////////////////////////////////
  // PROFILE CARD
  ////////////////////////////////////////////////////////

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  profileCardWide: {
    width: 340,
  },

  avatarBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 18,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  avatarText: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "700",
  },

  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  role: {
    fontSize: 15,
    color: "#D4537E",
    fontWeight: "700",
    marginTop: 4,
  },

  company: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },

  badgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgePurple: {
    backgroundColor: "#EEEDFE",
  },

  badgePurpleText: {
    color: "#3C3489",
    fontWeight: "700",
    fontSize: 13,
  },

  badgeGreen: {
    backgroundColor: "#E1F5EE",
  },

  badgeGreenText: {
    color: "#085041",
    fontWeight: "700",
    fontSize: 13,
  },

  ////////////////////////////////////////////////////////
  // BUTTONS
  ////////////////////////////////////////////////////////

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
    width: "100%",
  },

  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#D4537E",
    paddingVertical: 13,
    borderRadius: 14,
  },

  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 13,
    borderRadius: 14,
  },

  secondaryBtnText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
  },

  ////////////////////////////////////////////////////////
  // DETAILS
  ////////////////////////////////////////////////////////

  detailsColumn: {
    flex: 1,
    gap: 16,
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  sectionLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: 18,
    letterSpacing: 0.5,
  },

  infoGrid: {
    gap: 18,
  },

  infoItem: {
    marginBottom: 4,
  },

  infoTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },

  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
  },

  ////////////////////////////////////////////////////////
  // CONTACT CARD
  ////////////////////////////////////////////////////////

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  contactText: {
    flex: 1,
  },

  contactLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },

  contactValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
});