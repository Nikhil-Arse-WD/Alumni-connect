// ======================================================
// AlumniDirectoryScreen.tsx
// ======================================================

import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const API_URL = `${API_BASE}/alumni`;
const isWeb = Platform.OS === "web";

// ── Programme groups ─────────────────────────────────────
const PROGRAMME_GROUPS = [
  {
    group: "Management",
    items: [
      { label: "MBA", value: "MBA" },
      { label: "BBA", value: "BBA" },
    ],
  },
  {
    group: "Sciences",
    items: [
      { label: "MCA",       value: "MCA"     },
      { label: "BCA",       value: "BCA"     },
      { label: "M.Sc",      value: "M.Sc"    },
      { label: "B.Sc (CS)", value: "B.Sc CS" },
      { label: "B.Sc (BI)", value: "B.Sc BI" },
      { label: "B.Sc (BT)", value: "B.Sc BT" },
      { label: "B.Sc (MB)", value: "B.Sc MB" },
    ],
  },
];

type ProgrammeItem = { label: string; value: string; disabled?: boolean };
const PROGRAMME_FLAT: ProgrammeItem[] = PROGRAMME_GROUPS.flatMap(g => [
  { label: `── ${g.group} ──`, value: `_h_${g.group}`, disabled: true },
  ...g.items,
]);

// ======================================================
// AVATAR HELPERS
// ======================================================
const AVATAR_COLORS = ["#4F46E5", "#2563EB", "#059669", "#D97706", "#DB2777"];
const getAvatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name = "") => name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

// ======================================================
// FILTER DROPDOWN 
// ======================================================
function FilterDropdown({ label, value, onChange, options, grouped = false }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[]; grouped?: boolean;
}) {
  if (isWeb) {
    return (
      <View style={styles.dropdownBox}>
        {typeof document !== "undefined" && (() => {
          const id = "optgroup-fix-style";
          if (!document.getElementById(id)) {
            const s = document.createElement("style");
            s.id = id;
            s.textContent = `
              .alumni-filter-select option { color: #0F172A !important; background: #fff !important; }
              .alumni-filter-select optgroup { color: #4F46E5 !important; background: #EEF2FF !important; font-weight: 700 !important; font-style: normal !important; }
            `;
            document.head.appendChild(s);
          }
          return null;
        })()}
        <select
          className="alumni-filter-select"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%", height: 50, border: "none",
            background: "transparent", paddingLeft: 16,
            fontSize: 14, color: "#fff", outline: "none", cursor: "pointer", fontWeight: "600"
          }}
        >
          <option value="" style={{ color: "#64748B", background: "#fff" }}>{label}</option>
          {grouped ? (
            PROGRAMME_GROUPS.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </optgroup>
            ))
          ) : (
            options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
          )}
        </select>
      </View>
    );
  }

  // ── Mobile Picker ──
  return (
    <View style={styles.dropdownBox}>
      <Picker
        selectedValue={value}
        onValueChange={v => { if (grouped && String(v).startsWith("_h_")) return; onChange(v); }}
        dropdownIconColor="#fff"
        style={{ color: "#fff", height: 50 }}
      >
        <Picker.Item label={label} value="" />
        {grouped
          ? PROGRAMME_FLAT.map(i => <Picker.Item key={i.value} label={i.label} value={i.value} enabled={i.disabled !== true} color={i.disabled === true ? "#94A3B8" : "#111"} />)
          : options.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)
        }
      </Picker>
    </View>
  );
}

// ======================================================
// ALUMNI CARD
// ======================================================
function AlumniCard({ item, onPress, cardWidth }: { item: any; onPress: () => void; cardWidth?: number }) {
  const safeImgUri = item.profile_photo ? (item.profile_photo.startsWith("http") ? item.profile_photo : `${API_BASE}/uploads/${item.profile_photo}`) : null;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, cardWidth ? { width: cardWidth } : null]}>
      <View style={styles.cardTop}>
        <View style={styles.userRow}>
          {safeImgUri ? (
            <Image source={{ uri: safeImgUri }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <LinearGradient colors={[getAvatarColor(item.full_name), "#312EBA"]} style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
            </LinearGradient>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
            <Text style={styles.role} numberOfLines={1}>{item.designation || "Alumni Member"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tagRow}>
        {item.programme && <View style={styles.programTag}><Text style={styles.programText}>{item.programme}</Text></View>}
        {item.batch_year && <View style={styles.batchTag}><Text style={styles.batchText}>{item.batch_year}</Text></View>}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#64748B" />
          <Text style={styles.infoText} numberOfLines={1}>{item.city || "Unknown Location"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="briefcase-outline" size={14} color="#64748B" />
          <Text style={styles.infoText} numberOfLines={1}>{item.organisation || "Independent"}</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ marginTop: 24 }}>
        <LinearGradient colors={["#EEF2FF", "#EEF2FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.connectButton}>
          <Text style={styles.connectText}>View Profile</Text>
          <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ======================================================
// MAIN SCREEN
// ======================================================
export default function AlumniDirectoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const [showFilters, setShowFilters] = useState(!isMobile); // Open by default on Web
  
  const GAP          = 18;
  const SIDE_PADDING = isMobile ? 16 : 32;
  const numColumns   = width >= 1400 ? 4 : width >= 1000 ? 3 : width >= 700 ? 2 : 1;
  const totalGap     = GAP * (numColumns - 1);
  const containerWidth = isWeb ? Math.min(width * 0.94, 1600) : width * 0.94;
  const cardWidth = (containerWidth - SIDE_PADDING * 2 - totalGap) / numColumns;

  const [alumni,     setAlumni]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [search,     setSearch]     = useState("");
  const [programme,  setProgramme]  = useState("");
  const [batchYear,  setBatchYear]  = useState("");
  const [city,       setCity]       = useState("");

  const fetchAlumni = async () => {
    if (!API_BASE) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(API_URL, {
        params: { search, programme, batch_year: batchYear, city },
      });
      // 🚨 Fallback to empty array prevents random crashes if backend sends null
      setAlumni(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAlumni(); }, []);
  
  // ── Debounced Search Effect ──
  useEffect(() => {
    const delay = setTimeout(() => fetchAlumni(), 600);
    return () => clearTimeout(delay);
  }, [search, programme, batchYear, city]);

  const onRefresh = () => { setRefreshing(true); fetchAlumni(); };

  // ── Missing System Error Screen ──
  if (!API_BASE) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={54} color="#EF4444" />
        <Text style={styles.errorTitle}>Configuration Mismatch</Text>
        <Text style={styles.errorSub}>The backend endpoint variable is undefined. Please ensure EXPO_PUBLIC_API_BASE is properly mapped inside your root environment configuration file.</Text>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.loaderWrap}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HERO SECTION */}
      <LinearGradient
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Alumni Directory</Text>
          <Text style={styles.heroSubtitle}>Find, network, and connect with alumni worldwide</Text>

          {/* SEARCH BAR */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput
                placeholder="Search by name, company, or designation..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
              {!isWeb && (
                <TouchableOpacity style={styles.filterToggleBtn} onPress={() => setShowFilters(!showFilters)} activeOpacity={0.8}>
                  <Ionicons name={showFilters ? "close-outline" : "options-outline"} size={22} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* EXPANDABLE FILTERS */}
          {showFilters && (
            <View style={styles.filtersRow}>
              <View style={styles.filterItem}>
                <FilterDropdown label="All Programmes" value={programme} onChange={setProgramme} options={[]} grouped={true} />
              </View>
              <View style={styles.filterItem}>
                <FilterDropdown
                  label="All Batches"
                  value={batchYear}
                  onChange={setBatchYear}
                  options={Array.from({ length: new Date().getFullYear() - 1989 + 1 }, (_, i) => { 
                    const y = new Date().getFullYear() - i; return { label: String(y), value: String(y) }; 
                  })}
                />
              </View>
              <View style={styles.filterItem}>
                <FilterDropdown
                  label="All Locations"
                  value={city}
                  onChange={setCity}
                  options={[
                    { label: "Indore",    value: "Indore"    },
                    { label: "Delhi",     value: "Delhi"     },
                    { label: "Mumbai",    value: "Mumbai"    },
                    { label: "Bangalore", value: "Bangalore" },
                    { label: "Pune",      value: "Pune"      },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* DIRECTORY LIST */}
      <View style={[styles.space, { width: containerWidth }]}>
        <FlatList
          key={numColumns}
          data={alumni}
          numColumns={numColumns}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: SIDE_PADDING,
            paddingBottom: 80,
            paddingTop: 32, // Rebalanced padding to avoid clipping the hero gradient
          }}
          columnWrapperStyle={numColumns > 1 ? { justifyContent: "flex-start", marginBottom: GAP } : undefined}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item, index }) => (
            <View style={{ marginRight: (index + 1) % numColumns === 0 ? 0 : GAP, marginBottom: numColumns === 1 ? GAP : 0 }}>
              <AlumniCard
                item={item}
                cardWidth={cardWidth}
                onPress={() => router.push({ pathname: "/alumniprofile", params: { id: item.id } })}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="people-outline" size={48} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Alumni Found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filter parameters.</Text>
              { (search || programme || batchYear || city) && (
                <TouchableOpacity 
                  style={styles.clearBtn} 
                  onPress={() => { setSearch(""); setProgramme(""); setBatchYear(""); setCity(""); }}
                >
                  <Text style={styles.clearBtnText}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  
  // System Level Error Interfaces
  errorContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 32, textAlign: "center" as any },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20, maxWidth: 420 },

  heroSection: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: isWeb ? 32 : 16,
  },
  heroContent: { alignItems: "center", maxWidth: 900, width: "100%", alignSelf: "center" },
  heroTitle: { color: "#fff", fontSize: isWeb ? 40 : 32, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: isWeb ? 16 : 14, marginTop: 8, marginBottom: 28, textAlign: "center", fontWeight: "500" },
  
  searchWrapper: { width: "100%", alignItems: "center" },
  searchContainer: {
    width: "100%", height: 56,
    backgroundColor: "#fff", borderRadius: 16,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 15, elevation: 6,
  },
  searchInput: { flex: 1, marginLeft: 12, color: "#0F172A", fontSize: 15, fontWeight: "500", ...Platform.select({ web: { outlineStyle: "none" } as any }) },
  filterToggleBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center", marginLeft: 10 },
  
  filtersRow: {
    flexDirection: isWeb ? "row" : "column",
    width: "100%", justifyContent: "center", alignItems: "center",
    marginTop: 20, gap: 12, flexWrap: "wrap",
  },
  filterItem: { width: isWeb ? 240 : "100%" },
  dropdownBox: {
    height: 50, backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden", justifyContent: "center",
  },

  space: {
    flex: 1, alignSelf: "center",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    marginTop: -20, // Rebalanced negative margin for cleaner overlap
    borderWidth: 1, borderColor: "#F1F5F9",
  },

  card: {
    backgroundColor: "#fff", borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: "#E2E8F0",
    shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  cardTop: { marginBottom: 18 },
  userRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", marginRight: 14 },
  avatarImage: { width: 56, height: 56, borderRadius: 28, marginRight: 14, borderWidth: 1, borderColor: "#F1F5F9" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  name: { fontSize: 17, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  role: { marginTop: 4, fontSize: 13, color: "#64748B", fontWeight: "500" },
  
  tagRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  programTag: { backgroundColor: "#F3E8FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  batchTag: { backgroundColor: "#E0F2FE", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  programText: { color: "#6D28D9", fontWeight: "700", fontSize: 11, textTransform: "uppercase" },
  batchText: { color: "#0369A1", fontWeight: "700", fontSize: 11, textTransform: "uppercase" },
  
  infoSection: { gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoText: { marginLeft: 8, color: "#475569", fontSize: 13, fontWeight: "500" },
  
  connectButton: { height: 44, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#C7D2FE" },
  connectText: { color: "#4F46E5", fontWeight: "800", fontSize: 13 },

  emptyBox: { alignItems: "center", paddingTop: 60 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 20, color: "#0F172A", fontWeight: "800", marginBottom: 6 },
  emptyText: { color: "#64748B", fontSize: 14, fontWeight: "500", textAlign: "center", maxWidth: 300 },
  clearBtn: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#FEE2E2" },
  clearBtnText: { color: "#EF4444", fontWeight: "800", fontSize: 13 },
});