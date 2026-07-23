// ======================================================
// Adbanner.tsx  (ADMIN)
// Admin dashboard for reviewing and pricing Banner Ad requests
// ======================================================

import { Feather, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Sidebar from "./components/sidebar";
import SidebarWeb from "./components/SidebarWeb";

// Dynamically use the central backend endpoint from environment variables
const API = process.env.EXPO_PUBLIC_API_BASE || "http://127.0.0.1:2000";
const isWeb = Platform.OS === "web";

const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

type BannerReq = {
  id: number;
  full_name: string;
  email: string;
  mobile: string;
  organisation_name: string | null;
  banner_title: string;
  banner_description: string;
  website_link: string | null;
  preferred_duration: string;
  preferred_start_date: string | null;
  additional_notes: string | null;
  banner_image: string | null;
  status: "Pending" | "Payment Requested" | "Approved" | "Rejected";
  amount_requested: number | null;
  payment_note: string | null;
  payment_status: "Not Required" | "Pending" | "Paid";
  admin_remarks: string | null;
  created_at: string;
};

const FILTERS = ["All", "Pending", "Payment Requested", "Approved", "Rejected"] as const;

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  "Pending":           { bg: "#FEF3C7", fg: "#B45309" },
  "Payment Requested": { bg: "#DBEAFE", fg: "#1D4ED8" },
  "Approved":          { bg: "#DCFCE7", fg: "#15803D" },
  "Rejected":          { bg: "#FEE2E2", fg: "#B91C1C" },
};

export default function AdminBannerRequests() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWebLayout = width >= 1024; 

  // ── Drawer (mobile only) ──────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-300)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };
  const closeDrawer = () => {
    Animated.timing(translateX, { toValue: -300, duration: 200, useNativeDriver: true }).start(
      () => setDrawerOpen(false)
    );
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

  // ── Data ─────────────────────────────────────────────────────
  const [items, setItems] = useState<BannerReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Pending");

  // Payment modal
  const [payModalFor, setPayModalFor] = useState<BannerReq | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [savingPay, setSavingPay] = useState(false);

  // Reject modal
  const [rejectModalFor, setRejectModalFor] = useState<BannerReq | null>(null);
  const [remarks, setRemarks] = useState("");
  const [savingReject, setSavingReject] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/admin/banner-requests`);
      if (res.data.success) setItems(res.data.data);
    } catch (e) {
      console.log("Error fetching banner requests:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const visible = items.filter(i => filter === "All" || i.status === filter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "All" ? items.length : items.filter(i => i.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  // ── Actions ──────────────────────────────────────────────────
  const openPayModal = (item: BannerReq) => {
    setAmount(""); setNote("");
    setPayModalFor(item);
  };

  const submitPaymentRequest = async () => {
    if (!payModalFor) return;
    if (!amount || Number(amount) <= 0)
      return showAlert("Amount required", "Please enter a valid amount to charge.");
    try {
      setSavingPay(true);
      await axios.put(`${API}/admin/banner-request/request-payment/${payModalFor.id}`, {
        amount: Number(amount),
        payment_note: note,
      });
      setPayModalFor(null);
      fetchData();
      showAlert("Sent ✅", "Payment request generated and routed to alumni dashboard.");
    } catch {
      showAlert("Error", "Failed to send payment request.");
    } finally {
      setSavingPay(false);
    }
  };

  const approve = async (item: BannerReq) => {
    try {
      setBusyId(item.id);
      await axios.put(`${API}/admin/banner-request/approve/${item.id}`);
      fetchData();
      showAlert("Approved ✅", "Banner deployment complete. Advertisement is now live.");
    } catch {
      showAlert("Error", "Failed to approve.");
    } finally {
      setBusyId(null);
    }
  };

  const openRejectModal = (item: BannerReq) => {
    setRemarks("");
    setRejectModalFor(item);
  };

  const submitReject = async () => {
    if (!rejectModalFor) return;
    try {
      setSavingReject(true);
      await axios.put(`${API}/admin/banner-request/reject/${rejectModalFor.id}`, {
        admin_remarks: remarks,
      });
      setRejectModalFor(null);
      fetchData();
      showAlert("Rejected", "Request application has been declined.");
    } catch {
      showAlert("Error", "Failed to reject.");
    } finally {
      setSavingReject(false);
    }
  };

  const deleteReq = (item: BannerReq) => {
    const doDelete = async () => {
      try {
        setBusyId(item.id);
        await axios.delete(`${API}/admin/banner-request/${item.id}`);
        fetchData();
      } catch {
        showAlert("Error", "Failed to delete.");
      } finally {
        setBusyId(null);
      }
    };
    if (isWeb) {
      if (window.confirm("Delete this request permanently?")) doDelete();
    } else {
      Alert.alert("Delete Request", "Delete this request permanently?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  // ── Main content ─────────────────────────────────────────────
  const MainContent = (
    <View style={styles.mainWrapper}>
      <View style={styles.headerTitleBox}>
        <Text style={styles.pageTitle}>Banner Ad Requests</Text>
        <Text style={styles.breadcrumb}>Dashboard {">"} Banner Requests</Text>
      </View>

      <View style={styles.filterOuterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={{ paddingHorizontal: isWebLayout ? 24 : 16, gap: 8 }}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipOn]}
            >
              <Text style={[styles.filterChipTxt, filter === f && styles.filterChipTxtOn]}>
                {f} ({counts[f]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingHorizontal: isWebLayout ? 24 : 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loaderTxt}>Loading requests database...</Text>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="megaphone-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTxt}>No requests found under "{filter}" status</Text>
          </View>
        ) : (
          <View style={isWebLayout ? styles.webGrid : styles.mobileGrid}>
            {visible.map(item => {
              const st = STATUS_STYLE[item.status];
              const isItemBusy = busyId === item.id;
              
              return (
                <View key={item.id} style={[styles.card, isWebLayout && styles.webCard]}>
                  <View style={styles.cardTop}>
                    {item.banner_image ? (
                      <Image source={{ uri: item.banner_image.startsWith('http') ? item.banner_image : API + item.banner_image }} style={styles.thumb} />
                    ) : (
                      <View style={[styles.thumb, styles.thumbEmpty]}>
                        <Ionicons name="image-outline" size={24} color="#94A3B8" />
                      </View>
                    )}
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.banner_title}</Text>
                      <Text style={styles.subLine} numberOfLines={1}>
                        {item.full_name}{item.organisation_name ? ` · ${item.organisation_name}` : ""}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusPillTxt, { color: st.fg }]}>{item.status}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.desc} numberOfLines={3}>{item.banner_description}</Text>

                  <View style={styles.metaGrid}>
                    <MetaRow icon="mail-outline"            text={item.email} />
                    <MetaRow icon="call-outline"            text={item.mobile} />
                    {!!item.website_link   && <MetaRow icon="link-outline"             text={item.website_link} />}
                    <MetaRow icon="time-outline"            text={`Duration: ${item.preferred_duration}`} />
                    {!!item.preferred_start_date && <MetaRow icon="calendar-outline"   text={`Launch Date: ${item.preferred_start_date}`} />}
                    {!!item.additional_notes     && <MetaRow icon="chatbox-ellipses-outline" text={item.additional_notes} />}
                  </View>

                  {item.status === "Payment Requested" && (
                    <View style={styles.payBox}>
                      <Ionicons name="cash-outline" size={16} color="#1D4ED8" />
                      <Text style={styles.payBoxTxt}>
                        ₹{item.amount_requested} required
                        {item.payment_note ? ` — ${item.payment_note}` : ""}
                        {" · "}Gateway: {item.payment_status}
                      </Text>
                    </View>
                  )}

                  {item.status === "Rejected" && item.admin_remarks && (
                    <View style={[styles.payBox, { backgroundColor: "#FEE2E2" }]}>
                      <Ionicons name="close-circle-outline" size={16} color="#B91C1C" />
                      <Text style={[styles.payBoxTxt, { color: "#B91C1C" }]}>{item.admin_remarks}</Text>
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    {item.status === "Pending" && (
                      <>
                        <ActionBtn label="Request Fee" icon="cash-outline"  color="#4F46E5" onPress={() => openPayModal(item)} disabled={isItemBusy} />
                        <ActionBtn label="Reject"          icon="close-outline" color="#DC2626" onPress={() => openRejectModal(item)} disabled={isItemBusy} />
                      </>
                    )}
                    {item.status === "Payment Requested" && (
                      <>
                        <ActionBtn
                          label={isItemBusy ? "Processing..." : "Force Approve"}
                          icon="checkmark-done-outline"
                          color="#16A34A"
                          disabled={isItemBusy}
                          onPress={() => approve(item)}
                        />
                        <ActionBtn label="Reject" icon="close-outline" color="#DC2626" onPress={() => openRejectModal(item)} disabled={isItemBusy} />
                      </>
                    )}
                    {(item.status === "Approved" || item.status === "Rejected") && (
                      <ActionBtn label={isItemBusy ? "Removing..." : "Delete Record"} icon="trash-outline" color="#64748B" onPress={() => deleteReq(item)} disabled={isItemBusy} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {isWebLayout ? (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <SidebarWeb handleMenu={handleMenu} />
          <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
            {MainContent}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={openDrawer}>
              <Feather name="menu" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.topTitle}>Banner Ad Control</Text>
            <Ionicons name="notifications-outline" size={24} color="#0F172A" />
          </View>

          {MainContent}

          <Sidebar
            drawerOpen={drawerOpen}
            translateX={translateX}
            closeDrawer={closeDrawer}
            handleMenu={handleMenu}
          />
        </>
      )}

      {/* ── Fee Request Modal ── */}
      <Modal visible={!!payModalFor} transparent animationType="fade" onRequestClose={() => setPayModalFor(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Request Promotion Fee</Text>
            <Text style={styles.modalSub}>
              Specify the placement fee for "{payModalFor?.banner_title}". The alumnus will be prompted to make this payment secure from their custom dashboard.
            </Text>
            <Text style={styles.modalLabel}>Amount (INR) *</Text>
            <TextInput
              style={styles.modalInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 2500"
              keyboardType="numeric"
            />
            <Text style={styles.modalLabel}>Instructional Note (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: "top", paddingTop: 10 }]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Standard premium 30-day placement fee."
              multiline
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPayModalFor(null)}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={submitPaymentRequest} disabled={savingPay}>
                {savingPay
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSaveTxt}>Dispatch Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Operational Rejection Modal ── */}
      <Modal visible={!!rejectModalFor} transparent animationType="fade" onRequestClose={() => setRejectModalFor(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Decline Advertisement Request</Text>
            <Text style={styles.modalSub}>Provide an audit reason for declining "{rejectModalFor?.banner_title}". This log will be accessible to the alumnus.</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: "top", paddingTop: 10 }]}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="e.g. Creative asset aspect ratio mismatched."
              multiline
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRejectModalFor(null)}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: "#DC2626" }]}
                onPress={submitReject}
                disabled={savingReject}
              >
                {savingReject
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSaveTxt}>Confirm Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Shared UI Structural Extensions ────────────────────────────────────────────
function MetaRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon as any} size={14} color="#64748B" />
      <Text style={styles.metaTxt} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function ActionBtn({ label, icon, color, onPress, disabled }: any) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: color }, disabled && { opacity: 0.4 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.actionBtnTxt, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  mainWrapper: { flex: 1 },
  headerTitleBox: { padding: 24, paddingBottom: 8 },
  
  // ── Responsive System Configuration ──
  scrollContainer: { paddingBottom: 60, flexGrow: 1 },
  mobileGrid: { flexDirection: "column", gap: 16 },
  webGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 20,
    width: "100%"
  },

  topBar: {
    height: 65,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  topTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },

  pageTitle: { fontSize: 28, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 },
  breadcrumb: { color: "#64748B", marginTop: 4, fontSize: 13, fontWeight: "500" },

  filterOuterWrap: { marginBottom: 12 },
  filterRow: { flexGrow: 0, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0" },
  filterChipOn: { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  filterChipTxt: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterChipTxtOn: { color: "#4F46E5", fontWeight: "700" },

  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 300 },
  loaderTxt: { marginTop: 14, color: "#64748B", fontSize: 14, fontWeight: "500" },
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 },
  emptyTxt: { fontSize: 14, color: "#94A3B8", fontWeight: "600" },

  card: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2 
  },
  webCard: {
    width: "calc(50% - 10px)" as any, // 🚨 TypeScript Web Math Fix Applied Here!
    minWidth: 420
  },
  cardTop: { flexDirection: "row", gap: 16, marginBottom: 14 },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#F1F5F9" },
  thumbEmpty: { justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0", borderStyle: 'dashed' },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  subLine: { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "500" },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  statusPillTxt: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
  desc: { fontSize: 13.5, color: "#475569", lineHeight: 20, marginBottom: 14 },

  metaGrid: { gap: 8, marginBottom: 16, backgroundColor: "#F8FAFC", padding: 12, borderRadius: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaTxt: { fontSize: 12.5, color: "#475569", flex: 1, fontWeight: "500" },

  payBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EFF6FF", padding: 12, borderRadius: 12, marginBottom: 16 },
  payBoxTxt: { fontSize: 12.5, color: "#1D4ED8", flex: 1, fontWeight: "600" },

  actionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 'auto', paddingTop: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: "#fff" },
  actionBtnTxt: { fontSize: 13, fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, padding: 24, maxWidth: 460, width: "100%", alignSelf: "center", shadowRadius: 24, shadowOpacity: 0.15 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 6, letterSpacing: -0.3 },
  modalSub: { fontSize: 13, color: "#64748B", marginBottom: 16, lineHeight: 20, fontWeight: "400" },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 6, marginTop: 8 },
  modalInput: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, color: "#0F172A" },
  modalBtnRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center", backgroundColor: "#fff" },
  modalCancelTxt: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  modalSaveBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "#4F46E5", alignItems: "center" },
  modalSaveTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
});