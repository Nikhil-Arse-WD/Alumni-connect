import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, Animated,
  Image,
  Modal, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View, useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarWeb from "./components/SidebarWeb";
import Sidebar from "./components/sidebar";


const API     = process.env.EXPO_PUBLIC_API_BASE;
const PRIMARY = "#6366f1";
const BREAKPOINT = 768;

// ── theme ──────────────────────────────────────────────────────────
const C = {
  bg: "#f1f5f9", bgWeb: "#f8fafc", card: "#fff",
  text: "#111827", muted: "#6b7280", faint: "#9ca3af",
  border: "#e5e7eb", borderSoft: "#f3f4f6", rowAlt: "#f9fafb",
  primary: "#6366f1", primarySoft: "#ede9fe", primaryDeep: "#7c3aed",
  amber: "#f59e0b", amberDeep: "#b45309", amberSoft: "#fef3c7",
  green: "#10b981", greenDeep: "#059669", greenSoft: "#d1fae5", greenSoftDeep: "#065f46",
  red: "#dc2626", redSoft: "#fee2e2",
};

// ── avatar gradient pool ───────────────────────────────────────────
const GRAD_PAIRS = [
  ["#fbbf24","#f59e0b"], ["#60a5fa","#3b82f6"], ["#f472b6","#ec4899"],
  ["#34d399","#10b981"], ["#94a3b8","#64748b"], ["#a78bfa","#7c3aed"],
];
const gradForName = (name = "") => GRAD_PAIRS[name.charCodeAt(0) % GRAD_PAIRS.length];
const initials    = (name = "") =>
  name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

// ── status config ──────────────────────────────────────────────────
const STATUS = {
  0: { label: "Pending",  bg: C.amberSoft, color: C.amberDeep },
  1: { label: "Approved", bg: C.greenSoft, color: C.greenSoftDeep },
  2: { label: "Rejected", bg: C.redSoft,   color: C.red },
};

// ═══════════════════════════════════════════════════════════════════
// ROOT — switches layout by screen width
// ═══════════════════════════════════════════════════════════════════
export default function AdminMembers() {
  const { width } = useWindowDimensions();
  return width >= BREAKPOINT ? <WebLayout /> : <MobileLayout />;
}

// ═══════════════════════════════════════════════════════════════════
// SHARED DATA HOOK
// ═══════════════════════════════════════════════════════════════════
function useMembers() {
  const [members, setMembers]         = useState<any[]>([]);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("All");
  const [selectedMember, setSelected] = useState<any>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [role, setRole]               = useState("admin");

  useEffect(() => { 
    fetchMembers(); 
    AsyncStorage.getItem("admin_user").then(val => {
      if (val) {
        const parsed = JSON.parse(val);
        if (parsed.role) setRole(parsed.role);
      }
    });
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`${API}/admin/members`);
      if (res.data.success) setMembers(res.data.data);
    } catch (err) { console.log(err); }
  };

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = m.full_name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    const matchFilter =
      filter === "All"      ? true :
      filter === "Pending"  ? m.approved === 0 :
      filter === "Approved" ? m.approved === 1 : m.approved === 2;
    return matchSearch && matchFilter;
  });

  const handleApprove = async (id: number, status: number) => {
    try {
      await axios.put(`${API}/admin/member/approve/${id}`, { approved: status });
      const msg = status === 1 ? "Member Approved ✅" : "Member Rejected";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Done", msg);
      fetchMembers();
      setDetailModal(false);
    } catch { Alert.alert("Error", "Action failed"); }
  };

  const handleDelete = async (id: number) => {
    const doDelete = async () => {
      await axios.delete(`${API}/admin/member/${id}`);
      fetchMembers();
    };
    if (Platform.OS === "web") {
      if (window.confirm("Delete this member?")) { await doDelete(); window.alert("Deleted ✅"); }
    } else {
      Alert.alert("Delete Member", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const counts = {
    All:      members.length,
    Approved: members.filter(m => m.approved === 1).length,
    Pending:  members.filter(m => m.approved === 0).length,
    Rejected: members.filter(m => m.approved === 2).length,
  };

  return {
    members, filtered, search, setSearch,
    filter, setFilter, counts,
    selectedMember, setSelected,
    detailModal, setDetailModal,
    handleApprove, handleDelete, role,
  };
}

// ═══════════════════════════════════════════════════════════════════
// DETAIL MODAL (shared)
// ═══════════════════════════════════════════════════════════════════
function DetailModal({ member, visible, onClose, onApprove, onDelete, role }: any) {
  if (!member) return null;
  const st = STATUS[member.approved as 0|1|2];
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F6FA" }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <TouchableOpacity style={s.backBtn} onPress={onClose}>
            <Ionicons name="chevron-back" size={22} color="#000" />
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>

          {/* PROFILE CARD */}
          <View style={s.profileCard}>
          <Image
                  source={{ uri: member.profile_photo ? `${API}/uploads/${member.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
                  style={s.profileAvatar}
                />
            <Text style={s.profileName}>{member.full_name}</Text>
            <Text style={s.profileSub}>{member.designation} · {member.organisation}</Text>
            <View style={[s.statusBadge, { backgroundColor: st.bg, marginTop: 8 }]}>
              <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
            </View>
          </View>

          {/* DETAIL FIELDS */}
          <View style={s.detailCard}>
            {[
              ["mail-outline",     "Email",      member.email],
              ["call-outline",     "Mobile",     member.mobile],
              ["school-outline",   "Programme",  member.programme],
              ["calendar-outline", "Batch Year", member.batch_year],
              ["location-outline", "City",       member.city],
              ["globe-outline",    "Country",    member.country],
              ["business-outline", "Industry",   member.industry],
              ["card-outline",     "Member ID",  member.member_id],
              ["receipt-outline",  "Receipt No", member.receipt_number],
              ["cash-outline",     "Payment",    member.payment_status],
            ].map(([icon, label, value], i) => value ? (
              <View key={i} style={s.detailRow}>
                <Ionicons name={icon as any} size={18} color={PRIMARY} />
                <Text style={s.detailLabel}>{label}</Text>
                <Text style={s.detailValue}>{value}</Text>
              </View>
            ) : null)}
          </View>

          {/* ACTIONS */}
          {member.approved === 0 && (
            <View style={s.actionRow}>
              <TouchableOpacity style={s.approveBtn} onPress={() => onApprove(member.id, 1)}>
                <Ionicons name="checkmark" size={18} color={C.greenDeep} />
                <Text style={s.approveTxt}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.rejectBtn} onPress={() => onApprove(member.id, 2)}>
                <Ionicons name="close" size={18} color={C.red} />
                <Text style={s.rejectTxt}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
          {member.approved === 1 && (
            <TouchableOpacity style={[s.rejectBtn, { marginTop: 12 }]} onPress={() => onApprove(member.id, 0)}>
              <Text style={s.rejectTxt}>Revoke Approval</Text>
            </TouchableOpacity>
          )}
          {role === 'super_admin' && (
            <TouchableOpacity style={s.deleteBtn} onPress={() => { onClose(); onDelete(member.id); }}>
              <Ionicons name="trash-outline" size={18} color={C.red} />
              <Text style={{ color: C.red, fontWeight: "700" }}>Delete Member</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MOBILE LAYOUT
// ═══════════════════════════════════════════════════════════════════
function MobileLayout() {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(-300)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    filtered, search, setSearch, filter, setFilter, counts,
    selectedMember, setSelected, detailModal, setDetailModal,
    handleApprove, handleDelete, role,
  } = useMembers();

  const TABS = ["All","Pending","Approved","Rejected"] as const;

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
      Alert.alert("Logout", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => router.replace("/loginscreen") },
      ]);
      return;
    }
    router.push(`/admin/${route}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />

      {/* TOP BAR */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={openDrawer}>
          <Feather name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Alumni Admin</Text>
        <Ionicons name="notifications-outline" size={24} color="#000" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <LinearGradient
          colors={["#6366f1", "#8b5cf6"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.mHero}
        >
          <Text style={s.mHeroCrumb}>Dashboard › Members</Text>
          <Text style={s.mHeroHeading}>All Alumni</Text>
        </LinearGradient>

        {/* STAT CARDS */}
        <View style={s.mStatsWrap}>
          <View style={s.mStatsRow}>
            {[
              { label: "Total",    value: counts.All,      color: PRIMARY },
              { label: "Approved", value: counts.Approved, color: C.green },
              { label: "Pending",  value: counts.Pending,  color: C.amber },
            ].map((st) => (
              <View key={st.label} style={s.mStatBox}>
                <Text style={[s.mStatValue, { color: st.color }]}>{st.value}</Text>
                <Text style={s.mStatLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SEARCH */}
        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
          <View style={s.mSearchBox}>
            <Feather name="search" size={16} color={C.faint} />
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Search members…" placeholderTextColor={C.faint}
              style={s.mSearchInput}
            />
          </View>

          {/* FILTER TABS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {TABS.map(t => (
                <Pressable
                  key={t}
                  onPress={() => setFilter(t)}
                  style={[s.mChip, filter === t && s.mChipActive]}
                >
                  <Text style={[s.mChipText, filter === t && s.mChipTextActive]}>
                    {t} · {counts[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* LIST */}
        <View style={{ paddingHorizontal: 14, paddingTop: 12, gap: 8 }}>
          {filtered.map(m => {
            const st = STATUS[m.approved as 0|1|2];
            const [c1, c2] = gradForName(m.full_name);
            return (
              <Pressable
                key={m.id}
                style={s.mMemberCard}
                onPress={() => { setSelected(m); setDetailModal(true); }}
              >
                <Image
              source={{ uri: m.profile_photo ? `${API}/uploads/${m.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
              style={s.mAvatar}
            />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.mMemberName}>{m.full_name}</Text>
                  <Text style={s.mMemberMeta}>{m.programme} · Batch {m.batch_year}</Text>
                  <Text style={s.mMemberEmail} numberOfLines={1}>{m.email}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[s.statusText, { color: st.color }]}>{st.label.toUpperCase()}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#d1d5db" style={{ marginTop: 6 }} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <DetailModal
        member={selectedMember} visible={detailModal}
        onClose={() => setDetailModal(false)}
        onApprove={handleApprove} onDelete={handleDelete}
        role={role}
      />
      <Sidebar drawerOpen={drawerOpen} translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu} />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WEB LAYOUT
// ═══════════════════════════════════════════════════════════════════
function WebLayout() {
  const router = useRouter();
  const translateX = useRef(new Animated.Value(-300)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rowSelected, setRowSelected] = useState(new Set<number>());

  const {
    filtered, search, setSearch, filter, setFilter, counts,
    selectedMember, setSelected, detailModal, setDetailModal,
    handleApprove, handleDelete, role,
  } = useMembers();

  const TABS = ["All","Pending","Approved","Rejected"] as const;

  const toggleAll = () => {
    setRowSelected(rowSelected.size === filtered.length
      ? new Set()
      : new Set(filtered.map(m => m.id)));
  };
  const toggleOne = (id: number) => {
    const next = new Set(rowSelected);
    next.has(id) ? next.delete(id) : next.add(id);
    setRowSelected(next);
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
      if (window.confirm("Logout?")) router.replace("/loginscreen");
      return;
    }
    router.push(`/admin/${route}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgWeb }}>
      <View style={{ flex: 1, flexDirection: "row" }}>

        {/* SIDEBAR */}
        <View style={{ width: 260 }}>
        <SidebarWeb handleMenu={handleMenu} />
  </View>
        {/* MAIN */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.wMain} showsVerticalScrollIndicator={false}>

          {/* TOP ROW */}
          <View style={s.wTopRow}>
            <View>
              <Text style={s.wCrumb}>Dashboard › Members</Text>
              <Text style={s.wPageTitle}>Members</Text>
            </View>
            
          </View>

          {/* KPI CARDS */}
          <View style={s.wKpiRow}>
            {[
              { icon: "users",        iconColor: C.primaryDeep, iconBg: C.primarySoft, value: counts.All,      label: "Total Members", trend: "+8%"  },
              { icon: "check-circle", iconColor: C.greenDeep,   iconBg: C.greenSoft,   value: counts.Approved, label: "Approved",       trend: "95%" },
              { icon: "clock",        iconColor: C.amberDeep,   iconBg: C.amberSoft,   value: counts.Pending,  label: "Pending",        trend: "—"   },
              { icon: "x-circle",     iconColor: C.red,         iconBg: C.redSoft,     value: counts.Rejected, label: "Rejected",       trend: "—"   },
            ].map((k, i) => (
              <View key={i} style={[s.wCard, { flex: 1 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <View style={[s.wKpiIcon, { backgroundColor: k.iconBg }]}>
                    <Feather name={k.icon as any} size={18} color={k.iconColor} />
                  </View>
                  <View style={{ backgroundColor: C.greenSoft, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: C.greenSoftDeep }}>{k.trend}</Text>
                  </View>
                </View>
                <Text style={s.wKpiValue}>{k.value}</Text>
                <Text style={s.wKpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>

          {/* TABLE CARD */}
          <View style={s.wTableCard}>

            {/* FILTER BAR */}
            <View style={s.wFilterBar}>
              <View style={s.wSearch}>
                <Feather name="search" size={14} color={C.faint} />
                <TextInput
                  value={search} onChangeText={setSearch}
                  placeholder="Search by name, email, or batch…"
                  placeholderTextColor={C.faint}
                  style={s.wSearchInput}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch("")}>
                    <Feather name="x" size={14} color={C.faint} />
                  </Pressable>
                )}
              </View>
             
            </View>

            {/* TAB BAR */}
            <View style={s.wTabBar}>
              {TABS.map(t => (
                <Pressable
                  key={t}
                  onPress={() => setFilter(t)}
                  style={[s.wChip, { backgroundColor: filter === t ? PRIMARY : C.rowAlt }]}
                >
                  <Text style={[s.wChipText, { color: filter === t ? "#fff" : C.muted }]}>
                    {t} · {counts[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* TABLE HEADER */}
            <View style={[s.wTr, { backgroundColor: C.rowAlt }]}>
              <Pressable onPress={toggleAll} style={s.wCheckCell}>
                <Checkbox checked={rowSelected.size === filtered.length && filtered.length > 0} />
              </Pressable>
              <Text style={[s.wTh, { flex: 3 }]}>MEMBER</Text>
              <Text style={[s.wTh, { width: 100 }]}>PROGRAM</Text>
              <Text style={[s.wTh, { width: 80 }]}>BATCH</Text>
              <Text style={[s.wTh, { width: 130 }]}>STATUS</Text>
              <Text style={[s.wTh, { width: 100 }]}>ACTIONS</Text>
            </View>

            {/* ROWS */}
            {filtered.map(m => {
              const st = STATUS[m.approved as 0|1|2];
              const [c1, c2] = gradForName(m.full_name);
              return (
                <View key={m.id} style={[s.wTr, { borderTopWidth: 1, borderTopColor: C.borderSoft }]}>
                  <Pressable onPress={() => toggleOne(m.id)} style={s.wCheckCell}>
                    <Checkbox checked={rowSelected.has(m.id)} />
                  </Pressable>

                  {/* NAME + EMAIL */}
                  <View style={[s.wTd, { flex: 3 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Image
              source={{ uri: m.profile_photo ? `${API}/uploads/${m.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
              style={s.wAvatar}
            />
                      <View style={{ flex: 1 }}>
                        <Text style={s.wCellName}>{m.full_name}</Text>
                        <Text style={s.wCellEmail} numberOfLines={1}>{m.email}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[s.wTd, { width: 100 }]}>
                    <Text style={s.wCellMuted}>{m.programme}</Text>
                  </View>
                  <View style={[s.wTd, { width: 80 }]}>
                    <Text style={s.wCellMuted}>{m.batch_year}</Text>
                  </View>

                  {/* STATUS */}
                  <View style={[s.wTd, { width: 130 }]}>
                    <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[s.statusText, { color: st.color }]}>{st.label.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* ACTIONS */}
                  <View style={[s.wTd, { width: 100 }]}>
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <Pressable onPress={() => { setSelected(m); setDetailModal(true); }}>
                        <Feather name="eye" size={16} color={C.muted} />
                      </Pressable>
                      {m.approved === 0 && (
                        <Pressable onPress={() => handleApprove(m.id, 1)}>
                          <Feather name="check" size={16} color={C.green} />
                        </Pressable>
                      )}
                      <Pressable onPress={() => handleDelete(m.id)}>
                        <Feather name="trash-2" size={16} color={C.red} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* EMPTY */}
            {filtered.length === 0 && (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Feather name="users" size={40} color={C.faint} />
                <Text style={{ color: C.muted, marginTop: 10, fontWeight: "600" }}>No members found</Text>
              </View>
            )}

            {/* PAGINATION */}
            <View style={s.wPagerRow}>
              <Text style={{ fontSize: 12, color: C.muted }}>
                Showing {filtered.length} of {filtered.length} members
              </Text>
              <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
                <Pressable style={s.wPagerBtn}>
                  <Feather name="chevron-left" size={14} color={C.muted} />
                </Pressable>
                <View style={[s.wPagerNum, { backgroundColor: PRIMARY }]}>
                  <Text style={[s.wPagerNumText, { color: "#fff", fontWeight: "700" }]}>1</Text>
                </View>
                <Pressable style={s.wPagerBtn}>
                  <Feather name="chevron-right" size={14} color={C.muted} />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      <Sidebar drawerOpen={drawerOpen} translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu} />
      <DetailModal
        member={selectedMember} visible={detailModal}
        onClose={() => setDetailModal(false)}
        onApprove={handleApprove} onDelete={handleDelete}
        role={role}
      />
    </SafeAreaView>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[s.checkbox, checked && { backgroundColor: PRIMARY, borderColor: PRIMARY }]}>
      {checked && <Feather name="check" size={12} color="#fff" />}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  // TOP BAR (mobile)
  topBar: { height: 65, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, elevation: 3 },
  topTitle: { fontSize: 18, fontWeight: "700" },

  // MOBILE HERO
  mHero: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 48 },
  mHeroCrumb: { color: "rgba(255,255,255,0.75)", fontSize: 11, marginBottom: 4 },
  mHeroHeading: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },

  // MOBILE STATS
  mStatsWrap: { paddingHorizontal: 14, marginTop: -32 },
  mStatsRow: { flexDirection: "row", gap: 8 },
  mStatBox: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  mStatValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  mStatLabel: { fontSize: 10, color: C.muted, marginTop: 2, fontWeight: "600" },

  // MOBILE SEARCH
  mSearchBox: {
    backgroundColor: "#fff", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: C.border,
  },
  mSearchInput: { flex: 1, fontSize: 13, color: C.text, paddingVertical: 10 },

  // MOBILE CHIPS
  mChip: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  mChipActive: { backgroundColor: PRIMARY },
  mChipText: { fontSize: 11, color: C.muted, fontWeight: "600" },
  mChipTextActive: { color: "#fff" },

  // MOBILE MEMBER CARD
  mMemberCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  mAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  mAvatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  mMemberName: { fontSize: 14, fontWeight: "700", color: C.text },
  mMemberMeta: { fontSize: 11, color: C.muted, marginTop: 2 },
  mMemberEmail: { fontSize: 10, color: C.faint, marginTop: 2 },

  // WEB LAYOUT
  wMain: { padding: 24, gap: 14 },
  wTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  wCrumb: { fontSize: 11, color: C.muted },
  wPageTitle: { fontSize: 24, fontWeight: "800", color: C.text, marginTop: 2, letterSpacing: -0.5 },

  wBtnSecondary: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6,
  },
  wBtnSecondaryText: { fontSize: 12, fontWeight: "600", color: C.muted },
  wBtnPrimary: {
    backgroundColor: PRIMARY, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6,
  },
  wBtnPrimaryText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  wCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  wKpiRow: { flexDirection: "row", gap: 10 },
  wKpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  wKpiValue: { fontSize: 26, fontWeight: "800", color: C.text, letterSpacing: -0.5 },
  wKpiLabel: { fontSize: 11, color: C.muted, marginTop: 4, fontWeight: "600" },

  wTableCard: {
    backgroundColor: "#fff", borderRadius: 14, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  wFilterBar: {
    padding: 14, flexDirection: "row", gap: 10, alignItems: "center",
    borderBottomWidth: 1, borderBottomColor: C.borderSoft,
  },
  wSearch: {
    flex: 1, backgroundColor: C.rowAlt, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  wSearchInput: { flex: 1, fontSize: 13, color: C.text, outlineStyle: "none" } as any,
  wTabBar: {
    paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", gap: 6,
    borderBottomWidth: 1, borderBottomColor: C.borderSoft,
  },
  wChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  wChipText: { fontSize: 12, fontWeight: "600" },

  wTr: { flexDirection: "row", alignItems: "center" },
  wTh: { fontSize: 11, color: C.muted, fontWeight: "700", letterSpacing: 0.5, paddingHorizontal: 14, paddingVertical: 10 },
  wTd: { paddingHorizontal: 14, paddingVertical: 12, justifyContent: "center" },
  wCheckCell: { width: 36, paddingLeft: 14, paddingVertical: 12, justifyContent: "center" },
  wCellName: { fontSize: 13, fontWeight: "600", color: C.text },
  wCellEmail: { fontSize: 11, color: C.muted, marginTop: 1 },
  wCellMuted: { fontSize: 12, color: C.muted },
  wAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  wAvatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  wPagerRow: {
    padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: C.borderSoft,
  },
  wPagerBtn: { width: 28, height: 28, backgroundColor: C.rowAlt, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  wPagerNum: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  wPagerNumText: { fontSize: 12, color: C.muted, fontWeight: "600" },

  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: C.border, alignItems: "center", justifyContent: "center" },

  // DETAIL MODAL
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backText: { fontSize: 15, fontWeight: "600", marginLeft: 6 },
  profileCard: { backgroundColor: "#fff", borderRadius: 22, padding: 24, alignItems: "center", marginBottom: 16, elevation: 3 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  profileAvatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
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

  // SHARED
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  statusText: { fontSize: 10, fontWeight: "700" },
});

