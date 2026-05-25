import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";

const API = "http://192.168.29.217:2000";

const iconMap: any = {
  lecture:    { icon: "mic",           bg: "#EEF2FF", color: "#4F46E5" },
  mentor:     { icon: "school",        bg: "#FEF3C7", color: "#D97706" },
  mentorship: { icon: "people",        bg: "#DCFCE7", color: "#16A34A" },
  donation:   { icon: "heart",         bg: "#FEE2E2", color: "#DC2626" },
  general:    { icon: "notifications", bg: "#F1F5F9", color: "#64748B" },
};

export default function NotificationsScreen() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const data = await AsyncStorage.getItem("user");
    if (data) {
      const parsed = JSON.parse(data);
      setUser(parsed);
      fetchNotifications(parsed.id);
    }
  };

  const fetchNotifications = async (id: number) => {
    try {
      const res = await axios.get(`${API}/notifications/${id}`);
      if (res.data.success) setNotifications(res.data.data);
      // Mark all read
      axios.put(`${API}/notifications/read/${id}`);
    } catch (err) { console.log(err); }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <SafeAreaView style={ns.container}>
      <Header />
      <View style={ns.topBar}>
        <Text style={ns.title}>Notifications</Text>
        {notifications.some(n => !n.is_read) && (
          <View style={ns.unreadDot} />
        )}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {notifications.length === 0 ? (
          <View style={ns.emptyBox}>
            <Text style={{ fontSize: 48 }}>🔔</Text>
            <Text style={ns.emptyTitle}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map(item => {
            const meta = iconMap[item.type] || iconMap.general;
            return (
              <View key={item.id} style={[ns.card, !item.is_read && ns.unread]}>
                <View style={[ns.iconBox, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={22} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ns.notifTitle}>{item.title}</Text>
                  <Text style={ns.notifMsg}>{item.message}</Text>
                  <Text style={ns.notifTime}>{timeAgo(item.created_at)}</Text>
                </View>
                {!item.is_read && <View style={ns.blueDot} />}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const ns = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  topBar: { flexDirection: "row", alignItems: "center", padding: 18, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: "#0F172A", flex: 1 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444" },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 12, flexDirection: "row", gap: 14, alignItems: "flex-start", elevation: 2 },
  unread: { borderLeftWidth: 3, borderLeftColor: "#4F46E5" },
  iconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  notifTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  notifMsg: { fontSize: 13, color: "#475569", lineHeight: 20 },
  notifTime: { fontSize: 11, color: "#94A3B8", marginTop: 6 },
  blueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4F46E5", marginTop: 4, flexShrink: 0 },
  emptyBox: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 16 },
});