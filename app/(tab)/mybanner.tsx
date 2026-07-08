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

const STEPS = ["Pending", "Payment Requested", "Approved"];

function StatusStepper({ status }: { status: string }) {
  if (status === "Rejected") {
    return (
      <View style={styles.rejectedBar}>
        <Ionicons name="close-circle" size={16} color="#B91C1C" />
        <Text style={styles.rejectedBarTxt}>Request Rejected</Text>
      </View>
    );
  }
  const activeIdx = STEPS.indexOf(status);
  return (
    <View style={styles.stepperRow}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, i <= activeIdx && styles.stepDotOn]}>
              {i < activeIdx ? (
                <Ionicons name="checkmark" size={12} color="#fff" />
              ) : (
                <Text style={[styles.stepDotTxt, i <= activeIdx && { color: "#fff" }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i <= activeIdx && styles.stepLabelOn]}>{s}</Text>
          </View>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, i < activeIdx && styles.stepLineOn]} />}
        </React.Fragment>
      ))}
    </View>
  );
}

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Banner Requests</Text>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="megaphone-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No requests found</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/bannerrequest")}>
              <Text style={styles.emptyBtnTxt}>Request Ad Banner</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
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

            <StatusStepper status={item.status} />

            {item.status === "Payment Requested" && (
              <View style={styles.payBox}>
                <Ionicons name="cash-outline" size={18} color="#1D4ED8" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.payBoxTitle}>₹{item.amount_requested} payment required</Text>
                  <TouchableOpacity style={styles.payNowBtn} onPress={() => router.push({ pathname: "/Paybanner", params: { id: String(item.id), amount: String(item.amount_requested), title: item.banner_title } })}>
                    <Text style={styles.payNowBtnTxt}>Complete Payment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {item.status === "Approved" && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color="#15803D" />
                <Text style={styles.successTxt}>Banner is live on Home Page</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 24, paddingTop: 10, paddingBottom: 32 },
  headerTopRow: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff", marginTop: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTop: { flexDirection: "row", gap: 14, marginBottom: 16 },
  thumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  thumbEmpty: { backgroundColor: "#F1F5F9" },
  title: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  desc: { fontSize: 13, color: "#64748B", marginTop: 4 },
  stepperRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, justifyContent: "space-between" },
  stepItem: { alignItems: "center", flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  stepDotOn: { backgroundColor: "#4F46E5" },
  stepDotTxt: { fontSize: 11, fontWeight: "700", color: "#94A3B8" },
  stepLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "700", textTransform: "uppercase" },
  stepLabelOn: { color: "#4F46E5" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#E2E8F0", marginHorizontal: 8, marginBottom: 12 },
  stepLineOn: { backgroundColor: "#4F46E5" },
  rejectedBar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16, backgroundColor: "#FEF2F2", padding: 10, borderRadius: 8 },
  rejectedBarTxt: { fontSize: 13, fontWeight: "700", color: "#B91C1C" },
  payBox: { flexDirection: "row", gap: 10, backgroundColor: "#EFF6FF", padding: 14, borderRadius: 14, marginTop: 4 },
  payBoxTitle: { fontSize: 13, fontWeight: "800", color: "#1D4ED8" },
  payNowBtn: { backgroundColor: "#1D4ED8", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8, alignSelf: "flex-start" },
  payNowBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  successBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#DCFCE7", padding: 12, borderRadius: 12 },
  successTxt: { fontSize: 13, fontWeight: "700", color: "#15803D" },
  emptyBox: { alignItems: "center", marginTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#334155", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#94A3B8", textAlign: "center", marginTop: 4, marginBottom: 16 },
  emptyBtn: { backgroundColor: "#4F46E5", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  emptyBtnTxt: { color: "#fff", fontWeight: "700" },
});