import { Feather, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert, Animated, FlatList, Image,
    Platform, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity,
    View, useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Sidebar from "./components/sidebar";
import SidebarWeb from "./components/SidebarWeb";

const API     = "http://10.254.25.118:2000";
const PRIMARY = "#5B5FEF";

const FILTERS = ["All", "Reported", "Active", "Removed"];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Question:     { bg: "#DBEAFE", text: "#2563EB" },
  Suggestion:   { bg: "#DCFCE7", text: "#16A34A" },
  Feedback:     { bg: "#FEF3C7", text: "#D97706" },
  Announcement: { bg: "#F3E8FF", text: "#7C3AED" },
};

export default function AdminForum() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [posts,      setPosts]      = useState<any[]>([]);
  const [filter,     setFilter]     = useState("All");
  const [search,     setSearch]     = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API}/admin/forum/posts`);
      if (res.data.success) setPosts(res.data.data);
    } catch (err) { console.log(err); }
  };

  const handleAction = async (id: number, action: "DELETED" | "restore") => {
    try {
      await axios.put(`${API}/admin/forum/post/${id}`, {
        status: action === "DELETED" ? "DELETED" : "ACTIVE",
      });
      const msg = action === "DELETED" ? "Post removed successfully" : "Post restored successfully";
      Platform.OS === "web" ? window.alert(`✅ ${msg}`) : Alert.alert("Done ✅", msg);
      fetchPosts();
    } catch {
      Platform.OS === "web" ? window.alert("❌ Action failed") : Alert.alert("Error", "Action failed");
    }
  };

  const filtered = posts.filter(p => {
    const matchSearch = p.subject?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All"      ? true :
      filter === "Reported" ? p.reports_count > 0 :
      filter === "Active"   ? p.status === "ACTIVE" :
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
        if (window.confirm("Are you sure you want to logout?")) router.replace("/loginscreen");
      } else {
        Alert.alert("Logout", "Are you sure?", [
          { text: "Cancel", style: "cancel" },
          { text: "Logout", onPress: () => router.replace("/loginscreen") },
        ]);
      }
      return;
    }
    router.push(`/admin/${route}` as any);
  };

  // ── Post card (shared) ───────────────────────────────────────
  const renderPost = ({ item }: { item: any }) => {
    const catColor = CATEGORY_COLORS[item.category] || { bg: "#F1F5F9", text: "#64748B" };
    return (
      <View style={[
        styles.postCard,
        item.reports_count > 0 && { borderLeftWidth: 3, borderLeftColor: "#DC2626" }||
         { borderLeftWidth: 3, borderLeftColor: "#16A34A" },
      ]}>
        <View style={styles.postTop}>
          <Image
            source={{ uri: item.profile_photo
              ? `${API}/uploads/${item.profile_photo}`
              : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
            style={styles.postAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.postAuthor}>{item.full_name}</Text>
            <Text style={styles.postMeta}>{item.programme} · {item.batch_year}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
            <Text style={[styles.categoryText, { color: catColor.text }]}>{item.category}</Text>
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
          <View style={[
            styles.statusPill,
            { backgroundColor: item.status === "ACTIVE" ? "#DCFCE7" : "#F1F5F9" },
          ]}>
            <Text style={[styles.statusPillText, { color: item.status === "ACTIVE" ? "#16A34A" : "#64748B" }]}>
              {item.status}
            </Text>
          </View>
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
    );
  };

  // ── List header ──────────────────────────────────────────────
  const ListHeader = React.memo(() => (
    <>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.breadcrumb}>Dashboard › Forum</Text>
          <Text style={styles.pageTitle}>Forum</Text>
        </View>
        {reportedCount > 0 && (
          <View style={[styles.badge, { backgroundColor: "#FEE2E2" }]}>
            <Text style={[styles.badgeText, { color: "#DC2626" }]}>{reportedCount} Reported</Text>
          </View>
        )}
      </View>

      {/* STAT CARDS */}
      <View style={styles.statsRow}>
        {[
          { l: "Total Posts", v: posts.length,                                    c: "#EEF2FF", tc: "#4F46E5" },
          { l: "Reported",    v: reportedCount,                                   c: "#FEE2E2", tc: "#DC2626" },
          { l: "Removed",     v: posts.filter(p => p.status === "DELETED").length, c: "#F1F5F9", tc: "#64748B" },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: s.c }]}>
            <Text style={[styles.statNum, { color: s.tc }]}>{s.v}</Text>
            <Text style={[styles.statLbl, { color: s.tc }]}>{s.l}</Text>
          </View>
        ))}
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748B" />
        <TextInput
          placeholder="Search posts..."
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          autoFocus={true}
          blurOnSubmit={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER CHIPS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterActiveText]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  ));

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* TOP BAR — mobile only */}
      {!isWeb && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={openDrawer}>
            <Feather name="menu" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Alumni Admin</Text>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </View>
      )}

      <View style={{ flex: 1, flexDirection: "row" }}>

        {/* SIDEBAR — web: always visible, mobile: drawer */}
        {isWeb &&
           <SidebarWeb handleMenu={handleMenu} />
        }

        {/* MAIN CONTENT */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          keyboardShouldPersistTaps="always"
           removeClippedSubviews={false}
          contentContainerStyle={[
            styles.listContent,
            isWeb && { maxWidth: 1150, alignSelf: "center", width: "100%" },
          ]}
          ListHeaderComponent={ListHeader}
          renderItem={renderPost}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbubbles-outline" size={52} color="#CBD5E1" />
              <Text style={styles.emptyText}>No posts found</Text>
            </View>
          }
        />
      </View>
      {!isWeb &&
      <Sidebar drawerOpen={drawerOpen} translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu}/>
      }</SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#F5F6FA" },

  topBar: {
    height: 65, backgroundColor: "#fff",
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, elevation: 3,
    borderBottomWidth: 0.5, borderBottomColor: "#E2E8F0",
  },
  topTitle: { fontSize: 18, fontWeight: "700" },

  listContent: { padding: 16, paddingBottom: 80 },

  // Header
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  breadcrumb: { color: "#94A3B8", fontSize: 12, marginBottom: 4 },
  pageTitle:  { fontSize: 28, fontWeight: "800", color: "#0F172A" },
  badge:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  badgeText:  { fontWeight: "700", fontSize: 13 },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center" },
  statNum:  { fontSize: 22, fontWeight: "800" },
  statLbl:  { fontSize: 11, marginTop: 3, fontWeight: "600" },

  // Search
  searchBox: {
    backgroundColor: "#fff", borderRadius: 16,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, height: 52,
    marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#111" ,outlineWidth: 0,
  outlineColor: "transparent",
  outlineStyle: "none",

  borderWidth: 0,} as any,

  // Filters
  filterBtn:       { backgroundColor: "#E2E8F0", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  filterActive:    { backgroundColor: PRIMARY },
  filterText:      { color: "#334155", fontWeight: "700", fontSize: 13 },
  filterActiveText:{ color: "#fff" },

  // Post card
  postCard: {
    backgroundColor: "#fff", borderRadius: 18,
    padding: 16, marginBottom: 12, elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
  },
  postTop:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  postAvatar: { width: 42, height: 42, borderRadius: 21 },
  postAuthor: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  postMeta:   { fontSize: 12, color: "#64748B" },

  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryText:  { fontSize: 11, fontWeight: "700" },

  postSubject: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  postBody:    { fontSize: 13, color: "#64748B", lineHeight: 20 },

  postStats: { flexDirection: "row", gap: 12, marginVertical: 10, alignItems: "center", flexWrap: "wrap" },
  postStat:  { fontSize: 13, color: "#64748B", fontWeight: "600" },

  statusPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: "700" },

  actionRow:  { flexDirection: "row", gap: 10, marginTop: 4 },
  removeBtn:  { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, backgroundColor: "#FEE2E2", paddingVertical: 11, borderRadius: 12 },
  removeTxt:  { color: "#DC2626", fontWeight: "700", fontSize: 13 },
  restoreBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, backgroundColor: "#DCFCE7", paddingVertical: 11, borderRadius: 12 },
  restoreTxt: { color: "#16A34A", fontWeight: "700", fontSize: 13 },

  // Empty
  emptyBox:  { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 15, color: "#9ca3af", fontWeight: "600", marginTop: 12 },
});