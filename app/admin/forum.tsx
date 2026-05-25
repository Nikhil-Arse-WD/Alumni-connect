import { Feather, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert, Animated, FlatList, Image,
    Platform,
    ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Sidebar from "./components/sidebar";

const API = "http://192.168.29.217:2000";
const PRIMARY = "#5B5FEF";

export default function AdminForum() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-300)).current;

  const FILTERS = ["All", "Reported", "Active", "Removed"];

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/admin/forum/posts`);
      if (res.data.success) setPosts(res.data.data);
    } catch (err) { console.log(err); }
  };

  const handleAction = async (
    id: number,
    action: "DELETED" | "restore"
  ) => {
    try {
      await axios.put(
        `${API}/admin/forum/post/${id}`,
        {
          status:
            action === "DELETED"
              ? "DELETED"
              : "ACTIVE",
        }
      );
  
      // ✅ WEB + MOBILE ALERT
      if (Platform.OS === "web") {
        window.alert(
          action === "DELETED"
            ? "✅ Post removed successfully"
            : "✅ Post restored successfully"
        );
      } else {
        Alert.alert(
          "Done ✅",
          action === "DELETED"
            ? "Post removed"
            : "Post restored"
        );
      }
  
      fetchPosts();
  
    } catch (err) {
  
      // ✅ ERROR ALERT
      if (Platform.OS === "web") {
        window.alert("❌ Action failed");
      } else {
        Alert.alert(
          "Error",
          "Action failed"
        );
      }
  
    }
  };
  const filtered = posts.filter(p => {
    const matchSearch = p.subject?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" ? true :
      filter === "Reported" ? p.reports_count > 0 :
      filter === "Active" ? p.status === "ACTIVE" :
      p.status === "DELETED";
    return matchSearch && matchFilter;
  });

  const reportedCount = posts.filter(p => p.reports_count > 0).length;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };
  const closeDrawer = () => {
    Animated.timing(translateX, { toValue: -300, duration: 200, useNativeDriver: true }).start(() => setDrawerOpen(false));
  };
  const handleMenu = (route: string) => {
    closeDrawer();
    if (route === "logout") {

      if (Platform.OS === "web") {
    
        const ok = window.confirm(
          "Are you sure you want to logout?"
        );
    
        if (ok) {
          router.replace("/loginscreen");
        }
    
      } else {
    
        Alert.alert(
          "Logout",
          "Are you sure?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Logout",
              onPress: () =>
                router.replace("/loginscreen"),
            },
          ]
        );
    
      }
    
      return;
    }
    router.push(`/admin/${route}` as any);
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={openDrawer}><Feather name="menu" size={24} color="#000" /></TouchableOpacity>
        <Text style={styles.topTitle}>Alumni Admin</Text>
        <Ionicons name="notifications-outline" size={24} color="#000" />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.pageTitle}>Forum</Text>
                <Text style={styles.breadcrumb}>Dashboard {">"} Forum</Text>
              </View>
              {reportedCount > 0 && (
                <View style={[styles.pendingBadge, { backgroundColor: "#FEE2E2" }]}>
                  <Text style={[styles.pendingBadgeText, { color: "#DC2626" }]}>{reportedCount} Reported</Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              {[
                { l: "Total Posts", v: posts.length, c: "#EEF2FF", tc: "#4F46E5" },
                { l: "Reported", v: reportedCount, c: "#FEE2E2", tc: "#DC2626" },
                { l: "Removed", v: posts.filter(p => p.status === "DELETED").length, c: "#F1F5F9", tc: "#64748B" },
              ].map((s, i) => (
                <View key={i} style={[styles.statCard, { backgroundColor: s.c }]}>
                  <Text style={[styles.statNum, { color: s.tc }]}>{s.v}</Text>
                  <Text style={[styles.statLbl, { color: s.tc }]}>{s.l}</Text>
                </View>
              ))}
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput placeholder="Search posts..." style={styles.searchInput} value={search} onChangeText={setSearch} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {FILTERS.map(f => (
                  <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
                    <Text style={[styles.filterText, filter === f && styles.filterActiveText]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.postCard, item.reports_count > 0 && { borderLeftWidth: 3, borderLeftColor: "#DC2626" }]}>
            <View style={styles.postTop}>
              <Image
                source={{ uri: item.profile_photo ? `${API}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
                style={styles.postAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.postAuthor}>{item.full_name}</Text>
                <Text style={styles.postMeta}>{item.programme} · {item.batch_year}</Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>
            <Text style={styles.postSubject}>{item.subject}</Text>
            <Text style={styles.postBody} numberOfLines={2}>{item.body}</Text>
            <View style={styles.postStats}>
              <Text style={styles.postStat}>👍 {item.likes_count}</Text>
              <Text style={styles.postStat}>💬 {item.replies_count}</Text>
              {item.reports_count > 0 && (
                <Text style={[styles.postStat, { color: "#DC2626" }]}>🚩 {item.reports_count} Reports</Text>
              )}
            </View>
            <View style={styles.actionRow}>
              {item.status === "ACTIVE" ? (
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleAction(item.id, "DELETED")}>
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.removeTxt}>Remove Post</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.restoreBtn} onPress={() => handleAction(item.id, "restore")}>
                  <Ionicons name="refresh-outline" size={16} color="#16A34A" />
                  <Text style={styles.restoreTxt}>Restore Post</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
      <Sidebar drawerOpen={drawerOpen} translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu} />
    </SafeAreaView>
  );
}
// styles — har file mein paste karo ya alag file bana lo

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F6FA" },
    topBar: { height: 65, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, elevation: 3 },
    topTitle: { fontSize: 18, fontWeight: "700" },
    pageTitle: { fontSize: 30, fontWeight: "800" },
    breadcrumb: { color: "#666", marginTop: 4 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    pendingBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
    pendingBadgeText: { color: "#D97706", fontWeight: "700", fontSize: 13 },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center" },
    statNum: { fontSize: 22, fontWeight: "800" },
    statLbl: { fontSize: 11, marginTop: 3, fontWeight: "600" },
    searchBox: { backgroundColor: "#fff", borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, height: 52, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#111" },
    filterBtn: { backgroundColor: "#E2E8F0", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
    filterActive: { backgroundColor: PRIMARY },
    filterText: { color: "#334155", fontWeight: "700", fontSize: 13 },
    filterActiveText: { color: "#fff" },
    // Member card
    memberCard: { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12, elevation: 2 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    memberName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
    memberSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
    memberEmail: { fontSize: 11, color: "#94A3B8", marginTop: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: "700" },
    // Modal
    backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    backText: { fontSize: 15, fontWeight: "600", marginLeft: 6 },
    profileCard: { backgroundColor: "#fff", borderRadius: 22, padding: 24, alignItems: "center", marginBottom: 16, elevation: 3 },
    profileAvatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
    profileName: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
    profileSub: { fontSize: 14, color: "#64748B", marginTop: 4 },
    detailCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 16, elevation: 2 },
    detailRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#F1F5F9" },
    detailLabel: { fontSize: 13, color: "#64748B", marginLeft: 10, flex: 1 },
    detailValue: { fontSize: 13, fontWeight: "600", color: "#0F172A", flex: 2, textAlign: "right" },
    actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    approveBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, backgroundColor: "#DCFCE7", paddingVertical: 13, borderRadius: 14 },
    approveTxt: { color: "#16A34A", fontWeight: "700", fontSize: 14 },
    rejectBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, backgroundColor: "#FEE2E2", paddingVertical: 13, borderRadius: 14 },
    rejectTxt: { color: "#DC2626", fontWeight: "700", fontSize: 14 },
    deleteBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 12, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#FCA5A5" },
    // Forum
    postCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12, elevation: 2 },
    postTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    postAvatar: { width: 42, height: 42, borderRadius: 21 },
    postAuthor: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
    postMeta: { fontSize: 12, color: "#64748B" },
    categoryBadge: { backgroundColor: "#DBEAFE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    categoryText: { color: "#2563EB", fontSize: 11, fontWeight: "700" },
    postSubject: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
    postBody: { fontSize: 13, color: "#64748B", lineHeight: 20 },
    postStats: { flexDirection: "row", gap: 14, marginVertical: 10 },
    postStat: { fontSize: 13, color: "#64748B", fontWeight: "600" },
    removeBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, backgroundColor: "#FEE2E2", paddingVertical: 11, borderRadius: 12 },
    removeTxt: { color: "#DC2626", fontWeight: "700", fontSize: 13 },
    restoreBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, backgroundColor: "#DCFCE7", paddingVertical: 11, borderRadius: 12 },
    restoreTxt: { color: "#16A34A", fontWeight: "700", fontSize: 13 },
    // Jobs
    jobCard: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12, elevation: 2 },
    jobTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
    jobLogo: { width: 48, height: 48, borderRadius: 12 },
    jobTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
    jobCompany: { fontSize: 12, color: "#64748B", marginTop: 2 },
    jobMeta: { fontSize: 12, color: "#64748B", marginBottom: 10 },
    activeBadge: { backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    activeText: { color: "#16A34A", fontSize: 11, fontWeight: "700" },
    closedBadge: { backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    closedText: { color: "#64748B", fontSize: 11, fontWeight: "700" },
    flaggedBadge: { backgroundColor: "#FEE2E2", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    flaggedText: { color: "#DC2626", fontSize: 11, fontWeight: "700" },
    skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
    skillChip: { backgroundColor: "#EDE9FE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    skillText: { color: "#6D28D9", fontSize: 11, fontWeight: "700" },
    closeJobBtn: { flex: 1, backgroundColor: "#FEF3C7", paddingVertical: 10, borderRadius: 12, alignItems: "center" },
    closeJobTxt: { color: "#D97706", fontWeight: "700", fontSize: 13 },
    flagBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, backgroundColor: "#FEE2E2", paddingVertical: 10, borderRadius: 12 },
    deleteJobBtn: { width: 42, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center", borderRadius: 12 },
    // Notifications
    sendCard: { backgroundColor: "#fff", borderRadius: 22, padding: 20, marginBottom: 20, elevation: 3 },
    cardTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
    chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    chipText: { fontSize: 12, fontWeight: "600", color: "#475569" },
    chipActiveText: { color: "#fff" },
    input: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 14, height: 52, fontSize: 14, color: "#111", marginBottom: 14 },
    sendBtn: { backgroundColor: PRIMARY, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
    sendBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 12 },
    histCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, elevation: 2 },
    histTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    histTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
    histTime: { fontSize: 11, color: "#94A3B8" },
    histMsg: { fontSize: 13, color: "#64748B", lineHeight: 20 },
    histTarget: { fontSize: 11, color: "#94A3B8", marginTop: 6 },
    // Dashboard
    statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
    quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
    quickCard: { width: "47%", backgroundColor: "#fff", borderRadius: 18, padding: 16, alignItems: "center", elevation: 2 },
    quickIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 10 },
    quickLabel: { fontSize: 13, fontWeight: "700", color: "#0F172A", textAlign: "center" },
    listCard: { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", marginBottom: 20, elevation: 2 },
    listRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
    listBorder: { borderBottomWidth: 0.5, borderBottomColor: "#F1F5F9" },
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
    listAvatarText: { fontSize: 16, fontWeight: "700", color: "#4F46E5" },
    listName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
    listSub: { fontSize: 12, color: "#64748B" },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    viewAllBtn: { padding: 14, alignItems: "center", borderTopWidth: 0.5, borderTopColor: "#F1F5F9" },
    viewAllText: { color: PRIMARY, fontWeight: "700", fontSize: 14 },
  });