import { Feather, Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { memo, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarWeb from "./components/SidebarWeb";
import Sidebar from "./components/sidebar";

const API        = process.env.EXPO_PUBLIC_API_BASE;
const PRIMARY    = "#5B5FEF";
const BREAKPOINT = 768;

const TARGETS = ["All", "Approved Only", "Batch Only"];

// Batch years — current year down to 1990
const BATCH_YEARS = Array.from(
  { length: new Date().getFullYear() - 1989 },
  (_, i) => String(new Date().getFullYear() - i)
);

// ─────────────────────────────────────────────────────────────
// BATCH SELECTOR — web uses <select>, mobile uses pill buttons
// ─────────────────────────────────────────────────────────────
function BatchSelector({
  batchYear,
  setBatchYear,
  isWeb,
}: {
  batchYear: string;
  setBatchYear: (v: string) => void;
  isWeb: boolean;
}) {
  if (isWeb) {
    return (
      <View style={s.batchWebWrap}>
        <Ionicons name="school-outline" size={16} color="#64748b" style={{ marginRight: 6 }} />
        <select
          value={batchYear}
          onChange={(e) => setBatchYear((e.target as HTMLSelectElement).value)}
          style={{
            flex: 1,
            height: 44,
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            background: "#F8FAFC",
            fontSize: 14,
            color: batchYear ? "#111" : "#94A3B8",
            paddingLeft: 10,
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="">Select batch year</option>
          {BATCH_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </View>
    );
  }

  // Mobile — horizontal scroll pill list
// Mobile — Dropdown
return (
  <View style={s.batchMobileWrap}>
    <Ionicons
      name="school-outline"
      size={18}
      color="#64748B"
      style={{ marginLeft: 12 }}
    />

    <Picker
      selectedValue={batchYear}
      onValueChange={(itemValue) => setBatchYear(itemValue)}
      style={s.batchPicker}
      dropdownIconColor="#64748B"
    >
      <Picker.Item label="Select Batch Year" value="" />

      {BATCH_YEARS.map((year) => (
        <Picker.Item
          key={year}
          label={year}
          value={year}
        />
      ))}
    </Picker>
  </View>
);
}

// ─────────────────────────────────────────────────────────────
// PAGE CONTENT
// ─────────────────────────────────────────────────────────────
const PageContent = memo(
  ({
    isWeb,
    target,
    setTarget,
    batchYear,
    setBatchYear,
    title,
    setTitle,
    message,
    setMessage,
    sending,
    sendBulk,
    history,
  }: any) => {
    return (
      <ScrollView
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.pageContent, isWeb && s.pageContentWeb]}
      >
        <Text style={s.pageTitle}>Notifications</Text>
        <Text style={s.breadcrumb}>Dashboard › Notifications</Text>

        {/* SEND CARD */}
        <View style={[s.sendCard, isWeb && s.sendCardWeb]}>
          <Text style={s.cardTitle}>Send Announcement</Text>

          {/* TARGET CHIPS */}
          <Text style={s.fieldLabel}>Target Audience</Text>
          <View style={s.chipRow}>
            {TARGETS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.chip, target === t && s.chipActive]}
                onPress={() => setTarget(t)}
              >
                <Text style={[s.chipText, target === t && s.chipActiveText]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* BATCH SELECTOR — only shown when "Batch Only" selected */}
          {target === "Batch Only" && (
            <View style={s.batchSection}>
              <View style={s.batchHeaderRow}>
                <View style={[s.batchIconBox, { backgroundColor: "#EEF2FF" }]}>
                  <Ionicons name="school-outline" size={16} color={PRIMARY} />
                </View>
                <View>
                  <Text style={s.fieldLabel}>Select Batch Year *</Text>
                  <Text style={s.batchHint}>
                    Notification will be sent only to alumni of selected batch
                  </Text>
                </View>
              </View>

              <BatchSelector
                batchYear={batchYear}
                setBatchYear={setBatchYear}
                isWeb={isWeb}
              />

              {/* Selected batch badge */}
              {batchYear ? (
                <View style={s.selectedBatchBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={PRIMARY} />
                  <Text style={s.selectedBatchText}>
                    Batch <Text style={{ fontWeight: "800" }}>{batchYear}</Text> selected
                  </Text>
                  <TouchableOpacity onPress={() => setBatchYear("")} style={s.clearBatch}>
                    <Ionicons name="close" size={13} color="#64748b" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.noBatchWarning}>
                  <Ionicons name="warning-outline" size={14} color="#D97706" />
                  <Text style={s.noBatchText}>Please select a batch year to continue</Text>
                </View>
              )}
            </View>
          )}

          {/* FORM */}
          <View style={isWeb ? s.webFormRow : {}}>
            <View style={isWeb ? { flex: 1 } : {}}>
              <Text style={s.fieldLabel}>Title *</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Annual Reunion 2025"
                value={title}
                onChangeText={setTitle}
                blurOnSubmit={false}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <View style={isWeb ? { flex: 2 } : {}}>
              <Text style={s.fieldLabel}>Message *</Text>
              <TextInput
                style={[s.input, s.messageInput]}
                placeholder="Write your announcement here..."
                multiline
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
                blurOnSubmit={false}
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[s.sendBtn, sending && { opacity: 0.6 }, isWeb && s.sendBtnWeb]}
            onPress={sendBulk}
            disabled={sending}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={s.sendBtnText}>
              {sending ? "Sending..." : "Send to All"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* HISTORY */}
        <Text style={s.sectionTitle}>Sent History</Text>
        <View style={isWeb ? s.histGrid : {}}>
          {history.map((item: any, i: number) => (
            <View key={i} style={[s.histCard, isWeb && s.histCardWeb]}>
              <View style={s.histTop}>
                <Text style={s.histTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.histTime}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={s.histMsg} numberOfLines={2}>{item.message}</Text>
              <View style={s.histFooter}>
                <View style={s.histTargetBadge}>
                  <Ionicons name="people-outline" size={11} color="#6366f1" />
                  <Text style={s.histTargetText}>{item.target}</Text>
                </View>
                {item.batch_year && (
                  <View style={[s.histTargetBadge, { backgroundColor: "#DCFCE7", marginLeft: 6 }]}>
                    <Ionicons name="school-outline" size={11} color="#16A34A" />
                    <Text style={[s.histTargetText, { color: "#16A34A" }]}>
                      Batch {item.batch_year}
                    </Text>
                  </View>
                )}
                <Text style={s.histCount}>{item.sent_count} recipients</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }
);

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export default function AdminNotifications() {
  const router     = useRouter();
  const { width }  = useWindowDimensions();
  const isWeb      = width >= BREAKPOINT;

  const [title,      setTitle]      = useState("");
  const [message,    setMessage]    = useState("");
  const [target,     setTarget]     = useState("All");
  const [batchYear,  setBatchYear]  = useState("");
  const [sending,    setSending]    = useState(false);
  const [history,    setHistory]    = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => { fetchHistory(); }, []);

  // Reset batch year when switching away from "Batch Only"
  useEffect(() => {
    if (target !== "Batch Only") setBatchYear("");
  }, [target]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/admin/notifications/history`);
      if (res.data.success) setHistory(res.data.data);
    } catch (err) { console.log(err); }
  };

  const sendBulk = async () => {
    if (!title || !message) {
      const msg = "Please fill title and message";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Validation", msg);
      return;
    }
    if (target === "Batch Only" && !batchYear) {
      const msg = "Please select a batch year";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Validation", msg);
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API}/admin/notifications/bulk`, {
        title,
        message,
        target,
        batch_year: target === "Batch Only" ? batchYear : null,
      });

      const successMsg = target === "Batch Only"
        ? `Notification sent to Batch ${batchYear}!`
        : "Notification sent to all!";

      Platform.OS === "web"
        ? window.alert(successMsg)
        : Alert.alert("Sent ✅", successMsg);

      setTitle(""); setMessage(""); setBatchYear("");
      fetchHistory();
    } catch {
      Platform.OS === "web"
        ? window.alert("Failed to send")
        : Alert.alert("Error", "Failed to send");
    } finally { setSending(false); }
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };
  const closeDrawer = () => {
    Animated.timing(translateX, { toValue: -300, duration: 200, useNativeDriver: true })
      .start(() => setDrawerOpen(false));
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

  const pageProps = {
    isWeb, target, setTarget, batchYear, setBatchYear,
    title, setTitle, message, setMessage,
    sending, sendBulk, history,
  };

  if (isWeb) {
    return (
      <View style={s.webRoot}>
        <SidebarWeb handleMenu={handleMenu} />
        <View style={{ flex: 1 }}><PageContent {...pageProps} /></View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={openDrawer}>
          <Feather name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Alumni Admin</Text>
        <Ionicons name="notifications-outline" size={24} color={PRIMARY} />
      </View>

      <PageContent {...pageProps} />

      {drawerOpen && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Sidebar
            drawerOpen={drawerOpen}
            translateX={translateX}
            closeDrawer={closeDrawer}
            handleMenu={handleMenu}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#F5F6FA" },
  webRoot:    { flex: 1, flexDirection: "row", backgroundColor: "#f8fafc" },

  topBar:     { height: 65, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, elevation: 3 },
  topTitle:   { fontSize: 18, fontWeight: "700" },

  pageContent:    { padding: 18, paddingBottom: 60 },
  pageContentWeb: { padding: 28 },

  pageTitle:  { fontSize: 30, fontWeight: "800", color: "#0f172a" },
  breadcrumb: { color: "#94a3b8", marginTop: 4, marginBottom: 20, fontSize: 13 },

  sendCard:    { backgroundColor: "#fff", borderRadius: 22, padding: 20, marginBottom: 24 },
  sendCardWeb: { padding: 28 },
  webFormRow:  { flexDirection: "row", gap: 20 },

  cardTitle:  { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8 },

  chipRow:        { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  chip:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
  chipActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText:       { fontSize: 12, fontWeight: "600", color: "#475569" },
  chipActiveText: { color: "#fff" },

  // Batch section
  batchSection:    { backgroundColor: "#F8FAFC", borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  batchHeaderRow:  { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  batchIconBox:    { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  batchHint:       { fontSize: 11, color: "#94A3B8", marginTop: 1 },
  batchWebWrap:    { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 10, height: 44 },

  // Batch pill (mobile)
  batchPill:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E2E8F0" },
  batchPillActive:   { backgroundColor: PRIMARY, borderColor: PRIMARY },
  batchPillText:     { fontSize: 13, fontWeight: "600", color: "#64748B" },
  batchPillTextActive:{ color: "#fff" },
  batchMobileWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
    height: 52,
  },
  
  batchPicker: {
    flex: 1,
    color: "#111827",
  },
  selectedBatchBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EEF2FF", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10 },
  selectedBatchText:  { fontSize: 13, color: PRIMARY, flex: 1 },
  clearBatch:         { padding: 2 },

  noBatchWarning:  { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF3C7", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10 },
  noBatchText:     { fontSize: 12, color: "#92400E" },

  input:         { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 14, height: 52, fontSize: 14, color: "#111", marginBottom: 14, outlineWidth: 0, outlineStyle: "none" } as any,
  messageInput:  { height: 120, paddingTop: 14 },

  sendBtn:     { backgroundColor: PRIMARY, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 15, borderRadius: 14 },
  sendBtnWeb:  { alignSelf: "flex-start", paddingHorizontal: 32 },
  sendBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 14 },
  histGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  histCard:     { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12 },
  histCardWeb:  { width: "47%" },
  histTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  histTitle:    { fontSize: 14, fontWeight: "700", color: "#0F172A", flex: 1, marginRight: 8 },
  histTime:     { fontSize: 11, color: "#94A3B8" },
  histMsg:      { fontSize: 13, color: "#64748B", lineHeight: 20, marginBottom: 10 },
  histFooter:   { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  histTargetBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  histTargetText:  { fontSize: 11, color: "#4F46E5", fontWeight: "600" },
  histCount:       { fontSize: 11, color: "#94a3b8", fontWeight: "600", marginLeft: "auto" },
});
