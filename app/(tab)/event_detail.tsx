import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const isWeb = Platform.OS === "web";

const showAlert = (title: string, message: string) => {
  if (isWeb) window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

export default function EventsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const isTablet = width >= 768 && width < 1100;
  const px = isDesktop ? 32 : 16;

  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedPastEvent, setSelectedPastEvent] = useState<any>(null);
  
  const [rsvpEvents, setRsvpEvents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [pastEventGallery, setPastEventGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // ── INIT ──
  useEffect(() => {
    if (API_BASE) {
      loadUser();
      fetchEvents();
      fetchRSVPs();
    }
  }, []);

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (data) setUser(JSON.parse(data));
    } catch (err) { console.log(err); }
  };

  const formatDate = (date: any) => {
    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/events`);
      const allEvents = res.data.events || [];
      setEvents(allEvents.filter((item: any) => item.status === "Upcoming"));
      setPastEvents(allEvents.filter((item: any) => item.status === "Completed"));
    } catch (err) { console.log(err); } finally { setLoading(false); }
  };

  const handleRSVP = async (event: any, response: string) => {
    try {
      await axios.post(`${API_BASE}/rsvp`, {
        event_id: event.event_id,
        alumni_id: user?.id,
        response,
      });
      await fetchRSVPs();
      setSelectedEvent(null);
      showAlert("Success ✅", `Your RSVP "${response}" has been saved.`);
    } catch (error: any) {
      showAlert("Error ❌", "Failed to save RSVP");
    }
  };

  const fetchRSVPs = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (!data) return;
      const parsedUser = JSON.parse(data);
      const res = await axios.get(`${API_BASE}/rsvp/${parsedUser.id}`);
      setRsvpEvents(res.data.rsvps || []);
    } catch (err) { console.log(err); }
  };

  const filteredEvents = events.filter((item) => item.title?.toLowerCase().includes(search.toLowerCase()));
  const filteredPastEvents = pastEvents.filter((item) => item.title?.toLowerCase().includes(search.toLowerCase()));
  const allFilteredEvents = search.trim().length > 0 ? [...filteredEvents, ...filteredPastEvents] : [];

  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    if (!selectedEvent || !API_BASE) return;
    const timer = setInterval(async () => {
      const d = new Date(selectedEvent.event_date);
      const cleanDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const eventDateTime = `${cleanDate}T${selectedEvent.event_time}`;
      const distance = new Date(eventDateTime).getTime() - new Date().getTime();

      if (distance <= 0) {
        setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        clearInterval(timer);
        return;
      }

      setCountdown({
        days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, "0"),
        hours: String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, "0"),
        minutes: String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0"),
        seconds: String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, "0"),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedEvent]);

  const getImageUrl = (path: string) => path?.startsWith("http") ? path : `${API_BASE}${path?.startsWith('/') ? '' : '/'}${path}`;

  if (!API_BASE) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={54} color="#EF4444" />
        <Text style={styles.errorTitle}>Configuration Mismatch</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar backgroundColor="#312EBA" barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.topSection}>
          <Text style={styles.heading}>Alumni Events</Text>
          <Text style={styles.subHeading}>Reconnect • Network • Celebrate</Text>

          <View style={styles.searchWrapper}>
            <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput
                placeholder="Search all events..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
              {search.trim().length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={16} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tabsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {["Upcoming", "My RSVPs", "Past Events"].map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]} onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.contentArea, { paddingHorizontal: px }]}>
          {loading ? (
            <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
          ) : (
            <>
              {activeTab === "Upcoming" && (
                <View style={isDesktop && styles.desktopGrid}>
                  {filteredEvents.map((item) => (
                    <View key={item.event_id} style={[styles.heroCard, isDesktop && styles.desktopCard]}>
                      <Image source={{ uri: getImageUrl(item.cover_photo) }} style={styles.heroBg} contentFit="cover" />
                      <View style={styles.overlay} />
                      <View style={styles.heroContent}>
                        <View style={styles.liveBadge}><Ionicons name="flash" size={14} color="#FBBF24" /><Text style={styles.liveText}>UPCOMING</Text></View>
                        <Text style={styles.heroMainTitle}>{item.title}</Text>
                        <Text numberOfLines={2} style={styles.heroDescription}>{item.description}</Text>
                        <TouchableOpacity style={styles.heroBtn} onPress={() => setSelectedEvent(item)} activeOpacity={0.85}>
                          <Text style={styles.heroBtnText}>View Details</Text>
                          <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {activeTab === "My RSVPs" && (
                <View style={isDesktop && styles.desktopGrid}>
                  {rsvpEvents.map((event: any) => (
                    <View key={event.event_id} style={[styles.rsvpCardModern, isDesktop && styles.desktopCard]}>
                      <Image source={{ uri: getImageUrl(event.cover_photo) }} style={styles.rsvpImageModern} contentFit="cover" />
                      <View style={styles.rsvpBodyModern}>
                        <View style={styles.rsvpTopRowModern}>
                          <View style={[styles.statusBadge, event.response === "GOING" ? styles.goingBadge : styles.maybeBadge]}><Text style={styles.statusText}>{event.response}</Text></View>
                        </View>
                        <Text style={styles.rsvpTitleModern}>{event.title}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ══ MODALS ══ */}
      <Modal visible={selectedEvent !== null} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isDesktop && styles.modalCardWeb]}>
            <TouchableOpacity style={styles.modalCloseIcon} onPress={() => setSelectedEvent(null)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={{ uri: getImageUrl(selectedEvent?.cover_photo) }} style={styles.modalImage} contentFit="cover" />
              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>
                <Text style={styles.modalDescription}>{selectedEvent?.description}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16 },
  
  topSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60, elevation: 5 },
  heading: { fontSize: isWeb ? 44 : 32, fontWeight: "900", color: "#fff", letterSpacing: -1 },
  subHeading: { fontSize: 16, color: "rgba(255,255,255,0.9)", marginTop: 8, fontWeight: "500" },
  
  searchWrapper: { width: "100%", maxWidth: 800, alignSelf: "center", marginTop: 24, zIndex: 50 },
  searchBox: { 
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", 
    borderRadius: 20, height: 60, paddingHorizontal: 20, 
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, 
    elevation: 4 
  },
  searchBoxFocused: { borderColor: "#818CF8", borderWidth: 2 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: "#0F172A", ...Platform.select({ web: { outlineStyle: "none" } as any }) },
  clearBtn: { width: 30, height: 30, backgroundColor: "#F1F5F9", borderRadius: 15, justifyContent: "center", alignItems: "center" },

  tabsWrapper: { marginTop: -20, zIndex: 5 },
  tabsScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 10 },
  tabBtn: { backgroundColor: "#fff", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, elevation: 2 },
  activeTabBtn: { backgroundColor: "#4F46E5" },
  tabText: { color: "#475569", fontWeight: "700", fontSize: 14 },
  activeTabText: { color: "#fff" },

  contentArea: { paddingTop: 20, width: "100%", maxWidth: 1200, alignSelf: "center" },
  desktopGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  desktopCard: { width: "48%" },

  heroCard: { 
    width: "100%", height: 340, borderRadius: 24, overflow: "hidden", 
    marginBottom: 24, backgroundColor: "#0F172A", 
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 
  },
  heroBg: { width: "100%", height: "100%", position: "absolute" },
  overlay: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.3)" },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: 28 },
  liveBadge: { backgroundColor: "rgba(245,158,11,0.2)", alignSelf: "flex-start", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  liveText: { color: "#FBBF24", marginLeft: 6, fontWeight: "800", fontSize: 11 },
  heroMainTitle: { fontSize: 28, fontWeight: "900", color: "#fff", lineHeight: 34, letterSpacing: -0.5 },
  heroDescription: { color: "#E2E8F0", fontSize: 15, lineHeight: 24, marginTop: 12, opacity: 0.9 },
  heroBtn: { 
    backgroundColor: "#fff", paddingHorizontal: 24, paddingVertical: 14, 
    borderRadius: 16, flexDirection: "row", alignItems: "center", 
    alignSelf: "flex-start", marginTop: 24, gap: 8 
  },
  heroBtnText: { color: "#4F46E5", fontWeight: "800", fontSize: 15 },

  rsvpCardModern: { 
    backgroundColor: "#fff", borderRadius: 24, marginBottom: 20, overflow: "hidden", 
    borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 15, elevation: 3 
  },
  rsvpImageModern: { width: "100%", height: 200 },
  rsvpBodyModern: { padding: 24 },
  rsvpTopRowModern: { marginBottom: 14 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  goingBadge: { backgroundColor: "#16A34A" }, maybeBadge: { backgroundColor: "#F59E0B" },
  statusText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  rsvpTitleModern: { fontSize: 20, fontWeight: "800", color: "#0F172A" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#fff", borderRadius: 32, overflow: "hidden", maxHeight: "90%" },
  modalCardWeb: { maxWidth: 600, width: "100%", alignSelf: "center" },
  modalCloseIcon: { position: 'absolute', top: 20, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 8 },
  modalImage: { width: "100%", height: 260 },
  modalBody: { padding: 32 },
  modalTitle: { fontSize: 28, fontWeight: "900", color: "#0F172A", marginBottom: 16 },
  modalDescription: { fontSize: 15, color: "#334155", lineHeight: 24 }
});