import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, FlatList, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
  useWindowDimensions,
} from "react-native";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const API_URL = `${API_BASE}/alumni`;
const isWeb = Platform.OS === "web";

export default function AlumniDirectoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const GAP = 18;
  const SIDE_PADDING = isMobile ? 16 : 32;
  const numColumns = width >= 1400 ? 4 : width >= 1000 ? 3 : width >= 700 ? 2 : 1;
  const containerWidth = isWeb ? Math.min(width, 1600) : width;
  const cardWidth = (containerWidth - (SIDE_PADDING * 2) - (GAP * (numColumns - 1))) / numColumns;

  const fetchAlumni = async () => {
    try {
      const res = await axios.get(API_URL);
      setAlumni(res.data.data || []);
    } catch (err) { console.log(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlumni(); }, []);

  const filteredAlumni = useMemo(() => {
    const q = search.toLowerCase();
    return alumni.filter(item => 
      !q || item.full_name?.toLowerCase().includes(q) || 
      item.designation?.toLowerCase().includes(q) ||
      item.programme?.toLowerCase().includes(q) ||
      String(item.batch_year)?.includes(q) ||
      item.organisation?.toLowerCase().includes(q) ||
      item.industry?.toLowerCase().includes(q) // Added industry to search
    );
  }, [search, alumni]);

  if (loading) return <View style={styles.loaderWrap}><ActivityIndicator size="large" color="#4F46E5" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        key={numColumns}
        data={filteredAlumni}
        numColumns={numColumns}
        contentContainerStyle={{ paddingBottom: 100 }} 
        ListHeaderComponent={
          <LinearGradient 
            colors={["#312EBA", "#5B21B6", "#EC1D8F"]} 
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} 
            style={styles.heroSection}
          >
            <View style={styles.heroInner}>
              <Text style={styles.heroTitle}>Alumni Directory</Text>
              <Text style={styles.heroSubtitle}>Find, network, and connect with alumni worldwide</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#64748B" />
                <TextInput placeholder="Search by name, course, industry..." style={styles.searchInput} value={search} onChangeText={setSearch} />
              </View>
            </View>
          </LinearGradient>
        }
        renderItem={({ item, index }) => (
          <View style={{ 
            marginLeft: (index % numColumns === 0) ? SIDE_PADDING : GAP, 
            marginRight: ((index + 1) % numColumns === 0) ? SIDE_PADDING : 0,
            marginBottom: GAP 
          }}>
            <View style={[styles.card, { width: cardWidth }]}>
              <View style={styles.userHeader}>
                {item.profile_photo ? (
                  <Image source={{ uri: `${API_BASE}/uploads/${item.profile_photo}` }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}><Text style={styles.initials}>{item.full_name?.substring(0, 2).toUpperCase()}</Text></View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{item.full_name}</Text>
                  <Text style={styles.role}>{item.designation || "Alumni Member"}</Text>
                </View>
              </View>
              <View style={styles.metaContainer}>
                <Text style={styles.metaText}><Text style={styles.label}>Course:</Text> {item.programme || "N/A"}</Text>
                <Text style={styles.metaText}><Text style={styles.label}>Batch:</Text> {item.batch_year || "N/A"}</Text>
                {/* Correctly mapped to item.industry */}
                <Text style={styles.metaText}><Text style={styles.label}>Industry:</Text> {item.industry || "Not Specified"}</Text>
              </View>
              <TouchableOpacity style={styles.connectButton} onPress={() => router.push({ pathname: "/alumniprofile", params: { id: item.id } })}>
                <Text style={styles.connectText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  heroSection: { width: '100%', paddingVertical: 40, paddingHorizontal: 20, marginBottom: 20 },
  heroInner: { maxWidth: 1200, alignSelf: 'center', width: '100%' },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "900", textAlign: "center" },
  heroSubtitle: { color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 8 },
  searchContainer: { backgroundColor: "#fff", height: 50, borderRadius: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 15, marginTop: 20 },
  searchInput: { flex: 1, marginLeft: 10, outlineStyle: "none" } as any,
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  userHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center" },
  initials: { color: "#fff", fontWeight: "800" },
  name: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  role: { marginTop: 2, fontSize: 13, color: "#64748B" },
  metaContainer: { gap: 6, marginBottom: 15 },
  metaText: { fontSize: 13, color: "#334155" },
  label: { fontWeight: "700", color: "#64748B" },
  connectButton: { padding: 12, backgroundColor: "#EEF2FF", borderRadius: 12, alignItems: "center" },
  connectText: { color: "#4F46E5", fontWeight: "800", fontSize: 13 }
});