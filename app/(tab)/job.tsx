import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const API_URL = process.env.EXPO_PUBLIC_API_BASE;
const isWeb = Platform.OS === "web";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserType {
  id: number;
  full_name: string;
  email: string;
  profile_photo?: string;
  role?: string;
}

interface JobType {
  id: number;
  title: string;
  company: string;
  location: string;
  experience_range: string;
  function_name?: string;
  skills: string;
  job_description: string;
  apply_email: string;
  apply_url?: string;
  expires_on: string;
  posted_by_name: string;
  posted_by_user_id?: number;
  posted_by_photo?: string;
  created_at?: string;
  is_closed?: boolean;
}

// ─── Filter & Form Constants ─────────────────────────────────────────────────
const LOCATIONS = [
  "Mumbai", "Bangalore", "Hyderabad", "Pune", "Delhi", "Indore", "Remote",
];
const EXPERIENCES = [
  "0-1 Years", "1-3 Years", "3-6 Years", "6+ Years",
];
const FUNCTIONS = [
  "Engineering", "Design", "Product", "Data", "Marketing", "Finance", "Operations",
];

const CompanyLogo = ({ size = 50, radius = 14 }: { size?: number; radius?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      backgroundColor: "#EEF2FF",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Ionicons name="business-outline" size={26} color="#4F46E5" />
  </View>
);

const FilterPill = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function JobBoardScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  // ── Filter States
  const [filterLoc, setFilterLoc] = useState("All");
  const [filterExp, setFilterExp] = useState("All");
  const [filterFn, setFilterFn] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // ── Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);

  // ── Form Fields
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobLocation, setJobLocation] = useState("Mumbai");
  const [customLocation, setCustomLocation] = useState("");
  const [experienceRange, setExperienceRange] = useState("1-3 Years");
  const [functionName, setFunctionName] = useState("Engineering");
  const [skills, setSkills] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [expiresOn, setExpiresOn] = useState("");

  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.06, { duration: 900 }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    loadUser();
    fetchJobs();
  }, []);

  const loadUser = async () => {
    const data = await AsyncStorage.getItem("user");
    if (data) setUser(JSON.parse(data));
  };

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs`);
      const data = res.data?.jobs || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setJobs(data);
    } catch (err) {
      console.log("Error fetching jobs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const isOwner = (job: JobType) => !!user && job.posted_by_user_id === user.id;
  const isNew = (dateStr?: string) =>
    !!dateStr && Date.now() - new Date(dateStr).getTime() < 3 * 24 * 60 * 60 * 1000;
  const isExpired = (dateStr?: string) => !!dateStr && new Date(dateStr) < new Date();

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => !j.is_closed && !isExpired(j.expires_on)).length;
  const today = new Date().toDateString();
  const newToday = jobs.filter(
    (j) => j.created_at && new Date(j.created_at).toDateString() === today
  ).length;

  // ── FILTERING LOGIC ──────────────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    const cleanSearch = search.toLowerCase().trim();
    const searchTerms = cleanSearch ? cleanSearch.split(/\s+/) : [];

    return jobs.filter((item) => {
      if (!item) return false;

      const searchableContent = [
        item.title,
        item.company,
        item.skills,
        item.location,
        item.function_name,
        item.job_description,
        item.posted_by_name,
        item.experience_range,
      ]
        .map((val) => String(val || "").toLowerCase())
        .join(" ");

      const matchSearch =
        searchTerms.length === 0 ||
        searchTerms.every((term) => searchableContent.includes(term));

      const matchLoc =
        filterLoc === "All" ||
        String(item.location || "").toLowerCase().includes(filterLoc.toLowerCase());

      const matchExp =
        filterExp === "All" ||
        String(item.experience_range || "").toLowerCase().includes(filterExp.toLowerCase());

      const matchFn =
        filterFn === "All" ||
        String(item.function_name || "").toLowerCase().includes(filterFn.toLowerCase());

      return matchSearch && matchLoc && matchExp && matchFn;
    });
  }, [search, filterLoc, filterExp, filterFn, jobs]);

  const activeFiltersCount = [filterLoc, filterExp, filterFn].filter((f) => f !== "All").length;

  const handleResetFilters = () => {
    setFilterLoc("All");
    setFilterExp("All");
    setFilterFn("All");
    setSearch("");
  };

  // Modal Handlers
  const openCreateModal = () => {
    setEditingJob(null);
    setTitle("");
    setCompany("");
    setJobLocation("Mumbai");
    setCustomLocation("");
    setExperienceRange("1-3 Years");
    setFunctionName("Engineering");
    setSkills("");
    setJobDescription("");
    setApplyEmail("");
    setApplyUrl("");
    setExpiresOn("");
    setShowModal(true);
  };

  const openEditModal = (job: JobType) => {
    setEditingJob(job);
    setTitle(job.title);
    setCompany(job.company);
    
    // Check if location exists in standard options
    if (LOCATIONS.includes(job.location)) {
      setJobLocation(job.location);
      setCustomLocation("");
    } else {
      setJobLocation("Other");
      setCustomLocation(job.location);
    }

    setExperienceRange(job.experience_range || "1-3 Years");
    setFunctionName(job.function_name || "Engineering");
    setSkills(job.skills || "");
    setJobDescription(job.job_description || "");
    setApplyEmail(job.apply_email || "");
    setApplyUrl(job.apply_url || "");
    setExpiresOn(job.expires_on || "");
    setShowModal(true);
  };

  const submitJob = async () => {
    const finalLocation = jobLocation === "Other" ? customLocation.trim() : jobLocation;

    if (!title || !company || !finalLocation || !jobDescription) {
      const msg = "Please fill all required fields";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Validation", msg);
      return;
    }

    if (!user) {
      const msg = "User session not found";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Error", msg);
      return;
    }

    const payload = {
      title,
      company,
      location: finalLocation,
      experience_range: experienceRange,
      function_name: functionName || "General",
      skills,
      job_description: jobDescription,
      apply_email: applyEmail,
      apply_url: applyUrl,
      expires_on: expiresOn
        ? new Date(expiresOn).toISOString().split("T")[0]
        : "2026-12-31",
      posted_by_user_id: user.id,
    };

    try {
      if (editingJob) {
        await axios.put(`${API_URL}/jobs/${editingJob.id}`, payload);
        const msg = "Job updated successfully ✅";
        Platform.OS === "web" ? window.alert(msg) : Alert.alert("Success ✅", msg);
      } else {
        await axios.post(`${API_URL}/jobs/create`, payload);
        const msg = "Job posted successfully ✅";
        Platform.OS === "web" ? window.alert(msg) : Alert.alert("Success ✅", msg);
      }
      setShowModal(false);
      fetchJobs();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to save job";
      Platform.OS === "web" ? window.alert(errMsg) : Alert.alert("Error ❌", errMsg);
    }
  };

  const closeJob = async (job: JobType) => {
    const confirmed =
      Platform.OS === "web" ? window.confirm("Mark position as filled?") : true;
    if (!confirmed) return;

    try {
      await axios.patch(`${API_URL}/jobs/${job.id}/close`);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_closed: true } : j))
      );
      fetchJobs();
    } catch (error) {
      const errMsg = "Failed to close position";
      Platform.OS === "web" ? window.alert(errMsg) : Alert.alert("Error ❌", errMsg);
    }
  };

  const handleApply = async (item: JobType) => {
    try {
      if (item.apply_url) await Linking.openURL(item.apply_url);
      else if (item.apply_email) await Linking.openURL(`mailto:${item.apply_email}`);
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* HERO BANNER */}
            <LinearGradient
              colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.header, isMobile && styles.headerMobile]}
            >
              <View style={styles.topHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heading, isMobile && styles.headingMobile]}>
                    Job Board
                  </Text>
                  <Text style={styles.subHeading}>Discover alumni opportunities</Text>
                </View>
                <Animated.View style={animatedStyle}>
                  <TouchableOpacity style={styles.postMiniBtn} onPress={openCreateModal}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.postMiniText}>Post Job</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* STATS */}
              <View style={styles.statsRow}>
                {[
                  { n: totalJobs, l: "Total" },
                  { n: activeJobs, l: "Active" },
                  { n: newToday, l: "New Today" },
                ].map((s, i) => (
                  <View key={i} style={styles.statBox}>
                    <Text style={styles.statNum}>{s.n}</Text>
                    <Text style={styles.statLbl}>{s.l}</Text>
                  </View>
                ))}
              </View>

              {/* SEARCH & FILTER CONTROLS */}
              <View style={styles.searchRow}>
                <View
                  style={[
                    styles.searchBox,
                    searchFocused && { borderWidth: 2, borderColor: "#818cf8" },
                  ]}
                >
                  <Ionicons name="search" size={20} color="#64748B" />
                  <TextInput
                    placeholder="Search jobs, companies, skills..."
                    placeholderTextColor="#94A3B8"
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
                      <Ionicons name="close" size={16} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.filterToggleBtn,
                    activeFiltersCount > 0 && styles.filterToggleBtnActive,
                  ]}
                  onPress={() => setShowFilters((v) => !v)}
                >
                  <Ionicons
                    name="options-outline"
                    size={22}
                    color={activeFiltersCount > 0 ? "#4F46E5" : "#64748B"}
                  />
                  {activeFiltersCount > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* EXPANDABLE FILTERS PANEL */}
            {showFilters && (
              <View style={styles.filtersPanel}>
                <View style={styles.filtersPanelHeader}>
                  <Text style={styles.filtersPanelTitle}>Filters</Text>
                  {(activeFiltersCount > 0 || search) && (
                    <TouchableOpacity onPress={handleResetFilters}>
                      <Text style={styles.clearFiltersText}>Clear all</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.filterLabel}>Location</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {["All", ...LOCATIONS].map((l) => (
                    <FilterPill
                      key={l}
                      label={l}
                      active={filterLoc === l}
                      onPress={() => setFilterLoc(l)}
                    />
                  ))}
                </ScrollView>

                <Text style={styles.filterLabel}>Experience</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {["All", ...EXPERIENCES].map((e) => (
                    <FilterPill
                      key={e}
                      label={e}
                      active={filterExp === e}
                      onPress={() => setFilterExp(e)}
                    />
                  ))}
                </ScrollView>

                <Text style={styles.filterLabel}>Function</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                  {["All", ...FUNCTIONS].map((f) => (
                    <FilterPill
                      key={f}
                      label={f}
                      active={filterFn === f}
                      onPress={() => setFilterFn(f)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {filteredJobs.length > 0 && (
              <Text style={styles.resultCount}>
                {filteredJobs.length} listing{filteredJobs.length !== 1 ? "s" : ""} found
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Ionicons name="briefcase-outline" size={64} color="#CBD5E1" />
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 16 }}>
              No jobs match your criteria
            </Text>
            {(activeFiltersCount > 0 || search) && (
              <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleResetFilters}>
                <Text style={styles.clearFiltersBtnText}>Reset all filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (!item) return null;
          const mine = isOwner(item);
          const expired = isExpired(item.expires_on);
          const closed = item.is_closed;

          return (
            <View style={[styles.card, (closed || expired) ? styles.cardClosed : null]}>
              {(closed || expired) && (
                <View style={styles.closedBanner}>
                  <Ionicons name="lock-closed" size={11} color="#64748B" />
                  <Text style={styles.closedText}>
                    {closed ? "Position filled" : "Expired"}
                  </Text>
                </View>
              )}

              <View style={styles.companyRow}>
                <CompanyLogo size={50} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.jobTitle}>{item.title}</Text>
                  <Text style={styles.company} numberOfLines={1}>
                    {item.company || "Unknown Company"}
                  </Text>
                  {isNew(item.created_at) && !closed && !expired && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>🟢 New</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.infoChipsRow}>
                <View style={styles.infoChip}>
                  <Ionicons name="location-outline" size={13} color="#4F46E5" />
                  <Text style={styles.infoChipText}>{item.location}</Text>
                </View>
                <View style={styles.infoChip}>
                  <Ionicons name="briefcase-outline" size={13} color="#4F46E5" />
                  <Text style={styles.infoChipText}>{item.experience_range}</Text>
                </View>
                {item.function_name ? (
                  <View style={styles.infoChip}>
                    <Ionicons name="layers-outline" size={13} color="#4F46E5" />
                    <Text style={styles.infoChipText}>{item.function_name}</Text>
                  </View>
                ) : null}
              </View>

              {item.skills ? (
                <View style={styles.skillRow}>
                  {item.skills.split(",").slice(0, 4).map((skill, i) => (
                    <View key={i} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill.trim()}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <Text style={styles.description} numberOfLines={3}>
                {item.job_description}
              </Text>

              {mine && (
                <View style={styles.ownerActions}>
                  <TouchableOpacity style={styles.ownerBtn} onPress={() => openEditModal(item)}>
                    <Ionicons name="create-outline" size={15} color="#4F46E5" />
                    <Text style={styles.ownerBtnText}>Edit</Text>
                  </TouchableOpacity>
                  {!closed && (
                    <TouchableOpacity
                      style={[styles.ownerBtn, styles.ownerBtnDanger]}
                      onPress={() => closeJob(item)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={15} color="#EF4444" />
                      <Text style={[styles.ownerBtnText, { color: "#EF4444" }]}>
                        Mark Filled
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.cardFooter}>
                <View style={styles.userRow}>
                  <Image
                    source={{
                      uri: item.posted_by_photo
                        ? `${API_URL}/uploads/${item.posted_by_photo}`
                        : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                    }}
                    style={styles.userImage}
                  />
                  <View>
                    <Text style={styles.postedBy}>{item.posted_by_name || "Alumni Member"}</Text>
                    <Text style={styles.expire}>Expires {formatDateTime(item.expires_on)}</Text>
                  </View>
                </View>
                {!closed && !expired && (
                  <TouchableOpacity style={styles.applyBtn} onPress={() => handleApply(item)}>
                    <Text style={styles.applyText}>Apply Now</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* CREATE / EDIT MODAL (RESPONSIVE PC & MOBILE) */}
      <Modal visible={showModal} transparent animationType={isMobile ? "slide" : "fade"}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isMobile && styles.modalCardMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingJob ? "Edit Job Listing" : "Post a New Job"}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {/* BASIC INFO SECTION */}
              <Text style={styles.sectionLabel}>BASIC INFO</Text>
              <View style={!isMobile && styles.formGridRow}>
                <View style={!isMobile && styles.formGridCol}>
                  <Text style={styles.inputFieldLabel}>Job Title *</Text>
                  <TextInput
                    placeholder="e.g. Senior Frontend Engineer"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
                <View style={!isMobile && styles.formGridCol}>
                  <Text style={styles.inputFieldLabel}>Company Name *</Text>
                  <TextInput
                    placeholder="e.g. Google, TechCorp"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={company}
                    onChangeText={setCompany}
                  />
                </View>
              </View>

              {/* CLASSIFICATION SELECTORS */}
              <Text style={styles.sectionLabel}>JOB CATEGORIZATION</Text>

              {/* Location Choice */}
              <Text style={styles.inputFieldLabel}>Location *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {[...LOCATIONS, "Other"].map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.selectorChip, jobLocation === loc && styles.selectorChipActive]}
                    onPress={() => setJobLocation(loc)}
                  >
                    <Text style={[styles.selectorChipText, jobLocation === loc && styles.selectorChipTextActive]}>
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {jobLocation === "Other" && (
                <TextInput
                  placeholder="Type custom location (e.g. Chennai, Hybrid)"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                  value={customLocation}
                  onChangeText={setCustomLocation}
                />
              )}

              {/* Experience Choice */}
              <Text style={styles.inputFieldLabel}>Experience Range *</Text>
              <View style={styles.selectorGrid}>
                {EXPERIENCES.map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    style={[styles.selectorChip, experienceRange === exp && styles.selectorChipActive]}
                    onPress={() => setExperienceRange(exp)}
                  >
                    <Text style={[styles.selectorChipText, experienceRange === exp && styles.selectorChipTextActive]}>
                      {exp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Function Choice */}
              <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>Department / Function *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {FUNCTIONS.map((fn) => (
                  <TouchableOpacity
                    key={fn}
                    style={[styles.selectorChip, functionName === fn && styles.selectorChipActive]}
                    onPress={() => setFunctionName(fn)}
                  >
                    <Text style={[styles.selectorChipText, functionName === fn && styles.selectorChipTextActive]}>
                      {fn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* DETAILS & APPLICATION */}
              <Text style={styles.sectionLabel}>DETAILS & APPLICATION</Text>

              <Text style={styles.inputFieldLabel}>Skills (comma separated)</Text>
              <TextInput
                placeholder="e.g. React Native, TypeScript, Node.js"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={skills}
                onChangeText={setSkills}
              />

              <Text style={styles.inputFieldLabel}>Job Description *</Text>
              <TextInput
                placeholder="Detailed job responsibilities, qualifications..."
                placeholderTextColor="#94A3B8"
                multiline
                style={styles.textArea}
                value={jobDescription}
                onChangeText={setJobDescription}
              />

              <View style={!isMobile && styles.formGridRow}>
                <View style={!isMobile && styles.formGridCol}>
                  <Text style={styles.inputFieldLabel}>Apply Email</Text>
                  <TextInput
                    placeholder="careers@company.com"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={applyEmail}
                    onChangeText={setApplyEmail}
                  />
                </View>
                <View style={!isMobile && styles.formGridCol}>
                  <Text style={styles.inputFieldLabel}>Apply URL</Text>
                  <TextInput
                    placeholder="https://company.com/jobs/apply"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                    value={applyUrl}
                    onChangeText={setApplyUrl}
                  />
                </View>
              </View>

              <Text style={styles.inputFieldLabel}>Expiry Date (YYYY-MM-DD)</Text>
              <TextInput
                placeholder="2026-12-31"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={expiresOn}
                onChangeText={setExpiresOn}
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitJob}>
                <Text style={styles.submitBtnText}>{editingJob ? "Update Job" : "Post Job"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { paddingHorizontal: 32, paddingTop: 24, paddingBottom: 28 },
  headerMobile: { paddingHorizontal: 16 },
  topHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heading: { color: "#fff", fontSize: 36, fontWeight: "900" },
  headingMobile: { fontSize: 26 },
  subHeading: { color: "#CBD5E1", marginTop: 4, marginBottom: 16, fontSize: 14 },

  postMiniBtn: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#818CF8",
  },
  postMiniText: { color: "#fff", fontWeight: "800", marginLeft: 6, fontSize: 14 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  statNum: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLbl: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },

  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchBox: {
    flex: 1,
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: "#0F172A", outlineStyle: "none" } as any,
  clearBtn: { padding: 4 },

  filterToggleBtn: {
    width: 52,
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  filterToggleBtnActive: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1.5,
    borderColor: "#818CF8",
  },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    backgroundColor: "#4F46E5",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  filtersPanel: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filtersPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  filtersPanelTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  clearFiltersText: { fontSize: 13, color: "#4F46E5", fontWeight: "700" },
  filterLabel: { fontSize: 12, fontWeight: "700", color: "#94A3B8", marginBottom: 6, marginTop: 8 },
  pillScroll: { marginBottom: 4 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterPillActive: { backgroundColor: "#EEF2FF", borderColor: "#818CF8" },
  filterPillText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterPillTextActive: { color: "#4F46E5", fontWeight: "700" },

  resultCount: { fontSize: 13, color: "#64748B", fontWeight: "600", marginHorizontal: 20, marginTop: 14 },
  clearFiltersBtn: { marginTop: 16, backgroundColor: "#EEF2FF", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  clearFiltersBtnText: { color: "#4F46E5", fontWeight: "700", fontSize: 14 },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: Platform.OS === "web" ? 32 : 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardClosed: { opacity: 0.65 },
  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  closedText: { fontSize: 11, fontWeight: "700", color: "#64748B" },

  companyRow: { flexDirection: "row", alignItems: "flex-start" },
  jobTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  company: { marginTop: 2, color: "#64748B", fontSize: 13 },
  newBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  newBadgeText: { color: "#16A34A", fontSize: 11, fontWeight: "700" },

  infoChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  infoChipText: { fontSize: 12, color: "#4F46E5", fontWeight: "600" },

  skillRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 6 },
  skillChip: { backgroundColor: "#EDE9FE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  skillText: { color: "#6D28D9", fontWeight: "700", fontSize: 12 },

  description: { marginTop: 12, color: "#475569", lineHeight: 20, fontSize: 13 },

  ownerActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  ownerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ownerBtnDanger: { backgroundColor: "#FEF2F2" },
  ownerBtnText: { fontSize: 12, fontWeight: "700", color: "#4F46E5" },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  userRow: { flexDirection: "row", alignItems: "center" },
  userImage: { width: 34, height: 34, borderRadius: 17, marginRight: 8 },
  postedBy: { color: "#334155", fontWeight: "700", fontSize: 13 },
  expire: { color: "#EF4444", marginTop: 1, fontSize: 11 },
  applyBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  applyText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // RESPONSIVE MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 720,
    maxHeight: "90%",
    borderRadius: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    overflow: "hidden",
  },
  modalCardMobile: {
    maxWidth: "100%",
    maxHeight: "100%",
    borderRadius: 0,
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  modalScroll: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },

  formGridRow: {
    flexDirection: "row",
    gap: 16,
  },
  formGridCol: {
    flex: 1,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 16,
  },
  inputFieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 14,
    color: "#0F172A",
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    fontSize: 14,
    color: "#0F172A",
  },

  // SELECTOR CHIPS FOR FORM
  selectorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginRight: 6,
  },
  selectorChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  selectorChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  selectorChipTextActive: {
    color: "#4F46E5",
    fontWeight: "800",
  },

  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelBtnText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});