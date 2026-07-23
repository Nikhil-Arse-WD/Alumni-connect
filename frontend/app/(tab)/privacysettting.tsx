import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const API_URL = `${API_BASE}/privacy`;
const isWeb = Platform.OS === "web";

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 850;

  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");

  const [showEmail, setShowEmail] = useState(true);
  const [showMobile, setShowMobile] = useState(true);
  const [showOrganisation, setShowOrganisation] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const u = JSON.parse(userData);
        setUser(u);
        setEmail(u.email);
        setShowEmail(u.show_email === 1 || u.show_email === true);
        setShowMobile(u.show_mobile === 1 || u.show_mobile === true);
        setShowOrganisation(u.show_organisation === 1 || u.show_organisation === true);
      }
    } catch (e) {
      console.error("Failed to load user settings", e);
    }
  };

  const savePrivacy = async () => {
    if (!email) return;
    setSaving(true);
    try {
      await axios.put(`${API_URL}/${email}`, {
        show_email: showEmail,
        show_mobile: showMobile,
        show_organisation: showOrganisation,
      });

      // Update Local Storage
      const updatedUser = {
        ...user,
        show_email: showEmail ? 1 : 0,
        show_mobile: showMobile ? 1 : 0,
        show_organisation: showOrganisation ? 1 : 0,
      };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      
      Alert.alert("Success ✅", "Privacy settings updated.");
      router.back();
    } catch (err) {
      Alert.alert("Error", "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!API_BASE) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={{ color: "#EF4444" }}>Configuration Mismatch</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ── HEADER ── */}
      <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.content, isDesktop && styles.contentWide]}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          
          {[
            { label: "Show Email", desc: "Allow other alumni to see your email address.", val: showEmail, set: setShowEmail },
            { label: "Show Mobile", desc: "Allow other alumni to view your contact number.", val: showMobile, set: setShowMobile },
            { label: "Show Organisation", desc: "Display your current company/business name.", val: showOrganisation, set: setShowOrganisation },
          ].map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.desc}>{item.desc}</Text>
              </View>
              <Switch
                value={item.val}
                onValueChange={item.set}
                trackColor={{ false: "#E2E8F0", true: "#4F46E5" }}
                thumbColor={"#fff"}
              />
            </View>
          ))}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={savePrivacy} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtnSecondary} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.backText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: { padding: 24, paddingTop: 10, paddingBottom: 40, flexDirection: "row", alignItems: "center", gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff" },
  
  scroll: { padding: 16 },
  content: { width: "100%", alignSelf: "center" },
  contentWide: { maxWidth: 600 },
  
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, marginLeft: 4 },
  
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#0F172A", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardInfo: { flex: 1, marginRight: 16 },
  label: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  desc: { color: "#64748B", marginTop: 4, fontSize: 13.5, lineHeight: 18, fontWeight: "500" },
  
  buttonRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  saveBtn: { flex: 2, backgroundColor: "#4F46E5", paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  backBtnSecondary: { flex: 1, backgroundColor: "#fff", paddingVertical: 16, borderRadius: 16, alignItems: "center", borderWidth: 1.5, borderColor: "#E2E8F0" },
  backText: { color: "#475569", fontSize: 15, fontWeight: "700" },
});