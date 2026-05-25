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
} from "react-native";

import Header from "../components/Header";

const API_URL = "http://192.168.29.217:2000/alumni";

// =============================================
// FILTER DROPDOWN — web: <select>, mobile: Picker
// =============================================
function FilterDropdown({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.dropdownBox}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            height: 48,
            border: "none",
            background: "transparent",
            fontSize: 14,
            color: value ? "#0f172a" : "#64748b",
            paddingLeft: 12,
            paddingRight: 8,
            cursor: "pointer",
            outline: "none",
            appearance: "auto",
          }}
        >
          <option value="">{label}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </View>
    );
  }

  // Mobile — original Picker
  return (
    <View style={styles.dropdownBox}>
      <Picker
        selectedValue={value}
        style={styles.picker}
        onValueChange={onChange}
      >
        <Picker.Item label={label} value="" />
        {options.map((o) => (
          <Picker.Item key={o.value} label={o.label} value={o.value} />
        ))}
      </Picker>
    </View>
  );
}

// =============================================
// MAIN SCREEN
// =============================================
export default function AlumniDirectoryScreen() {
  const router = useRouter();

  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch]       = useState("");
  const [programme, setProgramme] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [city, setCity]           = useState("");

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
    const delay = setTimeout(() => { fetchAlumni(); }, 500);
    return () => clearTimeout(delay);
  }, [search, programme, batchYear, city]);

  const onRefresh = () => { setRefreshing(true); fetchAlumni(); };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      {/* TOP SECTION */}
      <LinearGradient
        colors={["#0f172a", "#1e3a8a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topSection}
      >
        <Text style={styles.heading}>Alumni Directory</Text>
        <Text style={styles.subHeading}>Connect with alumni network</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            placeholder="Search alumni..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* FILTERS */}
      <View style={styles.filterContainer}>
        <FilterDropdown
          label="Programme"
          value={programme}
          onChange={setProgramme}
          options={[
            { label: "BCA", value: "BCA" },
            { label: "MCA", value: "MCA" },
            { label: "MBA", value: "MBA" },
            { label: "BBA", value: "BBA" },
          ]}
        />
        <FilterDropdown
          label="Batch"
          value={batchYear}
          onChange={setBatchYear}
          options={Array.from(
            { length: new Date().getFullYear() - 1989 + 1 },
            (_, i) => {
              const y = new Date().getFullYear() - i;
              return { label: String(y), value: String(y) };
            }
          )}
        />
        <FilterDropdown
          label="City"
          value={city}
          onChange={setCity}
          options={[
            { label: "Indore", value: "Indore" },
            { label: "Bhopal", value: "Bhopal" },
            { label: "Delhi", value: "Delhi" },
            { label: "Mumbai", value: "Mumbai" },
            { label: "Bengaluru", value: "Bengaluru" },
          ]}
        />
      </View>

      {/* ACTIVE FILTER CHIPS */}
      {(programme || batchYear || city) && (
        <View style={styles.chipRow}>
          {programme && (
            <TouchableOpacity style={styles.activeChip} onPress={() => setProgramme("")}>
              <Text style={styles.activeChipText}>{programme}</Text>
              <Ionicons name="close" size={12} color="#1d4ed8" />
            </TouchableOpacity>
          )}
          {batchYear && (
            <TouchableOpacity style={styles.activeChip} onPress={() => setBatchYear("")}>
              <Text style={styles.activeChipText}>{batchYear}</Text>
              <Ionicons name="close" size={12} color="#1d4ed8" />
            </TouchableOpacity>
          )}
          {city && (
            <TouchableOpacity style={styles.activeChip} onPress={() => setCity("")}>
              <Text style={styles.activeChipText}>{city}</Text>
              <Ionicons name="close" size={12} color="#1d4ed8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => { setProgramme(""); setBatchYear(""); setCity(""); }}
          >
            <Text style={styles.clearAll}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LIST */}
      <FlatList
        data={alumni}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => router.push({ pathname: "/alumniprofile", params: { id: item.id } })}
          >
            {/* IMAGE */}
            <View style={styles.imageBox}>
              {item.profile_photo ? (
                <Image
                  source={{ uri: `http://192.168.29.217:2000/uploads/${item.profile_photo}` }}
                  style={styles.profileImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{item.full_name?.charAt(0)}</Text>
              )}
            </View>

            {/* INFO */}
            <View style={styles.info}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.role}>{item.designation || "Alumni"}</Text>

              <View style={styles.tagRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>🎓 {item.programme}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>📅 {item.batch_year}</Text>
                </View>
              </View>

              <Text style={styles.meta}>📍 {item.city}</Text>
              {item.organisation && (
                <Text style={styles.meta}>🏢 {item.organisation}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={70} color="#cbd5e1" />
            <Text style={styles.emptyText}>No alumni found</Text>
          </View>
        }
      />
    </View>
  );
}

// =============================================
// STYLES
// =============================================
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f1f5f9" },
  loader:     { flex: 1, justifyContent: "center", alignItems: "center" },

  topSection: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopWidth: 3,
    borderTopColor: "#f59e0b",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  heading:    { fontSize: 30, fontWeight: "800", color: "#fff" },
  subHeading: { fontSize: 15, color: "#cbd5e1", marginTop: 5, marginBottom: 20 },

  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 56,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#111" },

  // ── Filters ──
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 14,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },

  dropdownBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#dbeafe",
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  picker: { height: 54, width: "100%", color: "#0f172a" },

  // ── Active chips ──
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  activeChipText: { fontSize: 12, color: "#1d4ed8", fontWeight: "700" },
  clearAll:       { fontSize: 12, color: "#ef4444", fontWeight: "700" },

  // ── List ──
  listContainer: { paddingHorizontal: 14, paddingBottom: 100 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    elevation: 3,
  },

  imageBox: {
    width: 85, height: 85, borderRadius: 42.5,
    backgroundColor: "#2563eb",
    justifyContent: "center", alignItems: "center",
    overflow: "hidden",
  },
  profileImage: { width: 85, height: 85, borderRadius: 42.5 },
  avatarText:   { color: "#fff", fontSize: 30, fontWeight: "700" },

  info:   { flex: 1, marginLeft: 16, justifyContent: "center" },
  name:   { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 5 },
  role:   { fontSize: 14, color: "#2563eb", fontWeight: "600", marginBottom: 10 },
  meta:   { fontSize: 13, color: "#64748b", marginBottom: 4 },

  tagRow: { flexDirection: "row", marginBottom: 8 },
  tag:    { backgroundColor: "#dbeafe", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginRight: 8 },
  tagText:{ fontSize: 11, color: "#1d4ed8", fontWeight: "600" },

  emptyBox:  { alignItems: "center", marginTop: 120 },
  emptyText: { marginTop: 12, color: "#64748b", fontSize: 16, fontWeight: "600" },
});