import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Linking, Platform,
  RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity,
  useWindowDimensions, View, Modal, ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

const API = "http://10.232.80.175:2000";

// ── FIXED: SafeText Helper prevents "Text string" crash ──
const SafeText = ({ children, style, numberOfLines }: any) => (
  <Text style={style} numberOfLines={numberOfLines}>{children ?? ""}</Text>
);

export default function JobBoardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API}/jobs`);
      setJobs(res.data.jobs || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const filteredJobs = jobs.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.title?.toLowerCase().includes(q) || item.company?.toLowerCase().includes(q);
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
            // ── HEADER ──
            <View style={styles.headerWrapper}>
                <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} style={styles.header}>
                    <SafeText style={styles.heading}>Job Board</SafeText>
                    <SafeText style={styles.subHeading}>Discover alumni opportunities</SafeText>
                    <View style={styles.searchRow}>
                        <TextInput 
                            placeholder="Search jobs..." 
                            style={styles.searchInput} 
                            value={search} 
                            onChangeText={setSearch} 
                        />
                    </View>
                </LinearGradient>
            </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.logoBox}><Ionicons name="business" size={24} color="#4F46E5"/></View>
              <View style={styles.cardInfo}>
                <SafeText style={styles.jobTitle}>{item.title}</SafeText>
                <SafeText style={styles.companyName}>{item.company}</SafeText>
              </View>
            </View>
            <SafeText style={styles.description} numberOfLines={3}>{item.job_description}</SafeText>
            <TouchableOpacity style={styles.applyBtn} onPress={() => Linking.openURL(item.apply_url || `mailto:${item.apply_email}`)}>
              <SafeText style={styles.applyBtnText}>Apply Now</SafeText>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerWrapper: { marginBottom: 20 },
  header: { padding: 24, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  heading: { fontSize: 32, fontWeight: "900", color: "#fff", textAlign: "center" },
  subHeading: { fontSize: 14, color: "#E0E7FF", textAlign: "center", marginTop: 8 },
  searchRow: { backgroundColor: "#fff", marginHorizontal: 20, marginTop: 20, borderRadius: 16, height: 50, paddingHorizontal: 15, flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, fontSize: 14 },
  listContainer: { paddingHorizontal: 16 },
  card: { backgroundColor: "#fff", marginHorizontal: 16, padding: 20, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  logoBox: { width: 50, height: 50, backgroundColor: "#EEF2FF", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardInfo: { marginLeft: 12 },
  jobTitle: { fontSize: 15, fontWeight: "800" },
  companyName: { fontSize: 12, color: "#64748B" },
  description: { fontSize: 13, color: "#475569", marginBottom: 12 },
  applyBtn: { backgroundColor: "#4F46E5", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  applyBtnText: { color: "#fff", fontWeight: "800" }
});