import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

const isWeb = Platform.OS === "web";
const API_URL = "http://10.254.25.118:2000/member";

export default function AlumniProfileScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [user,  setUser]  = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (emailParam: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/${emailParam}`, {
        // ── Cache bust — har baar fresh data aaye ──
        params: { _t: Date.now() },
      });
      setUser(res.data.data);
    } catch {
      Alert.alert("Error", "User not found");
    } finally {
      setLoading(false);
    }
  };

  // ── useFocusEffect — screen pe focus aane par HAMESHA reload ──
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const data = await AsyncStorage.getItem("user");
          if (data) {
            const parsed = JSON.parse(data);
            setEmail(parsed.email);
            await fetchUser(parsed.email);
          }
        } catch {}
      };
      load();
    }, [])
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
            router.replace("/loginscreen");
          },
        },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
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
              source={{ uri: `http://10.254.25.118:2000/uploads/${user.profile_photo}` }}
              style={styles.largeImage}
              contentFit="cover"
              // ── Cache bypass karo taaki updated photo dikhe ──
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

      {/* ACTION BUTTONS */}
      <View style={styles.actionRow}>

<TouchableOpacity
  style={[styles.actionBtn, styles.editBtn]}
  onPress={() =>
    router.push({
      pathname: "/editprofile",
      params: { email: user.email },
    })
  }
>
  <Ionicons name="create-outline" size={18} color="#2563EB" />
  <Text style={[styles.actionText, { color: "#2563EB" }]}>
    Edit Profile
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.actionBtn, styles.passwordBtn]}
  onPress={() =>
    router.push({
      pathname: "../change_password",
      params: { fromProfile: "true" },
    })
  }
>
  <Ionicons name="shield-checkmark-outline" size={18} color="#047857" />
  <Text style={[styles.actionText, { color: "#047857" }]}>
    Manage Password
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.actionBtn, styles.bannerBtn]}
  onPress={() => router.push("/bannerrequest")}
>
  <Ionicons name="megaphone-outline" size={18} color="#6D28D9" />
  <Text style={[styles.actionText, { color: "#6D28D9" }]}>
    Request Ad Banner
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.actionBtn, styles.statusBtn]}
  onPress={() => router.push("/mybanner")}
>
  <Ionicons name="receipt-outline" size={18} color="#B45309" />
  <Text style={[styles.actionText, { color: "#B45309" }]}>
    My Banner Status
  </Text>
</TouchableOpacity>

</View>

      {/* SECONDARY ACTIONS */}
      

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
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef2f7", marginBottom: Platform.OS === "web" ? 0 : 50 },
  loader:    { flex: 1, justifyContent: "center", alignItems: "center" },
  topSection: { alignItems: "center", paddingVertical: 35, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 5 },
  avatarLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: 15, borderWidth: 4, borderColor: "#fff" },
  largeImage: { width: 120, height: 120 },
  largeAvatarText: { fontSize: 45, fontWeight: "bold", color: "#0f172a" },
  bigName: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  bigRole: { fontSize: 16, color: "#f1f1f1", marginTop: 5 },
  company: { fontSize: 14, color: "#e5e5e5", marginTop: 4 },
  //actionRow: { flexDirection: "row", justifyContent: "space-evenly", marginTop: -22, marginBottom: 14, paddingHorizontal: 14 },
 // actionBtn: { backgroundColor: "#2563eb", flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 22, borderRadius: 16, elevation: 5 },
  //actionText: { color: "#fff", fontWeight: "600", marginLeft: 7, fontSize: 14 },
  
  
  
 actionRow: {
  flexDirection: Platform.OS === "web" ? "row" : "row",
  flexWrap: Platform.OS === "web" ? "nowrap" : "wrap",
  justifyContent: "center",
  alignItems: "center",
  gap: 16,
  marginTop: -18,
  marginBottom: 20,
  paddingHorizontal: 20,
},

actionBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 14,
  paddingHorizontal: Platform.OS === "web" ?26:6,
  borderRadius: 16,
  borderWidth: 1,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,

  ...(Platform.OS !== "web" && {
    width: "46%", // mobile me 2x2 layout
    marginBottom: 0,
  }),
},

editBtn: {
  backgroundColor: "#EEF6FF",
  borderColor: "#BFDBFE",
},

passwordBtn: {
  backgroundColor: "#ECFDF5",
  borderColor: "#A7F3D0",
},

bannerBtn: {
  backgroundColor: "#F5F3FF",
  borderColor: "#DDD6FE",
},

statusBtn: {
  backgroundColor: "#FFF8E7",
  borderColor: "#FCD34D",
},

actionText: {
  fontSize: 15,
  fontWeight: "700",
  marginLeft: 8,
},
  

  card: { backgroundColor: "#fff", marginBottom: 18, padding: 20, borderRadius: 22, elevation: 4, marginHorizontal: Platform.OS === "web" ? 46 : 19 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#222", marginBottom: 18 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  infoText: { marginLeft: 12, fontSize: 15, color: "#333", fontWeight: "500", flex: 1 },
  logoutBtn: { backgroundColor: "#ff3b30", marginBottom: 30, paddingVertical: 16, borderRadius: 18, marginHorizontal: Platform.OS === "web" ? 46 : 19, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
});