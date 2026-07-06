// ======================================================
// bannerrequests.tsx  (ADMIN)
// Header: AdminContributions jaisa (SidebarWeb on web,
//         topbar + drawer on mobile)
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

const API = "http://10.254.25.118:2000";
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
  const isWebLayout = width >= 768;

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
      console.log(e);
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
      showAlert("Sent ✅", "Payment request sent to the alumni.");
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
      showAlert("Approved ✅", "Banner is now live on the Home page.");
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
      showAlert("Rejected", "Request has been rejected.");
    } catch {
      showAlert("Error", "Failed to reject.");
    } finally {
      setSavingReject(false);
    }
  };

  const deleteReq = (item: BannerReq) => {
    const doDelete = async () => {
      try {
        await axios.delete(`${API}/admin/banner-request/${item.id}`);
        fetchData();
      } catch {
        showAlert("Error", "Failed to delete.");
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
    <>
      {/* Page title (AdminContributions style) */}
      <View style={{ padding: 18, paddingBottom: 4 }}>
        <Text style={styles.pageTitle}>Banner Ad Requests</Text>
        <Text style={styles.breadcrumb}>Dashboard {">"} Banner Requests</Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
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

      {/* Cards list */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loaderTxt}>Loading requests...</Text>
          </View>
        ) : visible.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="megaphone-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTxt}>No requests in "{filter}"</Text>
          </View>
        ) : (
          visible.map(item => {
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
                  <MetaRow icon="mail-outline"              text={item.email} />
                  <MetaRow icon="call-outline"              text={item.mobile} />
                  {!!item.website_link   && <MetaRow icon="link-outline"             text={item.website_link} />}
                  <MetaRow icon="time-outline"              text={`Duration: ${item.preferred_duration}`} />
                  {!!item.preferred_start_date && <MetaRow icon="calendar-outline"   text={`Start: ${item.preferred_start_date}`} />}
                  {!!item.additional_notes     && <MetaRow icon="chatbox-ellipses-outline" text={item.additional_notes} />}
                </View>

                {item.status === "Payment Requested" && (
                  <View style={styles.payBox}>
                    <Ionicons name="cash-outline" size={16} color="#1D4ED8" />
                    <Text style={styles.payBoxTxt}>
                      ₹{item.amount_requested} requested
                      {item.payment_note ? ` — ${item.payment_note}` : ""}
                      {" · "}Payment: {item.payment_status}
                    </Text>
                  </View>
                )}

                {item.status === "Rejected" && item.admin_remarks && (
                  <View style={[styles.payBox, { backgroundColor: "#FEE2E2" }]}>
                    <Ionicons name="close-circle-outline" size={16} color="#B91C1C" />
                    <Text style={[styles.payBoxTxt, { color: "#B91C1C" }]}>{item.admin_remarks}</Text>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actionsRow}>
                  {item.status === "Pending" && (
                    <>
                      <ActionBtn label="Request Payment" icon="cash-outline"  color="#4F46E5" onPress={() => openPayModal(item)} />
                      <ActionBtn label="Reject"          icon="close-outline" color="#DC2626" onPress={() => openRejectModal(item)} />
                    </>
                  )}
                  {item.status === "Payment Requested" && (
                    <>
                      <ActionBtn
                        label={busyId === item.id ? "Approving..." : "Mark Paid & Approve"}
                        icon="checkmark-done-outline"
                        color="#16A34A"
                        disabled={busyId === item.id}
                        onPress={() => approve(item)}
                      />
                      <ActionBtn label="Reject" icon="close-outline" color="#DC2626" onPress={() => openRejectModal(item)} />
                    </>
                  )}
                  {(item.status === "Approved" || item.status === "Rejected") && (
                    <ActionBtn label="Delete" icon="trash-outline" color="#64748B" onPress={() => deleteReq(item)} />
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* ── WEB: sidebar + content ── */}
      {isWebLayout ? (
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
            <Text style={styles.topTitle}>Banner Requests</Text>
            <Ionicons name="notifications-outline" size={24} color="#000" />
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

      {/* ── Payment request modal ── */}
      <Modal visible={!!payModalFor} transparent animationType="fade" onRequestClose={() => setPayModalFor(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Request Payment</Text>
            <Text style={styles.modalSub}>
              "{payModalFor?.banner_title}" ko approve karne se pehle alumni se yeh amount maanga jayega.
            </Text>
            <Text style={styles.modalLabel}>Amount (₹) *</Text>
            <TextInput
              style={styles.modalInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 2000"
              keyboardType="numeric"
            />
            <Text style={styles.modalLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Payment via UPI to xyz@upi"
              multiline
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPayModalFor(null)}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={submitPaymentRequest} disabled={savingPay}>
                {savingPay
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSaveTxt}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Reject modal ── */}
      <Modal visible={!!rejectModalFor} transparent animationType="fade" onRequestClose={() => setRejectModalFor(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Text style={styles.modalSub}>"{rejectModalFor?.banner_title}" ko reject karne ka reason (optional):</Text>
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Reason for rejection..."
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
                  : <Text style={styles.modalSaveTxt}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── Helper components ────────────────────────────────────────────
function MetaRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon as any} size={13} color="#64748B" />
      <Text style={styles.metaTxt} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function ActionBtn({ label, icon, color, onPress, disabled }: any) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: color }, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.actionBtnTxt, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6FA" },

  // ── Mobile topbar (AdminContributions style) ──────────────────
  topBar: {
    height: 65,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    elevation: 3,
  },
  topTitle: { fontSize: 18, fontWeight: "700" },

  // ── Page heading ──────────────────────────────────────────────
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#0F172A" },
  breadcrumb: { color: "#64748B", marginTop: 4, fontSize: 13 },

  // ── Filter chips ──────────────────────────────────────────────
  filterRow: { flexGrow: 0, marginTop: 10, marginBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E2E8F0" },
  filterChipOn: { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  filterChipTxt: { fontSize: 12.5, fontWeight: "600", color: "#64748B" },
  filterChipTxtOn: { color: "#4F46E5" },

  // ── Loader / empty ────────────────────────────────────────────
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  loaderTxt: { marginTop: 12, color: "#64748B", fontSize: 14 },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTxt: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },

  // ── Card ──────────────────────────────────────────────────────
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#E2E8F0", elevation: 2 },
  cardTop: { flexDirection: "row", gap: 12, marginBottom: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  thumbEmpty: { backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  subLine: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginTop: 6 },
  statusPillTxt: { fontSize: 10.5, fontWeight: "700" },
  desc: { fontSize: 12.5, color: "#475569", lineHeight: 18, marginBottom: 10 },

  // ── Meta rows ─────────────────────────────────────────────────
  metaGrid: { gap: 6, marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaTxt: { fontSize: 12, color: "#64748B", flex: 1 },

  // ── Pay / reject info box ─────────────────────────────────────
  payBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#DBEAFE", padding: 10, borderRadius: 10, marginBottom: 10 },
  payBoxTxt: { fontSize: 12, color: "#1D4ED8", flex: 1, fontWeight: "600" },

  // ── Action buttons ────────────────────────────────────────────
  actionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  actionBtnTxt: { fontSize: 12.5, fontWeight: "700" },

  // ── Modals ────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: "#fff", borderRadius: 18, padding: 20, maxWidth: 440, width: "100%", alignSelf: "center" },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 6 },
  modalSub: { fontSize: 12.5, color: "#64748B", marginBottom: 14, lineHeight: 18 },
  modalLabel: { fontSize: 12.5, fontWeight: "700", color: "#475569", marginBottom: 6, marginTop: 4 },
  modalInput: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 12, height: 46, fontSize: 14, color: "#111" },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center" },
  modalCancelTxt: { fontSize: 13.5, fontWeight: "700", color: "#64748B" },
  modalSaveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#4F46E5", alignItems: "center" },
  modalSaveTxt: { fontSize: 13.5, fontWeight: "700", color: "#fff" },
});