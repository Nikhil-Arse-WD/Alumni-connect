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
import { Feather, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";

import SidebarWeb from "./components/SidebarWeb";
import Sidebar from "./components/sidebar";

const API = "http://10.232.80.175:2000";
const PRIMARY = "#5B5FEF";
const BREAKPOINT = 768;

const TARGETS = ["All", "Approved Only", "Pending Only"];

// ─────────────────────────────────────────────────────────────
// PAGE CONTENT COMPONENT
// ─────────────────────────────────────────────────────────────
const PageContent = memo(
  ({
    isWeb,
    target,
    setTarget,
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
        contentContainerStyle={[
          s.pageContent,
          isWeb && s.pageContentWeb,
        ]}
      >
        <Text style={s.pageTitle}>Notifications</Text>
        <Text style={s.breadcrumb}>
          Dashboard › Notifications
        </Text>

        {/* SEND CARD */}
        <View style={[s.sendCard, isWeb && s.sendCardWeb]}>
          <Text style={s.cardTitle}>Send Announcement</Text>

          {/* TARGETS */}
          <Text style={s.fieldLabel}>Target Audience</Text>

          <View style={s.chipRow}>
            {TARGETS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  s.chip,
                  target === t && s.chipActive,
                ]}
                onPress={() => setTarget(t)}
              >
                <Text
                  style={[
                    s.chipText,
                    target === t && s.chipActiveText,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* FORM */}
          <View style={isWeb ? s.webFormRow : {}}>
            {/* TITLE */}
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

            {/* MESSAGE */}
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

          {/* SEND BUTTON */}
          <TouchableOpacity
            style={[
              s.sendBtn,
              sending && { opacity: 0.6 },
              isWeb && s.sendBtnWeb,
            ]}
            onPress={sendBulk}
            disabled={sending}
          >
            <Ionicons
              name="send"
              size={18}
              color="#fff"
            />

            <Text style={s.sendBtnText}>
              {sending ? "Sending..." : "Send to All"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* HISTORY */}
        <Text style={s.sectionTitle}>Sent History</Text>

        <View style={isWeb ? s.histGrid : {}}>
          {history.map((item: any, i: number) => (
            <View
              key={i}
              style={[
                s.histCard,
                isWeb && s.histCardWeb,
              ]}
            >
              <View style={s.histTop}>
                <Text style={s.histTitle}>
                  {item.title}
                </Text>

                <Text style={s.histTime}>
                  {new Date(
                    item.created_at
                  ).toLocaleDateString()}
                </Text>
              </View>

              <Text style={s.histMsg}>
                {item.message}
              </Text>

              <View style={s.histFooter}>
                <View style={s.histTargetBadge}>
                  <Ionicons
                    name="people-outline"
                    size={11}
                    color="#6366f1"
                  />

                  <Text style={s.histTargetText}>
                    {item.target}
                  </Text>
                </View>

                <Text style={s.histCount}>
                  {item.sent_count} recipients
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AdminNotifications() {
  const router = useRouter();

  const { width } = useWindowDimensions();

  const isWeb = width >= BREAKPOINT;

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("All");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const translateX = useRef(
    new Animated.Value(-300)
  ).current;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `${API}/admin/notifications/history`
      );

      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const sendBulk = async () => {
    if (!title || !message) {
      Platform.OS === "web"
        ? window.alert("Fill title and message")
        : Alert.alert(
            "Validation",
            "Fill title and message"
          );

      return;
    }

    setSending(true);

    try {
      await axios.post(
        `${API}/admin/notifications/bulk`,
        {
          title,
          message,
          target,
        }
      );

      Platform.OS === "web"
        ? window.alert("Notification sent!")
        : Alert.alert(
            "Sent ✅",
            "Notification sent"
          );

      setTitle("");
      setMessage("");

      fetchHistory();
    } catch {
      Platform.OS === "web"
        ? window.alert("Failed to send")
        : Alert.alert(
            "Error",
            "Failed to send"
          );
    } finally {
      setSending(false);
    }
  };

  const openDrawer = () => {
    setDrawerOpen(true);

    Animated.timing(translateX, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(translateX, {
      toValue: -300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDrawerOpen(false);
    });
  };

  const handleMenu = (route: string) => {
    closeDrawer();

    if (route === "logout") {
      if (Platform.OS === "web") {
        if (
          window.confirm(
            "Are you sure you want to logout?"
          )
        ) {
          router.replace("/loginscreen");
        }
      } else {
        Alert.alert("Logout", "Are you sure?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Logout",
            onPress: () =>
              router.replace("/loginscreen"),
          },
        ]);
      }

      return;
    }

    router.push(`/admin/${route}` as any);
  };

  // ───────────────── WEB ─────────────────
  if (isWeb) {
    return (
      <View style={s.webRoot}>
        <SidebarWeb handleMenu={handleMenu} />

        <View style={{ flex: 1 }}>
          <PageContent
            isWeb={isWeb}
            target={target}
            setTarget={setTarget}
            title={title}
            setTitle={setTitle}
            message={message}
            setMessage={setMessage}
            sending={sending}
            sendBulk={sendBulk}
            history={history}
          />
        </View>
      </View>
    );
  }

  // ───────────────── MOBILE ─────────────────
  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={openDrawer}>
          <Feather
            name="menu"
            size={24}
            color="#000"
          />
        </TouchableOpacity>

        <Text style={s.topTitle}>
          Alumni Admin
        </Text>

        <Ionicons
          name="notifications-outline"
          size={24}
          color={PRIMARY}
        />
      </View>

      <PageContent
        isWeb={isWeb}
        target={target}
        setTarget={setTarget}
        title={title}
        setTitle={setTitle}
        message={message}
        setMessage={setMessage}
        sending={sending}
        sendBulk={sendBulk}
        history={history}
      />

      {drawerOpen && (
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
        >
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
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  webRoot: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f8fafc",
  },

  topBar: {
    height: 65,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    elevation: 3,
  },

  topTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  pageContent: {
    padding: 18,
    paddingBottom: 60,
  },

  pageContentWeb: {
    padding: 28,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f172a",
  },

  breadcrumb: {
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 20,
    fontSize: 13,
  },

  sendCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
  },

  sendCardWeb: {
    padding: 28,
  },

  webFormRow: {
    flexDirection: "row",
    gap: 20,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },

  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },

  chipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },

  chipActiveText: {
    color: "#fff",
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 14,
    color: "#111",
    marginBottom: 14,

    outlineWidth: 0,
    outlineColor: "transparent",
    outlineStyle: "none",
  } as any,

  messageInput: {
    height: 120,
    paddingTop: 14,
  },

  sendBtn: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },

  sendBtnWeb: {
    alignSelf: "flex-start",
    paddingHorizontal: 32,
  },

  sendBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 14,
  },

  histGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  histCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  histCardWeb: {
    width: "47%",
  },

  histTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  histTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },

  histTime: {
    fontSize: 11,
    color: "#94A3B8",
  },

  histMsg: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 10,
  },

  histFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  histTargetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  histTargetText: {
    fontSize: 11,
    color: "#4F46E5",
    fontWeight: "600",
  },

  histCount: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
});