
import { Feather, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Platform,
  ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Sidebar from "./components/sidebar";
import SidebarWeb from "./components/SidebarWeb";
const API = process.env.EXPO_PUBLIC_API_BASE;
const PRIMARY = "#5B5FEF";

const TABS = ["Pending", "Lectures", "Mentors", "Match", "Donations"];

// ─── Static Web Sidebar ───────────────────────────────────────────

export default function AdminContributions() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [activeTab, setActiveTab] = useState("Pending");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-300)).current;

  const [pending, setPending] = useState<any>({ lectures: [], mentors: [], donations: [], total: 0 });
  const [lectures, setLectures] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [matchRequests, setMatchRequests] = useState<any[]>([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [p, l, m, d, mr] = await Promise.all([
        axios.get(`${API}/admin/contributions/pending`),
        axios.get(`${API}/admin/contributions/lectures`),
        axios.get(`${API}/admin/contributions/mentors`),
        axios.get(`${API}/admin/contributions/donations`),
        axios.get(`${API}/admin/mentorship/requests`),
      ]);
      if (p.data.success) setPending(p.data);
      if (l.data.success) setLectures(l.data.data);
      if (m.data.success) setMentors(m.data.data);
      if (d.data.success) setDonations(d.data.data);
      if (mr.data.success) setMatchRequests(mr.data.data);
    } catch (err) { console.log(err); }
  };

  const handleAction = async (type: string, id: number, status: string) => {
    try {
      await axios.put(`${API}/admin/contribution/${type}/${id}`, { status });
      Alert.alert("Done ✅", `${type} ${status}`);
      fetchAll();
    } catch (err) { Alert.alert("Error", "Action failed"); }
  };

  const handleMatch = async (id: number, status: string) => {
    try {
      await axios.put(`${API}/admin/mentorship/match/${id}`, { status });
      Alert.alert("Done ✅", `Request ${status}`);
      fetchAll();
    } catch (err) { Alert.alert("Error", "Action failed"); }
  };

  const statusColor = (s: string) => {
    if (s === "Approved" || s === "Matched") return { bg: "#DCFCE7", text: "#16A34A" };
    if (s === "Rejected") return { bg: "#FEE2E2", text: "#DC2626" };
    return { bg: "#FEF3C7", text: "#D97706" };
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };
  const closeDrawer = () => {
    Animated.timing(translateX, { toValue: -300, duration: 200, useNativeDriver: true }).start(() => setDrawerOpen(false));
  };

  const ActionBtns = ({ type, id, status }: any) => (
    status === "Pending" ? (
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.approveBtn} onPress={() => handleAction(type, id, "Approved")}>
          <Ionicons name="checkmark" size={16} color="#16A34A" />
          <Text style={styles.approveTxt}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleAction(type, id, "Rejected")}>
          <Ionicons name="close" size={16} color="#DC2626" />
          <Text style={styles.rejectTxt}>Reject</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={[styles.doneBadge, { backgroundColor: statusColor(status).bg }]}>
        <Text style={{ color: statusColor(status).text, fontWeight: "700", fontSize: 12 }}>{status}</Text>
      </View>
    )
  );

  const handleMenu = (route: string) => {
    closeDrawer();
    if (route === "logout") {
      if (Platform.OS === "web") {
        const ok = window.confirm("Are you sure you want to logout?");
        if (ok) router.replace("/loginscreen");
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

  // ── Main content (same for both web & mobile) ─────────────────
  const MainContent = (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* HERO */}
      <View style={{ padding: 18 }}>
        <Text style={styles.pageTitle}>Contributions</Text>
        <Text style={styles.breadcrumb}>Dashboard {">"} Contributions</Text>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        {[
          { n: pending.total, l: "Pending", color: "#FEF3C7", tc: "#D97706" },
          { n: lectures.length, l: "Lectures", color: "#EEF2FF", tc: "#4F46E5" },
          { n: mentors.length, l: "Mentors", color: "#DCFCE7", tc: "#16A34A" },
          { n: donations.length, l: "Donations", color: "#FEF9C3", tc: "#CA8A04" },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: s.color }]}>
            <Text style={[styles.statNum, { color: s.tc }]}>{s.n}</Text>
            <Text style={[styles.statLbl, { color: s.tc }]}>{s.l}</Text>
          </View>
        ))}
      </View>

      {/* TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}{tab === "Pending" && pending.total > 0 ? ` (${pending.total})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ padding: 16, paddingBottom: 60 }}>

        {/* ════ PENDING ════ */}
        {activeTab === "Pending" && (
          <>
            {pending.total === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40 }}>✅</Text>
                <Text style={styles.emptyTitle}>All clear!</Text>
                <Text style={styles.emptySub}>No pending contributions</Text>
              </View>
            ) : (
              <>
                {pending.lectures.map((item: any) => (
                  <View key={`l-${item.id}`} style={[styles.pCard, { borderLeftColor: "#4F46E5" }]}>
                    <View style={styles.pCardTop}>
                      <Image source={{ uri: item.profile_photo ? `${API}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.avatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pCardName}>{item.topic}</Text>
                        <Text style={styles.pCardSub}>🎤 {item.full_name} · Guest Lecture</Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: "#EEF2FF" }]}>
                        <Text style={{ color: "#4F46E5", fontSize: 11, fontWeight: "700" }}>Lecture</Text>
                      </View>
                    </View>
                    <Text style={styles.pCardMeta}>
                      📅 {item.available_from || "Flexible"} – {item.available_to || "Flexible"}{"\n"}
                      👥 {item.target_batches || "Any Batch"} · {item.mode}{"\n"}
                      📝 {item.description?.slice(0, 80)}...
                    </Text>
                    <ActionBtns type="lecture" id={item.id} status={item.status} />
                  </View>
                ))}

                {pending.mentors.map((item: any) => (
                  <View key={`m-${item.id}`} style={[styles.pCard, { borderLeftColor: "#F59E0B" }]}>
                    <View style={styles.pCardTop}>
                      <Image source={{ uri: item.profile_photo ? `${API}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.avatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pCardName}>{item.full_name}</Text>
                        <Text style={styles.pCardSub}>🧑‍🏫 Mentor Registration</Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: "#FEF3C7" }]}>
                        <Text style={{ color: "#D97706", fontSize: 11, fontWeight: "700" }}>Mentor</Text>
                      </View>
                    </View>
                    <Text style={styles.pCardMeta}>
                      🧠 {item.expertise}{"\n"}
                      👥 Max {item.max_mentees} mentees
                    </Text>
                    <ActionBtns type="mentor" id={item.id} status={item.status} />
                  </View>
                ))}

                {pending.donations.map((item: any) => (
                  <View key={`d-${item.id}`} style={[styles.pCard, { borderLeftColor: "#16A34A" }]}>
                    <View style={styles.pCardTop}>
                      <Image source={{ uri: item.profile_photo ? `${API}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.avatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pCardName}>{item.full_name}</Text>
                        <Text style={styles.pCardSub}>💛 {item.donation_type} Donation</Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: "#DCFCE7" }]}>
                        <Text style={{ color: "#16A34A", fontSize: 11, fontWeight: "700" }}>Donation</Text>
                      </View>
                    </View>
                    <Text style={styles.pCardMeta}>
                      {item.donation_type === "Money" ? `💰 ₹${item.amount}` : ""}
                      {item.equipment_description ? `🖥️ ${item.equipment_description}` : ""}
                      {item.scholarship_description ? `🎓 ${item.scholarship_description}` : ""}
                      {item.message ? `\n💬 ${item.message}` : ""}
                      {item.receipt_number ? `\n🧾 ${item.receipt_number}` : ""}
                    </Text>
                    <ActionBtns type="donation" id={item.id} status={item.status} />
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ════ LECTURES ════ */}
        {activeTab === "Lectures" && lectures.map(item => (
          <View key={item.id} style={styles.pCard}>
            <View style={styles.pCardTop}>
              <Image source={{ uri: item.profile_photo ? `${API}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pCardName}>{item.topic}</Text>
                <Text style={styles.pCardSub}>{item.full_name} · {item.designation}</Text>
              </View>
              <View style={[styles.doneBadge, { backgroundColor: statusColor(item.status).bg }]}>
                <Text style={{ color: statusColor(item.status).text, fontWeight: "700", fontSize: 11 }}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.pCardMeta}>
              📅 {item.available_from || "Flexible"} – {item.available_to || "Flexible"}{"\n"}
              👥 {item.target_batches} · {item.mode}
            </Text>
            {item.status === "Pending" && <ActionBtns type="lecture" id={item.id} status={item.status} />}
          </View>
        ))}

        {/* ════ MENTORS ════ */}
        {activeTab === "Mentors" && mentors.map(item => (
          <View key={item.id} style={styles.pCard}>
            <View style={styles.pCardTop}>
              <Image source={{ uri: item.profile_photo ? `${API}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pCardName}>{item.full_name}</Text>
                <Text style={styles.pCardSub}>{item.designation} · Batch {item.batch_year}</Text>
              </View>
              <View style={[styles.doneBadge, { backgroundColor: statusColor(item.status).bg }]}>
                <Text style={{ color: statusColor(item.status).text, fontWeight: "700", fontSize: 11 }}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.pCardMeta}>🧠 {item.expertise}{"\n"}👥 Max {item.max_mentees} mentees</Text>
            {item.status === "Pending" && <ActionBtns type="mentor" id={item.id} status={item.status} />}
            {item.status === "Approved" && (
              <TouchableOpacity
                style={[styles.approveBtn, { marginTop: 10 }]}
                onPress={() => handleAction("mentor", item.id, "Rejected")}
              >
                <Text style={styles.rejectTxt}>Deactivate Mentor</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* ════ MATCH ════ */}
        {activeTab === "Match" && (
          <>
            {matchRequests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 40 }}>🔗</Text>
                <Text style={styles.emptyTitle}>No match requests</Text>
              </View>
            ) : (
              matchRequests.map(item => (
                <View key={item.id} style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <Text style={styles.pCardName}>Match Request</Text>
                    <View style={[styles.doneBadge, { backgroundColor: statusColor(item.status).bg }]}>
                      <Text style={{ color: statusColor(item.status).text, fontWeight: "700", fontSize: 11 }}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.matchRow}>
                    <View style={styles.matchPerson}>
                      <Image source={{ uri: item.requester_photo ? `${API}/uploads/${item.requester_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.matchAvatar} />
                      <Text style={styles.matchName} numberOfLines={1}>{item.requester_name}</Text>
                      <Text style={styles.matchRole}>{item.requester_programme}</Text>
                    </View>
                    <View style={styles.arrowBox}>
                      <Ionicons name="arrow-forward" size={22} color={PRIMARY} />
                      <Text style={{ fontSize: 10, color: PRIMARY, fontWeight: "700" }}>Requests</Text>
                    </View>
                    <View style={styles.matchPerson}>
                      <Image source={{ uri: item.mentor_photo ? `${API}/uploads/${item.mentor_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.matchAvatar} />
                      <Text style={styles.matchName} numberOfLines={1}>{item.mentor_name}</Text>
                      <Text style={styles.matchRole}>{item.mentor_designation}</Text>
                    </View>
                  </View>
                  {item.message && (
                    <View style={styles.msgBox}>
                      <Text style={styles.msgText}>💬 "{item.message}"</Text>
                    </View>
                  )}
                  <Text style={styles.pCardMeta}>🧠 {item.expertise}</Text>
                  {item.status === "Pending" && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleMatch(item.id, "Matched")}>
                        <Ionicons name="link" size={16} color="#16A34A" />
                        <Text style={styles.approveTxt}>Confirm Match</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => handleMatch(item.id, "Rejected")}>
                        <Ionicons name="close" size={16} color="#DC2626" />
                        <Text style={styles.rejectTxt}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {/* ════ DONATIONS ════ */}
        {activeTab === "Donations" && donations.map(item => (
          <View key={item.id} style={[styles.pCard, { borderLeftColor: "#16A34A" }]}>
            <View style={styles.pCardTop}>
              <Image source={{ uri: item.profile_photo ? `${API}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pCardName}>{item.full_name}</Text>
                <Text style={styles.pCardSub}>{item.donation_type} Donation</Text>
              </View>
              <View style={[styles.doneBadge, { backgroundColor: statusColor(item.status).bg }]}>
                <Text style={{ color: statusColor(item.status).text, fontWeight: "700", fontSize: 11 }}>{item.status}</Text>
              </View>
            </View>
            {item.donation_type === "Money" && (
              <Text style={styles.donationAmount}>₹ {Number(item.amount).toLocaleString("en-IN")}</Text>
            )}
            {item.equipment_description && <Text style={styles.pCardMeta}>🖥️ {item.equipment_description}</Text>}
            {item.scholarship_description && <Text style={styles.pCardMeta}>🎓 {item.scholarship_description}</Text>}
            {item.receipt_number && <Text style={styles.receiptNo}>🧾 {item.receipt_number}</Text>}
            {item.message && <Text style={styles.pCardMeta}>💬 {item.message}</Text>}
            {item.status === "Pending" && <ActionBtns type="donation" id={item.id} status={item.status} />}
          </View>
        ))}

      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ── WEB: static sidebar + content side by side ── */}
      {isWeb ? (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <SidebarWeb handleMenu={handleMenu} />
          <View style={{ flex: 1 }}>
            {MainContent}
          </View>
        </View>
      ) : (
        /* ── MOBILE: topbar + drawer + content ── */
        <>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={openDrawer}>
              <Feather name="menu" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Contributions</Text>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </View>
          {MainContent}
          <Sidebar drawerOpen={drawerOpen} translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },
  topBar: {
    height: 65, backgroundColor: "#fff",
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 18, elevation: 3,
  },
  topTitle: { fontSize: 18, fontWeight: "700" },
  pageTitle: { fontSize: 30, fontWeight: "800" },
  breadcrumb: { color: "#666", marginTop: 4 },

  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 4 },
  statCard: { flex: 1, borderRadius: 16, padding: 12, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLbl: { fontSize: 11, marginTop: 2, fontWeight: "600" },

  tabsRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  tabBtn: { backgroundColor: "#E2E8F0", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  activeTab: { backgroundColor: PRIMARY },
  tabText: { color: "#334155", fontWeight: "700", fontSize: 13 },
  activeTabText: { color: "#fff" },

  pCard: {
    backgroundColor: "#fff", borderRadius: 18,
    padding: 16, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: "#F59E0B",
    elevation: 2,
  },
  pCardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  pCardName: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  pCardSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  pCardMeta: { fontSize: 13, color: "#475569", lineHeight: 22, marginBottom: 12 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },

  actionRow: { flexDirection: "row", gap: 10 },
  approveBtn: {
    flex: 1, flexDirection: "row", justifyContent: "center",
    alignItems: "center", gap: 6, backgroundColor: "#DCFCE7",
    paddingVertical: 11, borderRadius: 12,
  },
  approveTxt: { color: "#16A34A", fontWeight: "700", fontSize: 13 },
  rejectBtn: {
    flex: 1, flexDirection: "row", justifyContent: "center",
    alignItems: "center", gap: 6, backgroundColor: "#FEE2E2",
    paddingVertical: 11, borderRadius: 12,
  },
  rejectTxt: { color: "#DC2626", fontWeight: "700", fontSize: 13 },
  doneBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },

  matchCard: {
    backgroundColor: "#fff", borderRadius: 18,
    padding: 16, marginBottom: 14, elevation: 2,
  },
  matchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  matchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  matchPerson: { alignItems: "center", flex: 1 },
  matchAvatar: { width: 52, height: 52, borderRadius: 26, marginBottom: 6 },
  matchName: { fontSize: 13, fontWeight: "700", color: "#0F172A", textAlign: "center" },
  matchRole: { fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 2 },
  arrowBox: { alignItems: "center", paddingHorizontal: 8 },
  msgBox: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 10, marginBottom: 10 },
  msgText: { fontSize: 13, color: "#475569", fontStyle: "italic" },

  donationAmount: { fontSize: 26, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  receiptNo: { fontSize: 12, color: "#64748B", fontWeight: "600", marginBottom: 8 },

  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#64748B", marginTop: 4 },
});