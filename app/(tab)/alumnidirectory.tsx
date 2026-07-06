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

const API_URL = "http://10.254.25.118:2000/alumni";

// ── Programme groups (same as register) ─────────────────────────────────────
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

// Flat list for mobile Picker (with disabled group headers)
type ProgrammeItem = { label: string; value: string; disabled?: boolean };
const PROGRAMME_FLAT: ProgrammeItem[] = PROGRAMME_GROUPS.flatMap(g => [
  { label: `── ${g.group} ──`, value: `_h_${g.group}`, disabled: true },
  ...g.items,
]);

// ======================================================
// AVATAR HELPERS
// ======================================================
const AVATAR_COLORS = ["#6D28D9","#2563EB","#10B981","#F97316","#EC4899"];
const getAvatarColor = (name = "") => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getInitials = (name = "") =>
  name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

// ======================================================
// FILTER DROPDOWN — with grouped Programme support
// ======================================================
function FilterDropdown({
  label, value, onChange, options, grouped = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  grouped?: boolean;
}) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.dropdownBox}>
        {/* Inject CSS once to fix optgroup color in all selects */}
        {typeof document !== "undefined" && (() => {
          const id = "optgroup-fix-style";
          if (!document.getElementById(id)) {
            const s = document.createElement("style");
            s.id = id;
            s.textContent = `
              .alumni-filter-select option { color: #111 !important; background: #fff !important; }
              .alumni-filter-select optgroup { color: #5B21B6 !important; background: #fff !important; font-weight: 700 !important; font-style: normal !important; }
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
            width: "100%", height: 58, border: "none",
            background: "transparent", paddingLeft: 12,
            fontSize: 14, color: "#fff", outline: "none",
          }}
        >
          <option value="" style={{ color: "#111", background: "#fff" }}>
            {label}
          </option>

          {grouped ? (
            PROGRAMME_GROUPS.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </optgroup>
            ))
          ) : (
            options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))
          )}
        </select>
      </View>
    );
  }

  // ── Mobile ──
  return (
    <View style={styles.dropdownBox}>
      <Picker
        selectedValue={value}
        onValueChange={v => {
          if (grouped && String(v).startsWith("_h_")) return;
          onChange(v);
        }}
        dropdownIconColor="#fff"
        style={{ color: "#fff" }}
      >
        <Picker.Item label={label} value="" />
        {grouped
          ? PROGRAMME_FLAT.map(i => (
              <Picker.Item
                key={i.value}
                label={i.label}
                value={i.value}
                enabled={i.disabled !== true}
                color={i.disabled === true ? "#94A3B8" : "#111"}
              />
            ))
          : options.map(o => (
              <Picker.Item key={o.value} label={o.label} value={o.value} />
            ))
        }
      </Picker>
    </View>
  );
}

// ======================================================
// ALUMNI CARD
// ======================================================
function AlumniCard({ item, onPress, cardWidth }: { item: any; onPress: () => void; cardWidth?: number }) {
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress}
      style={[styles.card, cardWidth ? { width: cardWidth } : null]}>
      <View style={styles.cardTop}>
        <View style={styles.userRow}>
          {item.profile_photo ? (
            <Image
              source={{ uri: `http://10.254.25.118:2000/uploads/${item.profile_photo}` }}
              style={styles.avatarImage} contentFit="cover" />
          ) : (
            <LinearGradient colors={[getAvatarColor(item.full_name), "#8B5CF6"]} style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
            </LinearGradient>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
            <Text style={styles.role}>{item.designation || "Software Engineer"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tagRow}>
        <View style={styles.programTag}><Text style={styles.programText}>{item.programme}</Text></View>
        <View style={styles.batchTag}><Text style={styles.batchText}>{item.batch_year}</Text></View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={15} color="#64748B" />
          <Text style={styles.infoText}>{item.city || "Indore"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="briefcase-outline" size={15} color="#64748B" />
          <Text style={styles.infoText}>{item.organisation || "Infosys"}</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ marginTop: 24 }}>
        <LinearGradient colors={["#5B3DF5", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.connectButton}>
          <Ionicons name="person-outline" size={16} color="#fff" />
          <Text style={styles.connectText}>View Profile</Text>
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
  const [showFilters, setShowFilters] = useState(false);
  const isMobile = width < 700;
  const shouldShowFilters = Platform.OS === "web" ? true : showFilters;

  const GAP          = 18;
  const SIDE_PADDING = isMobile ? 16 : 12;
  const numColumns   = width >= 1300 ? 4 : width >= 1100 ? 3 : width >= 700 ? 2 : 1;
  const totalGap     = GAP * (numColumns - 1);
  const containerWidth = width * 0.94;
  const cardWidth = (containerWidth - SIDE_PADDING * 2 - totalGap) / numColumns;

  const [alumni,     setAlumni]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [programme,  setProgramme]  = useState("");
  const [batchYear,  setBatchYear]  = useState("");
  const [city,       setCity]       = useState("");

  const fetchAlumni = async () => {
    try {
      const res = await axios.get(API_URL, {
        params: { search, programme, batch_year: batchYear, city },
      });
      setAlumni(res.data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAlumni(); }, []);
  useEffect(() => {
    const delay = setTimeout(() => fetchAlumni(), 500);
    return () => clearTimeout(delay);
  }, [search, programme, batchYear, city]);

  const onRefresh = () => { setRefreshing(true); fetchAlumni(); };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#6D28D9" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* HERO */}
      <LinearGradient
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Alumni Directory</Text>
          <Text style={styles.heroSubtitle}>Find and connect with alumni from your network</Text>

          {/* SEARCH */}
          <View style={styles.searchWrapper}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Search alumni..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
              {Platform.OS !== "web" && (
                <TouchableOpacity style={styles.filterToggleBtn} onPress={() => setShowFilters(!showFilters)}>
                  <Ionicons name={showFilters ? "close-outline" : "options-outline"} size={22} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* FILTERS */}
          {shouldShowFilters && (
            <View style={styles.filtersRow}>
              {/* Programme — grouped */}
              <View style={styles.filterItem}>
                <FilterDropdown
                  label="Programme"
                  value={programme}
                  onChange={setProgramme}
                  options={[]}
                  grouped={true}
                />
              </View>

              {/* Batch Year */}
              <View style={styles.filterItem}>
                <FilterDropdown
                  label="Batch"
                  value={batchYear}
                  onChange={setBatchYear}
                  options={Array.from(
                    { length: new Date().getFullYear() - 1989 + 1 },
                    (_, i) => { const y = new Date().getFullYear() - i; return { label: String(y), value: String(y) }; }
                  )}
                />
              </View>

              {/* City */}
              <View style={styles.filterItem}>
                <FilterDropdown
                  label="City"
                  value={city}
                  onChange={setCity}
                  options={[
                    { label: "Indore",    value: "Indore"    },
                    { label: "Delhi",     value: "Delhi"     },
                    { label: "Mumbai",    value: "Mumbai"    },
                    { label: "Bangalore", value: "Bangalore" },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* LIST */}
      <View style={styles.space}>
        <FlatList
          key={numColumns}
          data={alumni}
          numColumns={numColumns}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: SIDE_PADDING,
            paddingBottom: 120,
            paddingTop: 12,
          }}
          columnWrapperStyle={numColumns > 1 ? { justifyContent: "flex-start", marginBottom: GAP } : undefined}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item, index }) => (
            <View style={{ marginRight: (index + 1) % numColumns === 0 ? 0 : GAP, marginBottom: GAP }}>
              <AlumniCard
                item={item}
                cardWidth={cardWidth}
                onPress={() => router.push({ pathname: "/alumniprofile", params: { id: item.id } })}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={70} color="#CBD5E1" />
              <Text style={styles.emptyText}>No alumni found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  loader:    { flex: 1, justifyContent: "center", alignItems: "center" },
  space: {
    flex: 1, width: "94%", alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    marginTop: Platform.OS === "web" ? -160 : -99,
    paddingTop: 18, borderWidth: 1, borderColor: "#EEF2FF",
    shadowColor: "#312EBA", shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 12,
  },
  heroSection: {
    overflow: "hidden",
    paddingTop: Platform.OS === "web" ? 30 : 20,
    paddingBottom: Platform.OS === "web" ? 190 : 120,
    paddingHorizontal: Platform.OS === "web" ? 24 : 16,
  },
  heroContent:   { alignItems: Platform.OS === "web" ? "center" : "flex-start" },
  heroTitle:     { color: "#fff", fontSize: Platform.OS === "web" ? 42 : 30, fontWeight: "800", textAlign: Platform.OS === "web" ? "center" : "left" },
  heroSubtitle:  { color: "rgba(255,255,255,0.82)", fontSize: Platform.OS === "web" ? 16 : 13, marginTop: 8, marginBottom: 24, textAlign: Platform.OS === "web" ? "center" : "left" },
  searchWrapper: { width: "100%", alignItems: "center" },
  searchContainer: {
    width: Platform.OS === "web" ? "78%" : "100%", height: 58,
    backgroundColor: "#fff", borderRadius: 18,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
  },
  searchInput: { flex: 1, marginLeft: 14, color: "#111827", fontSize: 15, outlineStyle: "none" } as any,
  filtersRow: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    width: "100%", justifyContent: "center", alignItems: "center",
    marginTop: 22, gap: 12, paddingHorizontal: 16, flexWrap: "wrap",
  },
  filterItem:      { width: Platform.OS === "web" ? 220 : "100%" },
  filterToggleBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#5B3DF5", justifyContent: "center", alignItems: "center", marginLeft: 10 },
  dropdownBox: {
    height: 48, backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden", justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff", borderRadius: 22, padding: 16,
    borderWidth: 1, borderColor: "#EEF2FF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardTop:     { marginBottom: 18 },
  userRow:     { flexDirection: "row", alignItems: "center" },
  avatar:      { width: Platform.OS === "web" ? 60 : 58, height: Platform.OS === "web" ? 60 : 58, borderRadius: 50, justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarImage: { width: Platform.OS === "web" ? 60 : 58, height: Platform.OS === "web" ? 60 : 58, borderRadius: 50, marginRight: 12 },
  avatarText:  { color: "#fff", fontSize: 20, fontWeight: "800" },
  name:        { fontSize: Platform.OS === "web" ? 20 : 18, fontWeight: "800", color: "#111827" },
  role:        { marginTop: 4, fontSize: 14, color: "#64748B" },
  tagRow:      { flexDirection: "row", gap: 10, marginBottom: 20 },
  programTag:  { backgroundColor: "#F3E8FF", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  batchTag:    { backgroundColor: "#E0F2FE", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  programText: { color: "#6D28D9", fontWeight: "700", fontSize: 12 },
  batchText:   { color: "#0369A1", fontWeight: "700", fontSize: 12 },
  infoSection: { gap: 12 },
  infoRow:     { flexDirection: "row", alignItems: "center" },
  infoText:    { marginLeft: 10, color: "#475569", fontSize: 14 },
  connectButton: { height: 50, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  connectText:   { color: "#fff", marginLeft: 8, fontWeight: "700", fontSize: 14 },
  emptyBox:    { alignItems: "center", marginTop: 120 },
  emptyText:   { marginTop: 12, color: "#64748B", fontSize: 16, fontWeight: "600" },
});