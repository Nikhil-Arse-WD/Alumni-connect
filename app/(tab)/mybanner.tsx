import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const isWeb = Platform.OS === "web";

type BannerReq = {
  id: number;
  banner_title: string;
  banner_description: string;
  banner_image: string | null;
  website_link: string | null;
  preferred_duration: string;
  status: "Pending" | "Payment Requested" | "Approved" | "Rejected";
  amount_requested: number | null;
  payment_note: string | null;
  created_at: string;
};

// ── HELPER: CALCULATE EXPIRY DATE ──
const calculateExpiry = (createdAt: string, duration: string): Date | string => {
  const startDate = new Date(createdAt);
  let expiryDate = new Date(startDate);

  if (duration === "1_week") expiryDate.setDate(startDate.getDate() + 7);
  else if (duration === "2_weeks") expiryDate.setDate(startDate.getDate() + 14);
  else if (duration === "1_month") expiryDate.setMonth(startDate.getMonth() + 1);
  else return "Custom Duration"; 

  return expiryDate;
};

// ── HELPER: DETERMINE BANNER STATUS ──
const getBannerStatus = (banner: BannerReq) => {
  if (banner.status !== "Approved") return { isLive: false, statusText: banner.status, expiryDate: null };

  const expiryDate = calculateExpiry(banner.created_at, banner.preferred_duration);
  const now = new Date();

  if (expiryDate instanceof Date && now > expiryDate) {
    return { isLive: false, statusText: "Expired", expiryDate };
  }

  return { isLive: true, statusText: "Active", expiryDate };
};

export default function MyBannerRequestsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<BannerReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!API_BASE) return;
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) return;
      const { email } = JSON.parse(raw);
      const res = await axios.get(`${API_BASE}/banner-request/mine/${email}`);
      if (res.data.success) setItems(res.data.data || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  if (!API_BASE) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={{ color: "#EF4444" }}>Configuration Mismatch</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      
      {/* ── UPGRADED HERO HEADER ── */}
      <LinearGradient 
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]} 
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} 
        style={styles.header}
      >
        <View style={styles.dec1} />
        <View style={styles.dec2} />

        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Banners</Text>
            <Text style={styles.headerSub}>Manage your advertisement requests and track their live status.</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="megaphone-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No banners found</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/bannerrequest" as any)}>
              <Text style={styles.emptyBtnTxt}>Request Ad Banner</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const { isLive, statusText, expiryDate } = getBannerStatus(item);

          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.thumb, !item.banner_image && styles.thumbEmpty]}>
                   {item.banner_image ? <Ionicons name="image" size={24} color="#6366F1"/> : <Ionicons name="image-outline" size={20} color="#94A3B8" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.banner_title}</Text>
                  <Text style={styles.desc} numberOfLines={2}>{item.banner_description}</Text>
                </View>
              </View>

              {/* DYNAMIC STATUS DISPLAY */}
              <View style={styles.statusContainer}>
                {item.status === "Rejected" ? (
                  <View style={styles.rejectedBar}>
                    <Ionicons name="close-circle" size={16} color="#B91C1C" />
                    <Text style={styles.rejectedBarTxt}>Request Rejected</Text>
                  </View>
                ) : item.status === "Payment Requested" ? (
                  <View style={styles.payBox}>
                    <Ionicons name="cash-outline" size={18} color="#1D4ED8" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.payBoxTitle}>₹{item.amount_requested} payment required</Text>
                      <TouchableOpacity style={styles.payNowBtn} onPress={() => router.push({ pathname: "/Paybanner" as any, params: { id: String(item.id), amount: String(item.amount_requested), title: item.banner_title } })}>
                        <Text style={styles.payNowBtnTxt}>Complete Payment</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // APPROVED / LIVE / EXPIRED STATE
                  <View style={[styles.statusBadge, isLive ? styles.statusLive : styles.statusExpired]}>
                    <Ionicons 
                      name={isLive ? "checkmark-circle" : "time-outline"} 
                      size={18} 
                      color={isLive ? "#15803D" : "#B91C1C"} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusMainTxt, { color: isLive ? "#15803D" : "#B91C1C" }]}>
                        {isLive ? "Banner is Live!" : "Banner Expired"}
                      </Text>
                      {expiryDate instanceof Date && (
                        <Text style={[styles.statusSubTxt, { color: isLive ? "#166534" : "#991B1B" }]}>
                          Valid until: {expiryDate.toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>

            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // ── HERO HEADER STYLES ──
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 44, overflow: "hidden" },
  dec1: { position: "absolute", right: -60, top: -40, width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" },
  dec2: { position: "absolute", right: 40, top: 50, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)" },
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  headerSub: { fontSize: 13.5, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: "500", lineHeight: 18 },
  
  listContent: { padding: 16, paddingBottom: 40, marginTop: -20 }, // Added negative margin to pull list up slightly over the header
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTop: { flexDirection: "row", gap: 14, marginBottom: 16 },
  thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  thumbEmpty: { backgroundColor: "#F1F5F9" },
  title: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  desc: { fontSize: 13, color: "#64748B", marginTop: 4 },
  
  statusContainer: { marginTop: 4 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14 },
  statusLive: { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0", borderWidth: 1 },
  statusExpired: { backgroundColor: "#FEF2F2", borderColor: "#FECACA", borderWidth: 1 },
  statusMainTxt: { fontSize: 14, fontWeight: "800" },
  statusSubTxt: { fontSize: 12, fontWeight: "600", marginTop: 2 },

  rejectedBar: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F2", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#FECACA" },
  rejectedBarTxt: { fontSize: 13, fontWeight: "700", color: "#B91C1C" },
  
  payBox: { flexDirection: "row", gap: 10, backgroundColor: "#EFF6FF", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#BFDBFE" },
  payBoxTitle: { fontSize: 13, fontWeight: "800", color: "#1D4ED8" },
  payNowBtn: { backgroundColor: "#1D4ED8", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8, alignSelf: "flex-start" },
  payNowBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  
  emptyBox: { alignItems: "center", marginTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#334155", marginTop: 12 },
  emptyBtn: { backgroundColor: "#4F46E5", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  emptyBtnTxt: { color: "#fff", fontWeight: "700" },
});