// ======================================================
// Header.tsx — updated
// is_password_changed === 0 wale user ko Header
// aur Mobile Tab Bar nahi dikhega
// ======================================================

// ... (saare existing imports same rahenge)
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, Image, Modal, Platform, StyleSheet,
  Text, TouchableOpacity, useWindowDimensions, View,
} from "react-native";
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const API = process.env.EXPO_PUBLIC_API_BASE;
const DESKTOP_BP = 768;

function useResponsiveWidth(): number {
  const { width: rnWidth } = useWindowDimensions();
  const getWebWidth = () =>
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.innerWidth : rnWidth;
  const [width, setWidth] = useState<number>(getWebWidth);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (Platform.OS === "web") return;
    setWidth(rnWidth);
  }, [rnWidth]);
  return width;
}

const TABS = [
  { name: "Home",   icon: "home-outline",     route: "/" },
  { name: "Alumni", icon: "people-outline",    route: "/alumnidirectory" },
  { name: "Events", icon: "calendar-outline",  route: "/event_detail" },
  { name: "Jobs",   icon: "briefcase-outline", route: "/job" },
  { name: "More",   icon: "grid-outline",      route: "/#" },
];

const MORE_ITEMS = [
  { label: "Giving back", sub: "Lectures, mentorship, donations", icon: "heart-outline", iconBg: "#EEF2FF", iconColor: "#4F46E5", route: "/donation" },
  { label: "Discussion forum", sub: "Connect with the community", icon: "chatbubbles-outline", iconBg: "#DCFCE7", iconColor: "#16A34A", route: "/form" },
];

const INFO_ITEMS = [
  { label: "About us",       sub: "Our mission and story",         icon: "information-circle-outline", route: "/about" },
  { label: "Contact us",     sub: "Get in touch with the team",    icon: "mail-outline",               route: "/contact" },
  { label: "Office Bearers", sub: "Get in touch with the team",    icon: "people",                     route: "/office" },
  { label: "Developer",      sub: "Meet our developers",           icon: "people",                     route: "/develper" },
];

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
     <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export default function Header() {
  const router   = useRouter();
  const pathname = usePathname();

  const width     = useResponsiveWidth();
  const isDesktop = width >= DESKTOP_BP;
  const isNative  = Platform.OS !== "web";

  const [user,            setUser]            = useState<any>(null);
  const [unreadNotifs,    setUnreadNotifs]    = useState(0);
  const [unreadMsgs,      setUnreadMsgs]      = useState(0);
  const [moreVisible,     setMoreVisible]     = useState(false);
  // ── NEW: password change status ──────────────────────────────
  const [passwordChanged, setPasswordChanged] = useState<boolean | null>(null);
  // ─────────────────────────────────────────────────────────────
  const forumVisited = useRef(false);

  // ── Keep track of the last profile_photo we rendered, so we only
  //    update state (and re-render) when it actually changes.
  const lastPhotoRef = useRef<string | null>(null);

  const scale      = useSharedValue(1);
  const translateX = useSharedValue(-40);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    scale.value      = withRepeat(withTiming(1.08, { duration: 1200 }), -1, true);
    translateX.value = withTiming(0,  { duration: 500 });
    opacity.value    = withTiming(1,  { duration: 700 });
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const textAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  useFocusEffect(
    useCallback(() => {
      loadUser();
      fetchNotifCount();
      forumVisited.current = false;
      fetchForumCount();

      // ── Poll every 5s. This also re-reads AsyncStorage("user"),
      //    so if Header lives in a persistent root layout (outside
      //    the nested profile/editprofile stack) and never gets a
      //    focus event when navigating within that stack, the
      //    profile photo / name still refreshes automatically
      //    within a few seconds — no logout/login needed.
      const interval = setInterval(() => {
        loadUser();
        fetchNotifCount();
        if (!forumVisited.current) fetchForumCount();
      }, 5000);

      return () => clearInterval(interval);
    }, [])
  );

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (data) {
        const parsed = JSON.parse(data);
        // Only trigger a re-render when something actually changed
        if (parsed.profile_photo !== lastPhotoRef.current) {
          lastPhotoRef.current = parsed.profile_photo ?? null;
        }
        setUser(parsed);
        // ── Check password status ──────────────────────────────
        setPasswordChanged(parsed.is_password_changed === 1);
        // ──────────────────────────────────────────────────────
      }
    } catch {}
  };

  const getUserId = async (): Promise<number | null> => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (!data) return null;
      return JSON.parse(data).id;
    } catch { return null; }
  };

  const fetchNotifCount = async () => {
    try {
      const id = await getUserId();
      if (!id) return;
      const res = await axios.get(`${API}/notifications/unread-count/${id}`);
      if (res.data.success) setUnreadNotifs(res.data.count ?? 0);
    } catch {}
  };

  const fetchForumCount = async () => {
    try {
      const id = await getUserId();
      if (!id) return;
      const res = await axios.get(`${API}/forum/count/${id}`);
      if (res.data.success) setUnreadMsgs(res.data.count ?? 0);
    } catch {}
  };

  const handleProfilePress = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      router.push(email ? { pathname: "/profile", params: { email } } : "/loginscreen");
    } catch { router.push("/loginscreen"); }
  };

  const handleNotifPress = async () => {
    setUnreadNotifs(0);
    try {
      const id = await getUserId();
      if (id) await axios.patch(`${API}/notifications/mark-read/${id}`);
    } catch {}
    router.push("/notification");
  };

  const handleMsgPress = async () => {
    setUnreadMsgs(0);
    forumVisited.current = true;
    try {
      const id = await getUserId();
      if (id) axios.post(`${API}/forum/seen/${id}`).catch(() => {});
    } catch {}
    router.push("/form");
  };

  const handleLogout = () => {
    setMoreVisible(false);
    const doLogout = () => {
      AsyncStorage.clear();
      router.replace("/loginscreen");
    };
    if (isNative) {
      Alert.alert("Logout", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: doLogout },
      ]);
    } else {
      if (window.confirm("Are you sure you want to logout?")) doLogout();
    }
  };

  const handleMoreNav = (route: string) => {
    setMoreVisible(false);
    setTimeout(() => router.push(route as any), 200);
  };

  const logoSize  = isDesktop ? 52 : 44;
  const headerH   = isDesktop ? 72 : 68;
  const titleSize = isDesktop ? Math.min(25, width * 0.018) : 18;
  const tabSize   = isDesktop ? Math.min(14, width * 0.013) : 11;
  const iconSize  = isDesktop ? 22 : 20;

  // ══════════════════════════════════════════════════════════════
  // ── KEY GUARD: password nahi badla toh kuch nahi dikhao ──────
  // ══════════════════════════════════════════════════════════════
  if (passwordChanged === false || passwordChanged === null) {
    return null;
  }
  // ══════════════════════════════════════════════════════════════

  // ── Cache-bust the photo URL using the last-modified marker
  //    stored on the user object (or fall back to Date.now() at
  //    render time) so the <Image> doesn't keep showing a stale
  //    cached bitmap for the same filename after a re-upload.
  const profilePhotoUri = user?.profile_photo
    ? `${API}/uploads/${user.profile_photo}?v=${user.photo_updated_at ?? ""}`
    : null;

  const MoreSheet = () => (
    <Modal
      visible={moreVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setMoreVisible(false)}
    >
      <TouchableOpacity
        style={[styles.backdrop, isDesktop ? styles.backdropDesktop : styles.backdropMobile]}
        activeOpacity={1}
        onPress={() => setMoreVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={[styles.sheet, isDesktop ? styles.sheetDesktop : styles.sheetMobile]}
        >
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>More options</Text>

          {MORE_ITEMS.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => handleMoreNav(item.route)} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}

          <View style={styles.sheetDivider} />

          {INFO_ITEMS.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => handleMoreNav(item.route)} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: "#F8FAFC" }]}>
                <Ionicons name={item.icon as any} size={20} color="#64748B" />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}

          <View style={styles.sheetDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, { color: "#DC2626" }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          {!isDesktop && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMoreVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <>
      {/* ── HEADER ── */}
      <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <SafeAreaView edges={["top"]} style={styles.wrapper}>
          <LinearGradient
            colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.header, { height: headerH }]}
          >
            <View style={[styles.left, isDesktop && styles.leftDesktop]}>
              <Animated.Image
                source={require("../../assets/Alumni_Pics/logo.png")}
                style={[logoAnimStyle, { width: logoSize, height: logoSize, borderRadius: logoSize / 2, marginRight: 10 }]}
              />
              <Animated.View style={[styles.textContainer, textAnimStyle]}>
                <Text style={[styles.title, { fontSize: titleSize }]}>SVIMAA Connect</Text>
              </Animated.View>
            </View>

            {isDesktop && (
              <View style={styles.webNav}>
                {TABS.map((tab, i) => {
                  const active = pathname === tab.route;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.webTab, active && styles.webTabActive]}
                      onPress={() => tab.name === "More" ? setMoreVisible(true) : router.push(tab.route as any)}
                    >
                      <Ionicons name={tab.icon as any} size={17} color={active ? "#fff" : "rgba(255,255,255,0.75)"} />
                      <Text style={[styles.webTabText, active && styles.webTabTextActive, { fontSize: tabSize }]}>
                        {tab.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={[styles.right, isDesktop && styles.rightDesktop]}>
              <TouchableOpacity style={styles.glassBtn} onPress={handleNotifPress}>
                <Ionicons name="notifications-outline" size={iconSize} color="#fff" />
                <Badge count={unreadNotifs} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} onPress={handleMsgPress}>
                <Ionicons name="chatbubble-ellipses-outline" size={iconSize - 1} color="#fff" />
                <Badge count={unreadMsgs} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleProfilePress}>
                {profilePhotoUri ? (
                  <Image key={profilePhotoUri} source={{ uri: profilePhotoUri }} style={styles.profileImg} />
                ) : (
                  <LinearGradient colors={["#ffffff", "#dbeafe"]} style={styles.profileFallback}>
                    <Ionicons name="person" size={18} color="#5B21B6" />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </SafeAreaView>
      </LinearGradient>

      {/* ── MOBILE TAB BAR ── */}
      {!isDesktop && (
        <View style={styles.mobileTabBar}>
          {TABS.map((tab, i) => {
            const active = pathname === tab.route;
            return (
              <TouchableOpacity
                key={i}
                style={styles.mobileTab}
                onPress={() => tab.name === "More" ? setMoreVisible(true) : router.push(tab.route as any)}
              >
                <View style={styles.mobileTabInner}>
                  {active && <View style={styles.mobileTabBg} />}
                  <Ionicons name={tab.icon as any} size={22} color={active ? "#EC1D8F" : "#94A3B8"} />
                </View>
                <Text style={[styles.mobileTabText, active && styles.mobileTabTextActive]}>{tab.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <MoreSheet />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, elevation: 10 },
  left: { flexDirection: "row", alignItems: "center", flex: 1 },
  leftDesktop: { flex: 0.8 },
  textContainer: { justifyContent: "center" },
  title: { color: "#fff", fontWeight: "900", letterSpacing: 0.2 },
  webNav: { flexDirection: "row", alignItems: "center", justifyContent: "center", flex: 1.5, gap: 4 },
  webTab: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, gap: 6 },
  webTabActive: { backgroundColor: "rgba(255,255,255,0.15)" },
  webTabText: { color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  webTabTextActive: { color: "#fff", fontWeight: "800" },
  right: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  rightDesktop: { flex: 0.7 },
  glassBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center" },
  profileImg: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
  profileFallback: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: -5, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: "#22C55E", justifyContent: "center", alignItems: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#fff" },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  mobileTabBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 112, backgroundColor: "#fff", borderTopWidth: 0.5, borderTopColor: "#E2E8F0", flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingBottom: 30, zIndex: 999, elevation: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },
  mobileTab: { alignItems: "center", justifyContent: "center", flex: 1 },
  mobileTabInner: { width: 46, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14, position: "relative" },
  mobileTabBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FCE7F3", borderRadius: 14 },
  mobileTabText: { fontSize: 11, marginTop: 4, color: "#94A3B8", fontWeight: "500" },
  mobileTabTextActive: { color: "#EC1D8F", fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  backdropMobile: { justifyContent: "flex-end", alignItems: "stretch" },
  backdropDesktop: { justifyContent: "center", alignItems: "center" },
  sheet: { backgroundColor: "#fff", paddingBottom: 40 },
  sheetMobile: { borderTopLeftRadius: 28, borderTopRightRadius: 28, width: "100%" },
  sheetDesktop: { borderRadius: 20, width: 480, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 24, elevation: 30 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginTop: 12, marginBottom: 20 },
  sheetTitle: { fontSize: 12, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.8, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: "#F1F5F9", marginBottom: 8, textTransform: "uppercase" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  menuIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  menuSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  sheetDivider: { height: 0.5, backgroundColor: "#F1F5F9", marginHorizontal: 20, marginVertical: 6 },
  cancelBtn: { marginHorizontal: 20, marginTop: 12, backgroundColor: "#F8FAFC", paddingVertical: 14, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  cancelText: { fontSize: 15, fontWeight: "700", color: "#64748B" },
});