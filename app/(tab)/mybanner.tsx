// ======================================================
// mybannerrequests.tsx
// Alumni ke apne banner-ad requests ka status yaha
// dikhta hai — Pending / Payment Requested / Approved / Rejected
// Route: app/mybannerrequests.tsx
// ======================================================

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API = "http://10.254.25.118:2000";
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
  payment_status: "Not Required" | "Pending" | "Paid";
  admin_remarks: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<string, { bg: string; fg: string; icon: string }> = {
  "Pending":            { bg: "#FEF3C7", fg: "#B45309", icon: "hourglass-outline" },
  "Payment Requested":  { bg: "#DBEAFE", fg: "#1D4ED8", icon: "cash-outline" },
  "Approved":           { bg: "#DCFCE7", fg: "#15803D", icon: "checkmark-circle-outline" },
  "Rejected":           { bg: "#FEE2E2", fg: "#B91C1C", icon: "close-circle-outline" },
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
                <Ionicons name="checkmark" size={11} color="#fff" />
              ) : (
                <Text style={[styles.stepDotTxt, i <= activeIdx && { color: "#fff" }]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, i <= activeIdx && styles.stepLabelOn]}>{s}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, i < activeIdx && styles.stepLineOn]} />
          )}
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
    try {
      const raw = await AsyncStorage.getItem("user");
      if (!raw) { setLoading(false); return; }
      const { email } = JSON.parse(raw);
      const res = await axios.get(`${API}/banner-request/mine/${email}`);
      if (res.data.success) setItems(res.data.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loaderTxt}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
      <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Banner Requests</Text>
            <Text style={styles.headerSub}>Track approval & payment status</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {items.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="megaphone-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No banner requests yet</Text>
            <Text style={styles.emptySub}>Request your ad banner to be featured on the Home page.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/bannerrequest")} activeOpacity={0.88}>
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={styles.emptyBtnTxt}>Request Ad Banner</Text>
            </TouchableOpacity>
          </View>
        )}

        {items.map(item => {
          const st = STATUS_STYLE[item.status];
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                {item.banner_image ? (
                  <Image source={{ uri: API + item.banner_image }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Ionicons name="image-outline" size={22} color="#94A3B8" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.banner_title}</Text>
                  <Text style={styles.desc} numberOfLines={2}>{item.banner_description}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                  <Ionicons name={st.icon as any} size={12} color={st.fg} />
                  <Text style={[styles.statusPillTxt, { color: st.fg }]}>{item.status}</Text>
                </View>
              </View>

              <StatusStepper status={item.status} />

              {item.status === "Payment Requested" && (
                <View style={styles.payBox}>
                  <Ionicons name="cash-outline" size={18} color="#1D4ED8" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payBoxTitle}>₹{item.amount_requested} payment required</Text>
                    {!!item.payment_note && <Text style={styles.payBoxNote}>{item.payment_note}</Text>}
                    <TouchableOpacity
                      style={styles.payNowBtn}
                      activeOpacity={0.88}
                      onPress={() =>
                        router.push({
                          pathname: "/Paybanner",
                          params: {
                            id: String(item.id),
                            amount: String(item.amount_requested),
                            title: item.banner_title,
                          },
                        })
                      }
                    >
                      <Ionicons name="card-outline" size={14} color="#fff" />
                      <Text style={styles.payNowBtnTxt}>Pay Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {item.status === "Approved" && (
                <View style={[styles.payBox, { backgroundColor: "#DCFCE7" }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#15803D" />
                  <Text style={[styles.payBoxTitle, { color: "#15803D" }]}>
                    Your banner is live on the Home page 🎉
                  </Text>
                </View>
              )}

              {item.status === "Rejected" && (
                <View style={[styles.payBox, { backgroundColor: "#FEE2E2" }]}>
                  <Ionicons name="close-circle-outline" size={18} color="#B91C1C" />
                  <Text style={[styles.payBoxTitle, { color: "#B91C1C" }]}>
                    {item.admin_remarks || "Your request was not approved."}
                  </Text>
                </View>
              )}

              <Text style={styles.metaLine}>
                <Ionicons name="time-outline" size={11} color="#94A3B8" />{"  "}
                Submitted on {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {"  ·  "}Duration: {item.preferred_duration}
              </Text>
            </View>
          );
        })}

        {items.length > 0 && (
          <TouchableOpacity style={styles.newReqBtn} onPress={() => router.push("/bannerrequest")} activeOpacity={0.88}>
            <Ionicons name="add-circle-outline" size={18} color="#4F46E5" />
            <Text style={styles.newReqBtnTxt}>Request Another Banner</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" },
  loaderTxt: { marginTop: 12, color: "#64748B", fontSize: 14 },

  header: { paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 54 : 20, paddingBottom: 22 },
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 19, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 },

  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 8, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 15, color: "#334155", fontWeight: "700", marginTop: 4 },
  emptySub: { fontSize: 12.5, color: "#94A3B8", textAlign: "center", lineHeight: 18, marginBottom: 8 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#4F46E5", paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14, marginTop: 6 },
  emptyBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },

  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#E2E8F0" },
  cardTop: { flexDirection: "row", gap: 10, marginBottom: 14, alignItems: "flex-start" },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  thumbEmpty: { backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 14.5, fontWeight: "800", color: "#0F172A" },
  desc: { fontSize: 11.5, color: "#64748B", marginTop: 3, lineHeight: 16 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  statusPillTxt: { fontSize: 10, fontWeight: "700" },

  stepperRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, paddingHorizontal: 2 },
  stepItem: { alignItems: "center", width: 74 },
  stepDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#E2E8F0", justifyContent: "center", alignItems: "center" },
  stepDotOn: { backgroundColor: "#4F46E5" },
  stepDotTxt: { fontSize: 10.5, fontWeight: "700", color: "#94A3B8" },
  stepLabel: { fontSize: 9.5, color: "#94A3B8", marginTop: 4, textAlign: "center", fontWeight: "600" },
  stepLabelOn: { color: "#4F46E5" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#E2E8F0", marginBottom: 16, marginHorizontal: -6 },
  stepLineOn: { backgroundColor: "#4F46E5" },

  rejectedBar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  rejectedBarTxt: { fontSize: 12.5, fontWeight: "700", color: "#B91C1C" },

  payBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#DBEAFE", padding: 11, borderRadius: 12, marginBottom: 10 },
  payBoxTitle: { fontSize: 12.5, fontWeight: "700", color: "#1D4ED8" },
  payBoxNote: { fontSize: 11.5, color: "#1E40AF", marginTop: 3, lineHeight: 16 },
  payBoxHint: { fontSize: 10.5, color: "#3B82F6", marginTop: 5, lineHeight: 14 },
  payNowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#1D4ED8", paddingVertical: 9, borderRadius: 10, marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 16 },
  payNowBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },

  metaLine: { fontSize: 10.5, color: "#94A3B8", marginTop: 2 },

  newReqBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#C7D2FE", backgroundColor: "#EEF2FF", paddingVertical: 13, borderRadius: 16, marginTop: 4 },
  newReqBtnTxt: { color: "#4F46E5", fontWeight: "700", fontSize: 13.5 },
});