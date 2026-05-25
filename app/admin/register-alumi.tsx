import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ======================
// TYPES
// ======================

type Status = "PENDING" | "APPROVED" | "REJECTED";

interface Registration {
  id: string;
  name: string;
  email: string;
  phone: string;
  batch: string;
  programme: string;
  city: string;
  organisation: string;
  appliedOn: string;
  status: Status;
}

// ======================
// MOCK DATA
// ======================

const MOCK: Registration[] = [
  {
    id: "1",
    name: "Aarav Mehta",
    email: "aarav@example.com",
    phone: "+91 98001 11111",
    batch: "2019",
    programme: "MBA",
    city: "Mumbai",
    organisation: "Deloitte",
    appliedOn: "2025-07-01",
    status: "PENDING",
  },
  {
    id: "2",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 98002 22222",
    batch: "2020",
    programme: "BBA",
    city: "Delhi",
    organisation: "Accenture",
    appliedOn: "2025-07-02",
    status: "PENDING",
  },
  {
    id: "3",
    name: "Rohit Verma",
    email: "rohit@example.com",
    phone: "+91 98003 33333",
    batch: "2018",
    programme: "MBA",
    city: "Bengaluru",
    organisation: "Infosys",
    appliedOn: "2025-06-28",
    status: "APPROVED",
  },
  {
    id: "4",
    name: "Sneha Joshi",
    email: "sneha@example.com",
    phone: "+91 98004 44444",
    batch: "2021",
    programme: "BBA",
    city: "Pune",
    organisation: "HDFC Bank",
    appliedOn: "2025-06-25",
    status: "REJECTED",
  },
  {
    id: "5",
    name: "Karan Patel",
    email: "karan@example.com",
    phone: "+91 98005 55555",
    batch: "2022",
    programme: "MBA",
    city: "Ahmedabad",
    organisation: "TCS",
    appliedOn: "2025-07-03",
    status: "PENDING",
  },
];

// ======================
// STATUS CONFIG
// ======================

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; icon: string }
> = {
  PENDING: {
    label: "Pending",
    color: "#854F0B",
    bg: "#FAEEDA",
    icon: "time-outline",
  },
  APPROVED: {
    label: "Approved",
    color: "#0F6E56",
    bg: "#E1F5EE",
    icon: "checkmark-circle-outline",
  },
  REJECTED: {
    label: "Rejected",
    color: "#A32D2D",
    bg: "#FCEBEB",
    icon: "close-circle-outline",
  },
};

type FilterTab = "ALL" | Status;

// ======================
// MAIN SCREEN
// ======================

export default function AdminRegistrations() {
  const [data, setData] = useState<Registration[]>(MOCK);
  const [filter, setFilter] = useState<FilterTab>("PENDING");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Registration | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const filtered = data.filter((r) => {
    const matchFilter = filter === "ALL" || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.batch.includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    ALL: data.length,
    PENDING: data.filter((r) => r.status === "PENDING").length,
    APPROVED: data.filter((r) => r.status === "APPROVED").length,
    REJECTED: data.filter((r) => r.status === "REJECTED").length,
  };

  // ---------- Actions ----------

  const approve = (id: string) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r))
    );
    setSelected(null);
    Alert.alert("Approved", "Registration has been approved.");
  };

  const openReject = (reg: Registration) => {
    setSelected(reg);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!selected) return;
    setData((prev) =>
      prev.map((r) =>
        r.id === selected.id ? { ...r, status: "REJECTED" } : r
      )
    );
    setShowRejectModal(false);
    setSelected(null);
    Alert.alert("Rejected", "Registration has been rejected.");
  };

  // ---------- Render card ----------

  const renderCard = ({ item }: { item: Registration }) => {
    const cfg = STATUS_CONFIG[item.status];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelected(item)}
        activeOpacity={0.85}
      >
        {/* Avatar + name */}
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardSub}>
              {item.programme} · Batch {item.batch} · {item.city}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Meta */}
        <Text style={styles.cardMeta}>
          {item.organisation} · Applied {item.appliedOn}
        </Text>

        {/* Actions only for pending */}
        {item.status === "PENDING" && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => approve(item.id)}
            >
              <Ionicons
                name="checkmark-outline"
                size={15}
                color="#0F6E56"
              />
              <Text style={styles.approveTxt}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => openReject(item)}
            >
              <Ionicons
                name="close-outline"
                size={15}
                color="#A32D2D"
              />
              <Text style={styles.rejectTxt}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ======================
  // FILTER TABS
  // ======================

  const tabs: FilterTab[] = ["PENDING", "APPROVED", "REJECTED", "ALL"];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registrations</Text>
        <View style={[styles.badge, { backgroundColor: "#EEEDFE" }]}>
          <Text style={[styles.badgeText, { color: "#534AB7" }]}>
            {counts.PENDING} pending
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, email, batch…"
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {tabs.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, filter === t && styles.tabActive]}
            onPress={() => setFilter(t)}
          >
            <Text
              style={[styles.tabText, filter === t && styles.tabTextActive]}
            >
              {t === "ALL" ? "All" : STATUS_CONFIG[t].label} ({counts[t]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No registrations found.</Text>
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selected && !showRejectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />

              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selected.name}</Text>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={22} color="#444" />
                </TouchableOpacity>
              </View>

              {/* Fields */}
              {[
                ["Email", selected.email],
                ["Phone", selected.phone],
                ["Programme", selected.programme],
                ["Batch", selected.batch],
                ["City", selected.city],
                ["Organisation", selected.organisation],
                ["Applied on", selected.appliedOn],
                ["Status", STATUS_CONFIG[selected.status].label],
              ].map(([k, v]) => (
                <View key={k} style={styles.fieldRow}>
                  <Text style={styles.fieldKey}>{k}</Text>
                  <Text style={styles.fieldVal}>{v}</Text>
                </View>
              ))}

              {/* Actions */}
              {selected.status === "PENDING" && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalApprove}
                    onPress={() => approve(selected.id)}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.modalApproveTxt}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalReject}
                    onPress={() => openReject(selected)}
                  >
                    <Ionicons name="close" size={18} color="#A32D2D" />
                    <Text style={styles.modalRejectTxt}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>

      {/* Reject reason modal */}
      <Modal
        visible={showRejectModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 30 }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { marginBottom: 8 }]}>
              Reject registration
            </Text>
            <Text style={styles.fieldKey}>
              Reason (optional — sent to applicant)
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Could not verify batch year…"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalReject}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalRejectTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApprove}
                onPress={confirmReject}
              >
                <Text style={styles.modalApproveTxt}>Confirm reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ======================
// STYLES
// ======================

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7FF" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#222" },

  tabScroll: { marginTop: 10, marginBottom: 4 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F1F5",
  },
  tabActive: { backgroundColor: "#3526D9" },
  tabText: { fontSize: 13, color: "#666", fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEEDFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#534AB7" },
  cardName: { fontSize: 15, fontWeight: "700", color: "#111" },
  cardSub: { fontSize: 12, color: "#666", marginTop: 1 },
  cardMeta: { fontSize: 12, color: "#999", marginBottom: 8 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#E1F5EE",
    borderRadius: 10,
    paddingVertical: 8,
  },
  approveTxt: { fontSize: 13, fontWeight: "700", color: "#0F6E56" },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FCEBEB",
    borderRadius: 10,
    paddingVertical: 8,
  },
  rejectTxt: { fontSize: 13, fontWeight: "700", color: "#A32D2D" },

  empty: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 40,
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  fieldKey: { fontSize: 13, color: "#888" },
  fieldVal: { fontSize: 13, fontWeight: "600", color: "#111", maxWidth: "55%", textAlign: "right" },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalApprove: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#3526D9",
    borderRadius: 14,
    paddingVertical: 13,
  },
  modalApproveTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalReject: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FCEBEB",
    borderRadius: 14,
    paddingVertical: 13,
  },
  modalRejectTxt: { color: "#A32D2D", fontWeight: "700", fontSize: 14 },

  reasonInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#222",
    marginTop: 8,
    marginBottom: 4,
    minHeight: 80,
    textAlignVertical: "top",
  },
});