import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useUser } from "../context/UserContext";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Footer from "../components/Footer";

// ─── Bind to Environment Variables ──────────────────────────────────────────────
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const API_URL = `${API_BASE}/member`;
const isWeb = Platform.OS === "web";

export default function AlumniProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUser = async (emailParam: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/${emailParam}`, {
        params: { _t: Date.now() },
      });
      setUser(res.data.data);
      AsyncStorage.setItem("user", JSON.stringify(res.data.data));
    } catch {
      Alert.alert("Error", "User not found");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.email && API_BASE) {
        setEmail(user.email);
        fetchUser(user.email);
      }
    }, [user?.email])
  );

  const handleLogout = () => {
    if (isWeb) {
      if (window.confirm("Are you sure you want to logout?")) {
        AsyncStorage.clear();
        router.replace("/loginscreen");
      }
    } else {
      Alert.alert("Logout", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            AsyncStorage.clear();
            setUser(null);
            router.replace("/loginscreen");
          },
        },
      ]);
    }
  };

  if (!API_BASE) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={54} color="#EF4444" />
        <Text style={styles.errorTitle}>Configuration Mismatch</Text>
        <Text style={styles.errorSub}>The backend endpoint variable is undefined. Please ensure EXPO_PUBLIC_API_BASE is properly mapped inside your root environment configuration file.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        // ── FIXED: Reduced padding to eliminate the huge white space ──
        contentContainerStyle={{ paddingBottom: isWeb ? 20 : 80 }}
      >
        {/* TOP PROFILE SECTION */}
        <LinearGradient
          colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.topSection}
        >
          <View style={styles.avatarLarge}>
            {user?.profile_photo ? (
              <Image
                source={{ uri: `${API_BASE}/uploads/${user.profile_photo}` }}
                style={styles.largeImage}
                contentFit="cover"
                cachePolicy="none"
              />
            ) : (
              <Text style={styles.largeAvatarText}>
                {user?.full_name?.charAt(0)}
              </Text>
            )}
          </View>
          <Text style={styles.bigName}>{user.full_name}</Text>
          <Text style={styles.bigRole}>{user.designation || "Alumni"}</Text>
          <Text style={styles.company}>{user.organisation || "Organisation"}</Text>
        </LinearGradient>

        <View style={styles.webContainer}>
          
          {/* ── FIXED: Action Buttons restored to your 2x2 mobile layout ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => router.push({ pathname: "/editprofile", params: { email: user.email } })}
            >
              <Ionicons name="create-outline" size={18} color="#2563EB" />
              <Text style={[styles.actionText, { color: "#2563EB" }]}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.passwordBtn]}
              onPress={() => router.push({ pathname: "../change_password", params: { fromProfile: "true" } })}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#047857" />
              <Text style={[styles.actionText, { color: "#047857" }]}>Manage Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.bannerBtn]}
              onPress={() => router.push("/bannerrequest")}
            >
              <Ionicons name="megaphone-outline" size={18} color="#6D28D9" />
              <Text style={[styles.actionText, { color: "#6D28D9" }]}>Request Ad Banner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.statusBtn]}
              onPress={() => router.push("/mybanner")}
            >
              <Ionicons name="receipt-outline" size={18} color="#B45309" />
              <Text style={[styles.actionText, { color: "#B45309" }]}>My Banner Status</Text>
            </TouchableOpacity>
          </View>

          {/* PERSONAL INFO */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#2563eb" />
              <Text style={styles.infoText}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#667eea" />
              <Text style={styles.infoText}>{user.mobile}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#667eea" />
              <Text style={styles.infoText}>{user.city}, {user.country}</Text>
            </View>
          </View>

          {/* EDUCATION */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Education</Text>
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={20} color="#667eea" />
              <Text style={styles.infoText}>{user.programme}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#2563eb" />
              <Text style={styles.infoText}>Batch {user.batch_year}</Text>
            </View>
          </View>

          {/* PROFESSIONAL */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={20} color="#667eea" />
              <Text style={styles.infoText}>{user.organisation || "Not Added"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#667eea" />
              <Text style={styles.infoText}>{user.industry || "Not Added"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#667eea" />
              <Text style={styles.infoText}>{user.years_of_experience || 0} Years Experience</Text>
            </View>
          </View>

          {/* LOGOUT */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef2f7" },
  webContainer: { width: "100%", maxWidth: 900, alignSelf: "center", paddingTop: 10 },
  
  errorContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 32, textAlign: "center" as any },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20, maxWidth: 420 },
  
  loader:    { flex: 1, justifyContent: "center", alignItems: "center" },
  topSection: { alignItems: "center", paddingTop: isWeb ? 50 : 80, paddingBottom: 45, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  avatarLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: 15, borderWidth: 4, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  largeImage: { width: "100%", height: "100%" },
  largeAvatarText: { fontSize: 45, fontWeight: "bold", color: "#0f172a" },
  bigName: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  bigRole: { fontSize: 16, color: "#f1f1f1", marginTop: 5 },
  company: { fontSize: 14, color: "#e5e5e5", marginTop: 4 },
  
  actionRow: {
    flexDirection: "row",
    flexWrap: isWeb ? "nowrap" : "wrap", // Web: inline, Mobile: grid
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: -25,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: isWeb ? 26 : 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,

    // Restores your mobile 2x2 layout
    ...(!isWeb && {
      width: "46%", 
      marginBottom: 0,
    }),
  },

  editBtn: { backgroundColor: "#EEF6FF", borderColor: "#BFDBFE" },
  passwordBtn: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  bannerBtn: { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" },
  statusBtn: { backgroundColor: "#FFF8E7", borderColor: "#FCD34D" },

  actionText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  card: { backgroundColor: "#fff", marginBottom: 18, padding: 22, borderRadius: 22, elevation: 4, marginHorizontal: 20, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 18, letterSpacing: -0.3 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  infoText: { marginLeft: 14, fontSize: 15, color: "#334155", fontWeight: "600", flex: 1 },
  
  logoutBtn: { backgroundColor: "#EF4444", marginBottom: 40, paddingVertical: 16, borderRadius: 18, marginHorizontal: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", shadowColor: "#EF4444", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  logoutText: { color: "#fff", fontWeight: "800", fontSize: 16, marginLeft: 8 },
});