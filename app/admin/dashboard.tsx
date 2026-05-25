import { Feather, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, Animated,
  Image,
  Platform,
  ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Sidebar from "./components/sidebar";


const isWeb = Platform.OS === "web";


// Quick card: mobile=2col, web=4col

const API = "http://192.168.29.217:2000";
const PRIMARY = "#5B5FEF";

export default function AdminDashboard() {
  const { width } = useWindowDimensions();

const isDesktop = width > 900;
const isTablet = width > 600 && width <= 900;

const STAT_W = isDesktop
  ? "31%"
  : isTablet
  ? "48%"
  : "48%";
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [pendingContribs, setPendingContribs] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [s, m, j, c] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/members?limit=5`),
        axios.get(`${API}/jobs`),
        axios.get(`${API}/admin/contributions/pending`),
      ]);
      if (s.data.success) setStats(s.data.data);
      if (m.data.success) setRecentMembers(m.data.data.slice(0, 5));
      if (j.data.success) setRecentJobs(j.data.jobs.slice(0, 3));
      if (c.data.success) setPendingContribs(c.data.total);
    } catch (err) { console.log(err); }
  };

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

  const STAT_CARDS = [
    { label: "Total Members", value: stats.total_members || 0, icon: "people-outline", color: "#EEF2FF", tc: "#4F46E5" },
    { label: "Pending Approval", value: stats.pending_members || 0, icon: "time-outline", color: "#FEF3C7", tc: "#D97706" },
    { label: "Total Events", value: stats.total_events || 0, icon: "calendar-outline", color: "#DCFCE7", tc: "#16A34A" },
    { label: "Active Jobs", value: stats.active_jobs || 0, icon: "briefcase-outline", color: "#FEE2E2", tc: "#DC2626" },
    { label: "Forum Posts", value: stats.total_posts || 0, icon: "chatbubbles-outline", color: "#F3E8FF", tc: "#7C3AED" },
    { label: "Contributions", value: stats.total_donations, icon: "heart-outline", color: "#FEF9C3", tc: "#CA8A04" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={openDrawer}>
          <Feather name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Alumni Admin</Text>
        <Ionicons name="notifications-outline" size={24} color="#000" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
        <Text style={styles.pageTitle}>Dashboard</Text>
        <Text style={styles.breadcrumb}>Welcome back, Admin 👋</Text>

        {/* STAT GRID */}
        {/* STAT GRID */}
<View style={styles.statGrid}>
  {STAT_CARDS.map((s, i) => (
    <View
    key={i}
    style={[
      styles.statCard,
      { width: STAT_W }
    ]}
  >
      <View style={[styles.statIconBox, { backgroundColor: s.color }]}>
        <Ionicons name={s.icon as any} size={22} color={s.tc} />
      </View>
      <View style={styles.statTextBox}>
        <Text style={[styles.statNum, { color: s.tc }]}>{s.value}</Text>
        <Text style={styles.statLbl}>{s.label}</Text>
      </View>
    </View>
  ))}
</View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          {[
            { label: "Approve Members", route: "members", icon: "person-add-outline", color: "#4F46E5" },
            { label: "Create Event", route: "event", icon: "calendar-outline", color: "#16A34A" },
            { label: "Review Forum", route: "forum", icon: "flag-outline", color: "#DC2626" },
            { label: "View Jobs", route: "jobs", icon: "briefcase-outline", color: "#D97706" },
          ].map((q, i) => (
            <TouchableOpacity key={i} style={styles.quickCard} onPress={() => router.push(`/admin/${q.route}` as any)}>
              <View style={[styles.quickIcon, { backgroundColor: q.color + "20" }]}>
                <Ionicons name={q.icon as any} size={22} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECENT MEMBERS */}
        <Text style={styles.sectionTitle}>Recent Members</Text>
        <View style={styles.listCard}>
          {recentMembers.map((m, i) => (
            <View key={i} style={[styles.listRow, i < recentMembers.length - 1 && styles.listBorder]}>
              {
  m.profile_photo ? (
    <Image
      source={{
        uri: `${API}/uploads/${m.profile_photo}`,
      }}
      style={styles.memberImg}
    />
  ) : (
    <View style={styles.listAvatar}>
      <Text style={styles.listAvatarText}>
        {m.full_name?.[0]}
      </Text>
    </View>
  )
}
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{m.full_name}</Text>
                <Text style={styles.listSub}>{m.programme} · {m.batch_year}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: m.approved ? "#16A34A" : "#D97706" }]} />
            </View>
          ))}
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push("/admin/members" as any)}>
            <Text style={styles.viewAllText}>View All Members →</Text>
          </TouchableOpacity>
        </View>

        {/* RECENT JOBS */}
        <Text style={styles.sectionTitle}>Recent Jobs</Text>
        <View style={styles.listCard}>
          {recentJobs.map((j, i) => (
            <View key={i} style={[styles.listRow, i < recentJobs.length - 1 && styles.listBorder]}>
              <View style={[styles.listAvatar, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="briefcase-outline" size={18} color="#6D28D9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listName}>{j.title}</Text>
                <Text style={styles.listSub}>{j.company} · {j.location}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push("/admin/jobs" as any)}>
            <Text style={styles.viewAllText}>View All Jobs →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Sidebar drawerOpen={drawerOpen} translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu} />
    </SafeAreaView>
  );
}
// styles — har file mein paste karo ya alag file bana lo

const styles = StyleSheet.create({
 
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 24,
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
  },
  statCard: {
   
    minHeight: 110,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    elevation: 3,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },
statIconBox: {
  width: 42, height: 42,
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
  textAlign:"center",
},
statTextBox: {
  flex: 1,
  textAlign:"center",
},
statNum: {
  fontSize: isWeb ? 28 : 22,
  fontWeight: "800",
},
statLbl: { fontSize: 11, color: "#64748B", marginTop: 3 },
  container: { flex: 1, backgroundColor: "#F5F6FA" },
  topBar: { height: 65, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, elevation: 3 },
  topTitle: { fontSize: 18, fontWeight: "700" },
  pageTitle: { fontSize: 30, fontWeight: "800" },
  breadcrumb: { color: "#666", marginTop: 4 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  pendingBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  pendingBadgeText: { color: "#D97706", fontWeight: "700", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
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
  memberImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});