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

export default function AdminJobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Active");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-300)).current;

  const FILTERS = ["Active", "Closed", "Flagged", "All"];

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API}/admin/jobs`);
      if (res.data.success) setJobs(res.data.data);
    } catch (err) { console.log(err); }
  };

  const handleClose = async (
    id: number
  ) => {
    try {
      await axios.put(
        `${API}/jobs/close/${id}`
      );
  
      // ✅ WEB + MOBILE ALERT
      if (Platform.OS === "web") {
        window.alert(
          "✅ Job closed successfully"
        );
      } else {
        Alert.alert(
          "Done ✅",
          "Job closed"
        );
      }
  
      fetchJobs();
  
    } catch (err) {
  
      if (Platform.OS === "web") {
        window.alert(
          "❌ Failed to close job"
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to close job"
        );
      }
    }
  };
  
  const handleFlag = async (
    id: number,
    flag: number
  ) => {
    try {
      await axios.put(
        `${API}/admin/jobs/flag/${id}`,
        {
          is_flagged: flag,
        }
      );
  
      // ✅ WEB + MOBILE ALERT
      if (Platform.OS === "web") {
        window.alert(
          flag
            ? "🚩 Job flagged"
            : "✅ Flag removed"
        );
      } else {
        Alert.alert(
          "Done ✅",
          flag
            ? "Job flagged"
            : "Flag removed"
        );
      }
  
      fetchJobs();
  
    } catch (err) {
  
      if (Platform.OS === "web") {
        window.alert(
          "❌ Action failed"
        );
      } else {
        Alert.alert(
          "Error",
          "Action failed"
        );
      }
    }
  };
  
  const handleDelete = async (
    id: number
  ) => {
  
    // ✅ WEB CONFIRM
    if (Platform.OS === "web") {
  
      const ok = window.confirm(
        "Are you sure you want to delete this job?"
      );
  
      if (ok) {
        try {
          await axios.delete(
            `${API}/admin/jobs/${id}`
          );
  
          window.alert(
            "✅ Job deleted successfully"
          );
  
          fetchJobs();
  
        } catch (err) {
  
          window.alert(
            "❌ Failed to delete job"
          );
        }
      }
  
      return;
    }
  
    // ✅ MOBILE ALERT
    Alert.alert(
      "Delete Job",
      "Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
  
              await axios.delete(
                `${API}/admin/jobs/${id}`
              );
  
              Alert.alert(
                "Done ✅",
                "Job deleted"
              );
  
              fetchJobs();
  
            } catch (err) {
  
              Alert.alert(
                "Error",
                "Failed to delete job"
              );
            }
          },
        },
      ]
    );
  };

  const filtered = jobs.filter(j => {
    const matchSearch = j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ? true :
      filter === "Active" ? !j.is_closed && !j.is_flagged :
      filter === "Closed" ? j.is_closed :
      j.is_flagged;
    return matchSearch && matchFilter;
  });

  const openDrawer = () => { setDrawerOpen(true); Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start(); };
  const closeDrawer = () => { Animated.timing(translateX, { toValue: -300, duration: 200, useNativeDriver: true }).start(() => setDrawerOpen(false)); };
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
                <Text style={styles.pageTitle}>Job Board</Text>
                <Text style={styles.breadcrumb}>Dashboard {">"} Jobs</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              {[
                { l: "Total", v: jobs.length, c: "#EEF2FF", tc: "#4F46E5" },
                { l: "Active", v: jobs.filter(j => !j.is_closed).length, c: "#DCFCE7", tc: "#16A34A" },
                { l: "Flagged", v: jobs.filter(j => j.is_flagged).length, c: "#FEE2E2", tc: "#DC2626" },
              ].map((s, i) => (
                <View key={i} style={[styles.statCard, { backgroundColor: s.c }]}>
                  <Text style={[styles.statNum, { color: s.tc }]}>{s.v}</Text>
                  <Text style={[styles.statLbl, { color: s.tc }]}>{s.l}</Text>
                </View>
              ))}
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput placeholder="Search jobs..." style={styles.searchInput} value={search} onChangeText={setSearch} />
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
          <View style={[styles.jobCard, item.is_flagged && { borderLeftWidth: 3, borderLeftColor: "#DC2626" }]}>
            <View style={styles.jobTop}>
              <Image
                source={{ uri: item.company_logo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
                style={styles.jobLogo}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.jobCompany}>{item.company} · {item.location}</Text>
              </View>
              {item.is_closed ? (
                <View style={styles.closedBadge}><Text style={styles.closedText}>Closed</Text></View>
              ) : item.is_flagged ? (
                <View style={styles.flaggedBadge}><Text style={styles.flaggedText}>Flagged</Text></View>
              ) : (
                <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>
              )}
            </View>
            <Text style={styles.jobMeta}>👤 Posted by {item.full_name} · Expires {item.expires_on}</Text>
            <View style={styles.skillRow}>
              {item.skills?.split(",").slice(0, 3).map((s: string, i: number) => (
                <View key={i} style={styles.skillChip}><Text style={styles.skillText}>{s.trim()}</Text></View>
              ))}
            </View>
            <View style={styles.actionRow}>
              {!item.is_closed && (
                <TouchableOpacity style={styles.closeJobBtn} onPress={() => handleClose(item.id)}>
                  <Text style={styles.closeJobTxt}>Close Job</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.flagBtn, item.is_flagged && { backgroundColor: "#DCFCE7" }]}
                onPress={() => handleFlag(item.id, item.is_flagged ? 0 : 1)}
              >
                <Ionicons name={item.is_flagged ? "flag" : "flag-outline"} size={16} color={item.is_flagged ? "#16A34A" : "#DC2626"} />
                <Text style={{ color: item.is_flagged ? "#16A34A" : "#DC2626", fontWeight: "700", fontSize: 13 }}>
                  {item.is_flagged ? "Unflag" : "Flag"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteJobBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
              </TouchableOpacity>
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