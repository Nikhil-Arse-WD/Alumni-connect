
import axios from "axios";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "http://10.232.80.175:2000/alumni/profile";

const AVATAR_COLORS = ["#378ADD","#D4537E","#1D9E75","#BA7517","#7F77DD","#D85A30"];
const getAvatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials    = (name = "") => name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

// ─── Masking helpers ──────────────────────────────────────────────
// Email: a***@gmail.com  (show first char + domain)
const maskEmail = (email: string) => {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return email[0] + "***";
  const visibleLocal = local.slice(0, Math.min(2, local.length));
  const maskedLocal  = visibleLocal + "*".repeat(Math.max(3, local.length - visibleLocal.length));
  return `${maskedLocal}@${domain}`;
};

// Phone: 98***43210  (show first 2 + last 3 chars)
const maskPhone = (phone: string) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone[0] + "***";
  const start  = digits.slice(0, 2);
  const end    = digits.slice(-3);
  const masked = "*".repeat(digits.length - 5);
  return `${start}${masked}${end}`;
};

// City: show first word, mask second  (e.g. "New X***")
const maskCity = (city: string) => {
  if (!city) return null;
  const parts = city.trim().split(" ");
  if (parts.length === 1) return parts[0][0] + "***";
  return parts[0] + " " + parts[1][0] + "***";
};

export default function AlumniProfileScreen() {
  const router        = useRouter();
  const { width }     = useWindowDimensions();
  const isWide        = width >= 768;
  const { id }        = useLocalSearchParams<{ id: string }>();
  const [user,    setUser]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/${id}`);
      setUser(res.data.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchProfile(); }, [id]);

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#D4537E" /></View>;
  if (!user)   return <View style={styles.loader}><Text>User not found</Text></View>;

  // ── Decide what to show ──────────────────────────────────────────
  // If field is hidden (null/empty from server), show masked placeholder
  const displayEmail = user.email
    ? (user.hide_email  ? maskEmail(user.email)  : user.email)
    : null;

  const displayPhone = user.mobile
    ? (user.hide_mobile ? maskPhone(user.mobile) : user.mobile)
    : null;

  const displayCity = user.city
    ? (user.hide_city   ? maskCity(user.city)    : user.city)
    : null;

  // If server hides the field entirely (returns null), show generic mask
  const emailDisplay  = displayEmail  ?? "••••@•••••.com";
  const phoneDisplay  = displayPhone  ?? "+91 •••• ••••••";
  const cityDisplay   = displayCity   ?? "•••••, India";

  const isEmailHidden = !user.email   || user.hide_email;
  const isPhoneHidden = !user.mobile  || user.hide_mobile;
  const isCityHidden  = !user.city    || user.hide_city;

  const handleEmail = () => {
    if (user.email && !user.hide_email) Linking.openURL(`mailto:${user.email}`);
  };
  const handleCall = () => {
    if (user.mobile && !user.hide_mobile) Linking.openURL(`tel:${user.mobile}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.topBar}
      >
        <StatusBar barStyle="light-content" />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Alumni Profile</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.mainLayout, isWide && styles.mainLayoutWide]}>

          {/* LEFT PROFILE CARD */}
          <View style={[styles.profileCard, isWide && styles.profileCardWide]}>
            <View style={[styles.avatarBox, { backgroundColor: getAvatarColor(user.full_name) }]}>
              {user.profile_photo ? (
                <Image
                  source={{ uri: `http://192.168.29.217:2000/uploads/${user.profile_photo}` }}
                  style={styles.profileImage} contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user.full_name)}</Text>
              )}
            </View>

            <Text style={styles.name}>{user.full_name}</Text>
            <Text style={styles.role}>{user.designation || "Alumni"}</Text>
            {user.organisation && <Text style={styles.company}>{user.organisation}</Text>}

            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.badgePurple]}>
                <Text style={styles.badgePurpleText}>{user.programme}</Text>
              </View>
              <View style={[styles.badge, styles.badgeGreen]}>
                <Text style={styles.badgeGreenText}>{user.batch_year}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, isEmailHidden && styles.btnDisabled]}
                onPress={handleEmail}
              >
                <Ionicons name={isEmailHidden ? "mail" : "mail-outline"} size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>{isEmailHidden ? "Hidden" : "Message"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, isPhoneHidden && styles.btnDisabledSecondary]}
                onPress={handleCall}
              >
                <Ionicons name={isPhoneHidden ? "call" : "call-outline"} size={16} color={isPhoneHidden ? "#9ca3af" : "#111827"} />
                <Text style={[styles.secondaryBtnText, isPhoneHidden && { color: "#9ca3af" }]}>
                  {isPhoneHidden ? "Hidden" : "Call"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* RIGHT DETAILS */}
          <View style={styles.detailsColumn}>

            {/* ACADEMIC */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>ACADEMIC INFO</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoTitle}>
                    Programme: <Text style={styles.infoValue}>{user.programme}</Text>
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoTitle}>
                    Batch Year: <Text style={styles.infoValue}>{user.batch_year}</Text>
                  </Text>
                </View>
                {user.industry && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoTitle}>
                      Industry: <Text style={styles.infoValue}>{user.industry}</Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* CONTACT */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>CONTACT INFO</Text>

              {/* EMAIL */}
              <TouchableOpacity
                style={styles.contactCard}
                onPress={handleEmail}
                activeOpacity={isEmailHidden ? 1 : 0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: isEmailHidden ? "#f3f4f6" : "#E6F1FB" }]}>
                  <Ionicons name="mail-outline" size={18} color={isEmailHidden ? "#9ca3af" : "#185FA5"} />
                </View>
                <View style={styles.contactText}>
                  <View style={styles.contactLabelRow}>
                    <Text style={styles.contactLabel}>Email</Text>
                    {isEmailHidden && (
                      <View style={styles.hiddenBadge}>
                        <Ionicons name="lock-closed" size={9} color="#9ca3af" />
                        <Text style={styles.hiddenBadgeText}>Private</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.contactValue, isEmailHidden && styles.maskedText]} numberOfLines={1}>
                    {emailDisplay}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* MOBILE */}
              <TouchableOpacity
                style={styles.contactCard}
                onPress={handleCall}
                activeOpacity={isPhoneHidden ? 1 : 0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: isPhoneHidden ? "#f3f4f6" : "#E1F5EE" }]}>
                  <Ionicons name="call-outline" size={18} color={isPhoneHidden ? "#9ca3af" : "#085041"} />
                </View>
                <View style={styles.contactText}>
                  <View style={styles.contactLabelRow}>
                    <Text style={styles.contactLabel}>Mobile</Text>
                    {isPhoneHidden && (
                      <View style={styles.hiddenBadge}>
                        <Ionicons name="lock-closed" size={9} color="#9ca3af" />
                        <Text style={styles.hiddenBadgeText}>Private</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.contactValue, isPhoneHidden && styles.maskedText]}>
                    {phoneDisplay}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* LOCATION */}
              <View style={styles.contactCard}>
                <View style={[styles.iconBox, { backgroundColor: isCityHidden ? "#f3f4f6" : "#FBEAF0" }]}>
                  <Ionicons name="location-outline" size={18} color={isCityHidden ? "#9ca3af" : "#993556"} />
                </View>
                <View style={styles.contactText}>
                  <View style={styles.contactLabelRow}>
                    <Text style={styles.contactLabel}>Location</Text>
                    {isCityHidden && (
                      <View style={styles.hiddenBadge}>
                        <Ionicons name="lock-closed" size={9} color="#9ca3af" />
                        <Text style={styles.hiddenBadgeText}>Private</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.contactValue, isCityHidden && styles.maskedText]}>
                    {isCityHidden ? cityDisplay : `${user.city}${user.country ? ", " + user.country : ""}`}
                  </Text>
                </View>
              </View>

              {/* ORGANISATION */}
              {user.organisation && (
                <View style={styles.contactCard}>
                  <View style={[styles.iconBox, { backgroundColor: "#FAEEDA" }]}>
                    <Ionicons name="briefcase-outline" size={18} color="#854F0B" />
                  </View>
                  <View style={styles.contactText}>
                    <Text style={styles.contactLabel}>Organisation</Text>
                    <Text style={styles.contactValue}>{user.organisation}</Text>
                  </View>
                </View>
              )}
            </View>

          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  loader:    { flex: 1, justifyContent: "center", alignItems: "center" },

  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 14,
    paddingTop: Platform.OS === "ios" ? 54 : 14,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  topTitle: {
    color: "#fff",
    fontSize: Platform.OS === "web" ? 22 : 18,
    fontWeight: "700",
  },

  scrollContainer: { padding: 14, paddingBottom: 80 },
  mainLayout:      { flexDirection: "column", gap: 16 },
  mainLayoutWide:  { flexDirection: "row", alignItems: "flex-start" },

  profileCard: {
    backgroundColor: "#fff", borderRadius: 24,
    padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(0,0,0,0.05)",
  },
  profileCardWide: { width: 340 },

  avatarBox: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: "center", alignItems: "center",
    overflow: "hidden", marginBottom: 18,
  },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  avatarText:   { color: "#fff", fontSize: 42, fontWeight: "700" },

  name:    { fontSize: 24, fontWeight: "800", color: "#111827", textAlign: "center" },
  role:    { fontSize: 15, color: "#D4537E", fontWeight: "700", marginTop: 4 },
  company: { fontSize: 14, color: "#6b7280", marginTop: 4 },

  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 16 },
  badge:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgePurple:   { backgroundColor: "#EEEDFE" },
  badgePurpleText:{ color: "#3C3489", fontWeight: "700", fontSize: 13 },
  badgeGreen:    { backgroundColor: "#E1F5EE" },
  badgeGreenText:{ color: "#085041", fontWeight: "700", fontSize: 13 },

  actionRow:   { flexDirection: "row", gap: 10, marginTop: 24, width: "100%" },
  primaryBtn:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#D4537E", paddingVertical: 13, borderRadius: 14 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  secondaryBtn:{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", paddingVertical: 13, borderRadius: 14 },
  secondaryBtnText: { color: "#111827", fontWeight: "700", fontSize: 14 },
  btnDisabled:          { backgroundColor: "#e5e7eb" },
  btnDisabledSecondary: { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },

  detailsColumn: { flex: 1, gap: 16 },
  infoCard: { backgroundColor: "#fff", borderRadius: 24, padding: 22, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)" },
  sectionLabel: { fontSize: 12, color: "#6b7280", fontWeight: "700", marginBottom: 18, letterSpacing: 0.5 },
  infoGrid:  { gap: 18 },
  infoItem:  { marginBottom: 4 },
  infoTitle: { fontSize: 13, color: "#6b7280", marginBottom: 6 },
  infoValue: { fontSize: 16, color: "#111827", fontWeight: "700" },

  contactCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", padding: 14, borderRadius: 18, marginBottom: 12 },
  iconBox:     { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 14 },
  contactText: { flex: 1 },

  contactLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  contactLabel:    { fontSize: 12, color: "#6b7280" },

  hiddenBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#f3f4f6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  hiddenBadgeText: { fontSize: 9, color: "#9ca3af", fontWeight: "600" },

  contactValue: { fontSize: 15, color: "#111827", fontWeight: "600" },
  maskedText:   { color: "#9ca3af", letterSpacing: 1.5, fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
});

