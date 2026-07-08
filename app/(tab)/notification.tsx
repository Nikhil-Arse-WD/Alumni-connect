import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

const iconMap: any = {
  lecture:    { icon: "mic",           bg: "#EEF2FF", color: "#4F46E5" },
  mentor:     { icon: "school",        bg: "#FEF3C7", color: "#D97706" },
  mentorship: { icon: "people",        bg: "#DCFCE7", color: "#16A34A" },
  donation:   { icon: "heart",         bg: "#FEE2E2", color: "#DC2626" },
  general:    { icon: "notifications", bg: "#F1F5F9", color: "#64748B" },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (API_BASE) fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (!data) { setLoading(false); return; }
      const user = JSON.parse(data);

      const res = await axios.get(`${API_BASE}/notifications/${user.id}`);
      if (res.data.success) {
        setNotifications(res.data.data || []);
        // Mark all read
        axios.put(`${API_BASE}/notifications/read/${user.id}`).catch(() => {});
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (!API_BASE) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={styles.errorText}>Configuration Mismatch</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </LinearGradient>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-off-outline" size={56} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>You don't have any new notifications.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = iconMap[item.type] || iconMap.general;
          return (
            <View style={[styles.card, !item.is_read && styles.unread]}>
              <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon} size={22} color={meta.color} />
              </View>
              <View style={styles.notifBody}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifMsg}>{item.message}</Text>
                <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
              </View>
              {!item.is_read && <View style={styles.blueDot} />}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  errorText: { color: "#EF4444", fontWeight: "700" },
  
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32, flexDirection: "row", alignItems: "center", gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },

  listContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: "row", gap: 14, alignItems: "flex-start", borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  unread: { borderLeftWidth: 4, borderLeftColor: "#4F46E5" },
  
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14.5, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  notifMsg: { fontSize: 13.5, color: "#475569", lineHeight: 21 },
  notifTime: { fontSize: 11.5, color: "#94A3B8", marginTop: 8, fontWeight: "600" },
  
  blueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4F46E5", marginTop: 6, flexShrink: 0 },
  
  emptyBox: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 20 },
  emptySub: { fontSize: 14, color: "#64748B", marginTop: 6, textAlign: "center" },
});