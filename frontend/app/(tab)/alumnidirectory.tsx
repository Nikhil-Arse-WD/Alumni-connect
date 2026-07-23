import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const API_URL = `${API_BASE}/alumni`;
const isWeb = Platform.OS === "web";

// Data Constants
const COURSES = [
  'MBA', 'BBA', 'MCA', 'BCA', 'M.Sc', 'B.Sc CS', 'B.Sc BI', 'B.Sc BT', 'B.Sc MB'
];

const INDUSTRIES = [
  { label: "Information Technology & Services", value: "Information Technology" },
  { label: "Finance, Banking & Insurance", value: "Finance & Banking" },
  { label: "Healthcare & Pharmaceuticals", value: "Healthcare & Pharmaceuticals" },
  { label: "Education & E-Learning", value: "Education" },
  { label: "Manufacturing & Engineering", value: "Manufacturing & Engineering" },
  { label: "Real Estate & Construction", value: "Real Estate & Construction" },
  { label: "Agriculture & Food Production", value: "Agriculture & Food Production" },
  { label: "Retail & E-Commerce", value: "Retail & E-Commerce" },
  { label: "Transportation & Logistics", value: "Transportation & Logistics" },
  { label: "Energy & Utilities", value: "Energy & Utilities" },
  { label: "Media, Entertainment & Tourism", value: "Media & Entertainment" },
  { label: "Government & Public Administration", value: "Government" },
  { label: "Legal & Professional Services", value: "Legal & Professional" },
];

interface Alumni {
  id: string | number;
  full_name?: string;
  designation?: string;
  programme?: string;
  batch_year?: string | number;
  organisation?: string;
  industry?: string;
  profile_photo?: string;
}

export default function AlumniDirectoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchName, setSearchName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");

  // Modal / Dropdown States
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [industryModalVisible, setIndustryModalVisible] = useState(false);

  // Dynamic Spacing & Responsive Grid
  const GAP = isMobile ? 12 : 20;
  const SIDE_PADDING = isMobile ? 16 : 32;
  const numColumns = width >= 1400 ? 4 : width >= 1000 ? 3 : width >= 640 ? 2 : 1;
  const containerWidth = isWeb ? Math.min(width, 1600) : width;
  const cardWidth = (containerWidth - (SIDE_PADDING * 2) - (GAP * (numColumns - 1))) / numColumns;

  const fetchAlumni = async () => {
    try {
      const res = await axios.get(API_URL);
      setAlumni(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, []);

  const handleClearFilters = () => {
    setSearchName("");
    setSelectedCourse("");
    setSelectedIndustry("");
  };

  const hasActiveFilters = Boolean(searchName || selectedCourse || selectedIndustry);

  const filteredAlumni = useMemo(() => {
    const qName = searchName.toLowerCase().trim();

    return alumni.filter((item) => {
      // Name / Role Search Filter
      const matchesName = !qName ||
        item.full_name?.toLowerCase().includes(qName) ||
        item.designation?.toLowerCase().includes(qName) ||
        item.organisation?.toLowerCase().includes(qName);

      // Course Filter
      const matchesCourse = !selectedCourse || item.programme === selectedCourse;

      // Industry Filter
      const matchesIndustry = !selectedIndustry ||
        item.industry?.toLowerCase() === selectedIndustry.toLowerCase();

      return matchesName && matchesCourse && matchesIndustry;
    });
  }, [searchName, selectedCourse, selectedIndustry, alumni]);

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

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
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.heroSection, { paddingHorizontal: SIDE_PADDING }]}
          >
            <View style={styles.heroInner}>
              <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>Alumni Directory</Text>
              <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
                Find, network, and connect with alumni worldwide
              </Text>

              {/* Filters Box */}
              <View style={[styles.controlsCard, isMobile && styles.controlsCardMobile]}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#64748B" />
                  <TextInput
                    placeholder={isMobile ? "Search name, role, company..." : "Search by name, designation, or company..."}
                    style={styles.searchInput}
                    value={searchName}
                    onChangeText={setSearchName}
                  />
                  {searchName ? (
                    <TouchableOpacity onPress={() => setSearchName("")} hitSlop={10}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Dropdowns Row */}
                <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
                  {/* Course Dropdown Button */}
                  <TouchableOpacity
                    style={[
                      styles.dropdownButton,
                      isMobile && styles.dropdownButtonMobile,
                      selectedCourse ? styles.activeDropdown : null,
                    ]}
                    onPress={() => setCourseModalVisible(true)}
                  >
                    <Ionicons name="school-outline" size={16} color={selectedCourse ? "#4F46E5" : "#64748B"} />
                    <Text style={[styles.dropdownText, selectedCourse ? styles.activeDropdownText : null]} numberOfLines={1}>
                      {selectedCourse || "All Courses"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={selectedCourse ? "#4F46E5" : "#64748B"} />
                  </TouchableOpacity>

                  {/* Industry Dropdown Button */}
                  <TouchableOpacity
                    style={[
                      styles.dropdownButton,
                      isMobile && styles.dropdownButtonMobile,
                      selectedIndustry ? styles.activeDropdown : null,
                    ]}
                    onPress={() => setIndustryModalVisible(true)}
                  >
                    <Ionicons name="briefcase-outline" size={16} color={selectedIndustry ? "#4F46E5" : "#64748B"} />
                    <Text style={[styles.dropdownText, selectedIndustry ? styles.activeDropdownText : null]} numberOfLines={1}>
                      {INDUSTRIES.find((i) => i.value === selectedIndustry)?.label || "All Industries"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={selectedIndustry ? "#4F46E5" : "#64748B"} />
                  </TouchableOpacity>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <TouchableOpacity
                      style={[styles.clearButton, isMobile && styles.clearButtonMobile]}
                      onPress={handleClearFilters}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#EC1D8F" />
                      <Text style={styles.clearButtonText}>Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>
        }
        renderItem={({ item, index }) => (
          <View
            style={{
              marginLeft: index % numColumns === 0 ? SIDE_PADDING : GAP,
              marginRight: (index + 1) % numColumns === 0 ? SIDE_PADDING : 0,
              marginBottom: GAP,
            }}
          >
            <View style={[styles.card, { width: cardWidth }]}>
              <View style={styles.userHeader}>
                {item.profile_photo ? (
                  <Image source={{ uri: `${API_BASE}/uploads/${item.profile_photo}` }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.initials}>{item.full_name?.substring(0, 2).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
                  <Text style={styles.role} numberOfLines={1}>{item.designation || "Alumni Member"}</Text>
                </View>
              </View>
              <View style={styles.metaContainer}>
                <Text style={styles.metaText} numberOfLines={1}>
                  <Text style={styles.label}>Course:</Text> {item.programme || "N/A"}
                </Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  <Text style={styles.label}>Batch:</Text> {item.batch_year || "N/A"}
                </Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  <Text style={styles.label}>Industry:</Text> {item.industry || "Not Specified"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => router.push({ pathname: "/alumniprofile", params: { id: item.id } })}
              >
                <Text style={styles.connectText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Course Selection Modal / Popover */}
      <Modal visible={courseModalVisible} transparent animationType={isMobile ? "slide" : "fade"}>
        <Pressable style={styles.modalOverlay} onPress={() => setCourseModalVisible(false)}>
          <View style={[styles.modalContent, isMobile && styles.modalContentMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Course</Text>
              <TouchableOpacity onPress={() => setCourseModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: isMobile ? 400 : 320 }}>
              <TouchableOpacity
                style={[styles.optionItem, !selectedCourse && styles.selectedOption]}
                onPress={() => {
                  setSelectedCourse("");
                  setCourseModalVisible(false);
                }}
              >
                <Text style={!selectedCourse ? styles.selectedOptionText : styles.optionText}>All Courses</Text>
                {!selectedCourse && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
              </TouchableOpacity>
              {COURSES.map((course) => (
                <TouchableOpacity
                  key={course}
                  style={[styles.optionItem, selectedCourse === course && styles.selectedOption]}
                  onPress={() => {
                    setSelectedCourse(course);
                    setCourseModalVisible(false);
                  }}
                >
                  <Text style={selectedCourse === course ? styles.selectedOptionText : styles.optionText}>
                    {course}
                  </Text>
                  {selectedCourse === course && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Industry Selection Modal / Popover */}
      <Modal visible={industryModalVisible} transparent animationType={isMobile ? "slide" : "fade"}>
        <Pressable style={styles.modalOverlay} onPress={() => setIndustryModalVisible(false)}>
          <View style={[styles.modalContent, isMobile && styles.modalContentMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Industry</Text>
              <TouchableOpacity onPress={() => setIndustryModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: isMobile ? 420 : 350 }}>
              <TouchableOpacity
                style={[styles.optionItem, !selectedIndustry && styles.selectedOption]}
                onPress={() => {
                  setSelectedIndustry("");
                  setIndustryModalVisible(false);
                }}
              >
                <Text style={!selectedIndustry ? styles.selectedOptionText : styles.optionText}>All Industries</Text>
                {!selectedIndustry && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
              </TouchableOpacity>
              {INDUSTRIES.map((ind) => (
                <TouchableOpacity
                  key={ind.value}
                  style={[styles.optionItem, selectedIndustry === ind.value && styles.selectedOption]}
                  onPress={() => {
                    setSelectedIndustry(ind.value);
                    setIndustryModalVisible(false);
                  }}
                >
                  <Text style={selectedIndustry === ind.value ? styles.selectedOptionText : styles.optionText}>
                    {ind.label}
                  </Text>
                  {selectedIndustry === ind.value && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Hero Section
  heroSection: { width: "100%", paddingVertical: 36, marginBottom: 20 },
  heroInner: { maxWidth: 1200, alignSelf: "center", width: "100%" },
  heroTitle: { color: "#fff", fontSize: 32, fontWeight: "900", textAlign: "center" },
  heroTitleMobile: { fontSize: 24 },
  heroSubtitle: { color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 6, fontSize: 15 },
  heroSubtitleMobile: { fontSize: 13 },

  // Filter Container
  controlsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 14,
    borderRadius: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  controlsCardMobile: {
    padding: 10,
    borderRadius: 16,
    marginTop: 18,
  },
  searchContainer: {
    backgroundColor: "#fff",
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, outlineStyle: "none" } as any,

  // Responsive Dropdown Controls Row
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    alignItems: "center",
  },
  filterRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  dropdownButton: {
    flex: 1,
    backgroundColor: "#fff",
    height: 44,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  dropdownButtonMobile: {
    flex: 0,
    width: "100%",
    height: 42,
  },
  activeDropdown: {
    borderWidth: 1.5,
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  dropdownText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    flex: 1,
    marginHorizontal: 8,
  },
  activeDropdownText: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  clearButton: {
    backgroundColor: "#fff",
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  clearButtonMobile: {
    height: 40,
    width: "100%",
  },
  clearButtonText: {
    color: "#EC1D8F",
    fontWeight: "700",
    fontSize: 13,
  },

  // Modal / Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalContentMobile: {
    position: "absolute",
    bottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedOption: {
    backgroundColor: "#EEF2FF",
  },
  optionText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
  },
  selectedOptionText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "700",
  },

  // Alumni Cards
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#E2E8F0" },
  userHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center" },
  initials: { color: "#fff", fontWeight: "800", fontSize: 16 },
  name: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  role: { marginTop: 2, fontSize: 12, color: "#64748B" },
  metaContainer: { gap: 6, marginBottom: 14 },
  metaText: { fontSize: 13, color: "#334155" },
  label: { fontWeight: "700", color: "#64748B" },
  connectButton: { padding: 11, backgroundColor: "#EEF2FF", borderRadius: 10, alignItems: "center" },
  connectText: { color: "#4F46E5", fontWeight: "800", fontSize: 13 },
});