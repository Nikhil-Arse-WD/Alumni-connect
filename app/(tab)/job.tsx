import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";


const API_URL = "http://10.232.80.175:2000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserType {
  id: number;
  full_name: string;
  email: string;
  profile_photo?: string;
  role?: string; // "admin" | "user"
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

// ─── Clearbit auto logo ───────────────────────────────────────────────────────


// ─── Company Logo with building icon fallback ─────────────────────────────────
const CompanyLogo = ({
  size = 56,
  radius = 14,
}: {
  size?: number;
  radius?: number;
}) => {
  return (
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
      <Ionicons
        name="business-outline"
        size={28}
        color="#4F46E5"
      />
    </View>
  );
};

// ─── Filter options ───────────────────────────────────────────────────────────
const LOCATIONS = [
  "All", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Delhi", "Indore", "Remote",
];
const EXPERIENCES = [
  "All", "0-1 Years", "1-3 Years", "3-6 Years", "6+ Years",
];
const FUNCTIONS = [
  "All", "Engineering", "Design", "Product", "Data", "Marketing", "Finance", "Operations",
];

// ─── Filter Pill ──────────────────────────────────────────────────────────────
const FilterPill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function JobBoardScreen() {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);

  // ── filters
  const [filterLoc, setFilterLoc] = useState("All");
  const [filterExp, setFilterExp] = useState("All");
  const [filterFn, setFilterFn] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // ── modal
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);

  // ── form fields
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [experienceRange, setExperienceRange] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [skills, setSkills] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [expiresOn, setExpiresOn] = useState("");

  // ── logo preview (only in modal — not saved to DB)
  const [previewLogoUrl, setPreviewLogoUrl] = useState("");
  const [logoValid, setLogoValid] = useState<boolean | null>(null);

  // ── animation
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.08, { duration: 900 }), -1, true);
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    loadUser();
    fetchJobs();
  }, []);

  // logo preview when company name typed in form
  
  const loadUser = async () => {
    const data = await AsyncStorage.getItem("user");
    if (data) setUser(JSON.parse(data));
  };

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs`);
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  // ── helpers
  const isOwner = (job: JobType) =>
  !!user && job.posted_by_user_id === user.id;
  const isNew = (dateStr?: string) =>
    !!dateStr && Date.now() - new Date(dateStr).getTime() < 3 * 24 * 60 * 60 * 1000;

  const isExpired = (dateStr?: string) =>
    !!dateStr && new Date(dateStr) < new Date();

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ── stats
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(
    (j) => !j.is_closed && !isExpired(j.expires_on)
  ).length;

  const today = new Date().toDateString();
  const newToday = jobs.filter(
    (j) => j.created_at && new Date(j.created_at).toDateString() === today
  ).length;

  // ── filtered list
  const filteredJobs = jobs.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.company?.toLowerCase().includes(q) ||
      item.skills?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q);
    const matchLoc = filterLoc === "All" || item.location === filterLoc;
    const matchExp = filterExp === "All" || item.experience_range === filterExp;
    const matchFn = filterFn === "All" || item.function_name === filterFn;
    return matchSearch && matchLoc && matchExp && matchFn;
  });

  const activeFiltersCount = [filterLoc, filterExp, filterFn].filter(
    (f) => f !== "All"
  ).length;

  // ── open modal
  const openCreateModal = () => {
    setEditingJob(null);
    setTitle("");
    setCompany("");
    setJobLocation("");
    setExperienceRange("");
    setFunctionName("");
    setSkills("");
    setJobDescription("");
    setApplyEmail("");
    setApplyUrl("");
    setExpiresOn("");
    setPreviewLogoUrl("");
    setLogoValid(null);
    setShowModal(true);
  };

  const openEditModal = (job: JobType) => {
    setEditingJob(job);
    setTitle(job.title);
    setCompany(job.company);
    setJobLocation(job.location);
    setExperienceRange(job.experience_range);
    setFunctionName(job.function_name || "");
    setSkills(job.skills);
    setJobDescription(job.job_description);
    setApplyEmail(job.apply_email || "");
    setApplyUrl(job.apply_url || "");
    setExpiresOn(job.expires_on || "");
    // logo preview from Clearbit using company name
 
    setLogoValid(null);
    setShowModal(true);
  };

  // ── submit (create / edit)
  // FIX: company_logo, posted_by_name, posted_by_photo removed from payload
  // DB mein ye columns nahi hain — JOIN se aata hai
  const submitJob = async () => {
    if (!title || !company || !jobLocation || !jobDescription) {
      if (Platform.OS === "web") {
        window.alert("Please fill all required fields");
      } else {
        Alert.alert("Validation", "Please fill all required fields");
      }
      return;
    }
  
    if (!user) {
      if (Platform.OS === "web") {
        window.alert("User not found");
      } else {
        Alert.alert("Error", "User not found");
      }
      return;
    }
  
    const payload = {
      title,
      company,
      location: jobLocation,
      experience_range: experienceRange,
      function_name: functionName || "General",
      skills,
      job_description: jobDescription,
      apply_email: applyEmail,
      apply_url: applyUrl,
      expires_on: expiresOn
      ? new Date(expiresOn)
          .toISOString()
          .split("T")[0]
      : "2026-12-31",
      posted_by_user_id: user.id,
    };
  
    try {
        if (editingJob) {
      
          const res = await axios.put(
            `${API_URL}/jobs/${editingJob.id}`,
            payload
          );
      
          console.log("UPDATE RESPONSE:", res.data);
      
          if (Platform.OS === "web") {
            window.alert("Job updated successfully ✅");
          } else {
            Alert.alert(
              "Success ✅",
              "Job updated successfully"
            );
          }
      
        } else {
      
          const res = await axios.post(
            `${API_URL}/jobs/create`,
            payload
          );
      
          console.log("CREATE RESPONSE:", res.data);
      
          if (Platform.OS === "web") {
            window.alert("Job posted successfully ✅");
          } else {
            Alert.alert(
              "Success ✅",
              "Job posted successfully"
            );
          }
        }
      
        setShowModal(false);
      
        fetchJobs();
      
      } catch (error: any) {
      
        console.log(
          "UPDATE ERROR:",
          error.response?.data || error.message
        );
      
        if (Platform.OS === "web") {
          window.alert(
            error.response?.data?.message ||
            "Failed to update job"
          );
        } else {
          Alert.alert(
            "Error ❌",
            error.response?.data?.message ||
            "Failed to update job"
          );
        }
      }
  };
  // ── close (mark filled)
  const closeJob = async (job: JobType) => {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm(
            "Mark this position as filled?"
          )
        : true;
  
    if (!confirmed) return;
  
    try {
      await axios.patch(
        `${API_URL}/jobs/${job.id}/close`
      );
  
      setJobs(prev =>
        prev.map(j =>
          j.id === job.id
            ? { ...j, is_closed: true }
            : j
        )
      );
  
      if (Platform.OS === "web") {
        window.alert(
          "Job marked as filled successfully"
        );
      } else {
        Alert.alert(
          "Success ✅",
          "Job marked as filled"
        );
      }
  
      setTimeout(() => fetchJobs(), 300);
    } catch (error: any) {
      console.log(error.response?.data);
  
      if (Platform.OS === "web") {
        window.alert("Failed to close job");
      } else {
        Alert.alert(
          "Error ❌",
          "Failed to close job"
        );
      }
    }
  };
  // ── apply
  const handleApply = async (item: JobType) => {
    try {
      if (item.apply_url) await Linking.openURL(item.apply_url);
      else if (item.apply_email)
        await Linking.openURL(`mailto:${item.apply_email}`);
    } catch (err) {
      console.log(err);
    }
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );

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
            {/* ── HERO ── */}
            <LinearGradient
             colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <View style={styles.topHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heading}>Job Board</Text>
                  <Text style={styles.subHeading}>
                    Discover alumni opportunities
                  </Text>
                </View>
                <Animated.View style={animatedStyle}>
                  <TouchableOpacity
                    style={styles.postMiniBtn}
                    onPress={openCreateModal}
                  >
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

              {/* SEARCH + FILTER TOGGLE */}
              <View style={styles.searchRow}>
                <View
                  style={[
                    styles.searchBox,
                    searchFocused && {
                      borderWidth: 2,
                      borderColor: "#818cf8",
                    },
                  ]}
                >
                  <Ionicons name="search" size={20} color="#64748b" />
                  <TextInput
                    placeholder="Search jobs, companies, skills..."
                    placeholderTextColor="#94a3b8"
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() =>
                      setTimeout(() => setSearchFocused(false), 150)
                    }
                  />
                  {search.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearch("")}
                      style={styles.clearBtn}
                    >
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
                    size={20}
                    color={activeFiltersCount > 0 ? "#4f46e5" : "#64748b"}
                  />
                  {activeFiltersCount > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>
                        {activeFiltersCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* SEARCH DROPDOWN */}
              {search.trim().length > 0 && (
                <View style={styles.searchDropdown}>
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownHeaderLeft}>RESULTS</Text>
                    <Text style={styles.dropdownHeaderRight}>
                      {filteredJobs.length} found
                    </Text>
                  </View>
                  {filteredJobs.length === 0 ? (
                    <View style={{ padding: 24, alignItems: "center" }}>
                      <Ionicons
                        name="briefcase-outline"
                        size={32}
                        color="#CBD5E1"
                      />
                      <Text style={styles.noResultText}>No jobs found</Text>
                    </View>
                  ) : (
                    filteredJobs.slice(0, 5).map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.dropdownItem}
                        onPress={() => setSearch("")}
                      >
                       
                        <View style={styles.dropdownInfo}>
                          <Text
                            style={styles.dropdownTitle}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text style={styles.dropdownMeta}>
                            {item.company} · {item.location} ·{" "}
                            {item.experience_range}
                          </Text>
                        </View>
                        <View style={styles.dropdownBadge}>
                          <Text
                            style={styles.dropdownBadgeText}
                            numberOfLines={1}
                          >
                            {item.skills?.split(",")[0]?.trim()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </LinearGradient>

            {/* ── FILTERS PANEL ── */}
            {showFilters && (
              <View style={styles.filtersPanel}>
                <View style={styles.filtersPanelHeader}>
                  <Text style={styles.filtersPanelTitle}>Filters</Text>
                  {activeFiltersCount > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setFilterLoc("All");
                        setFilterExp("All");
                        setFilterFn("All");
                      }}
                    >
                      <Text style={styles.clearFiltersText}>Clear all</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.filterLabel}>Location</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pillScroll}
                >
                  {LOCATIONS.map((l) => (
                    <FilterPill
                      key={l}
                      label={l}
                      active={filterLoc === l}
                      onPress={() => setFilterLoc(l)}
                    />
                  ))}
                </ScrollView>

                <Text style={styles.filterLabel}>Experience</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pillScroll}
                >
                  {EXPERIENCES.map((e) => (
                    <FilterPill
                      key={e}
                      label={e}
                      active={filterExp === e}
                      onPress={() => setFilterExp(e)}
                    />
                  ))}
                </ScrollView>

                <Text style={styles.filterLabel}>Function</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pillScroll}
                >
                  {FUNCTIONS.map((f) => (
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

{filteredJobs.length > 0 ? (
  <Text style={styles.resultCount}>
    {filteredJobs.length} listing
    {filteredJobs.length !== 1 ? "s" : ""}
  </Text>
) : null}
          </>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Ionicons name="briefcase-outline" size={64} color="#CBD5E1" />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#94A3B8",
                marginTop: 16,
              }}
            >
              No jobs found
            </Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={() => {
                  setFilterLoc("All");
                  setFilterExp("All");
                  setFilterFn("All");
                }}
              >
                <Text style={styles.clearFiltersBtnText}>Clear filters</Text>
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
            <View
              style={[
                styles.card,
                (item?.is_closed || expired) ? styles.cardClosed : null,
              ]}
            >
              {/* BANNERS */}
              
        
              {(closed || expired) && (
                <View style={styles.closedBanner}>
                  <Ionicons name="lock-closed" size={11} color="#64748b" />
                  <Text style={styles.closedText}>
                    {closed ? "Position filled" : "Expired"}
                  </Text>
                </View>
              )}

              {/* COMPANY ROW */}
              <View style={styles.companyRow}>
  
              <CompanyLogo size={52} />
  <View style={{ marginLeft: 12, flex: 1 }}>
    <Text style={styles.jobTitle}>{item.title}</Text>

    {/* company name always visible */}
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

              {/* INFO CHIPS */}
              <View style={styles.infoChipsRow}>
                <View style={styles.infoChip}>
                  <Ionicons name="location-outline" size={13} color="#4f46e5" />
                  <Text style={styles.infoChipText}>{item.location}</Text>
                </View>
                <View style={styles.infoChip}>
                  <Ionicons name="briefcase-outline" size={13} color="#4f46e5" />
                  <Text style={styles.infoChipText}>{item.experience_range}</Text>
                </View>
                {item.function_name ? (
                  <View style={styles.infoChip}>
                    <Ionicons name="layers-outline" size={13} color="#4f46e5" />
                    <Text style={styles.infoChipText}>{item.function_name}</Text>
                  </View>
                ) : null}
                <View style={styles.infoChip}>
                  <Ionicons name="calendar-outline" size={13} color="#ef4444" />
                  <Text style={[styles.infoChipText, { color: "#ef4444" }]}>
                    {formatDateTime(item.expires_on)}
                  </Text>
                </View>
              </View>

              {/* SKILLS */}
              <View style={styles.skillRow}>
                {item.skills?.split(",").slice(0, 4).map((skill, i) => (
                  <View key={i} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill.trim()}</Text>
                  </View>
                ))}
              </View>

              {/* DESCRIPTION */}
              <Text style={styles.description} numberOfLines={3}>
                {item.job_description}
              </Text>

              {/* OWNER ACTIONS */}
              {mine && (
                <View style={styles.ownerActions}>
                  <TouchableOpacity
                    style={styles.ownerBtn}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="create-outline" size={15} color="#4f46e5" />
                    <Text style={styles.ownerBtnText}>Edit</Text>
                  </TouchableOpacity>
                  {!closed && (
                    <TouchableOpacity
                      style={[styles.ownerBtn, styles.ownerBtnDanger]}
                      onPress={() => closeJob(item)}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={15}
                        color="#ef4444"
                      />
                      <Text style={[styles.ownerBtnText, { color: "#ef4444" }]}>
                        Mark Filled
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

            
              
              {/* CARD FOOTER */}
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
                    <Text style={styles.postedBy}>{item.posted_by_name}</Text>
                    <Text style={styles.expire}>
                      Expires {formatDateTime(item.expires_on)}
                    </Text>
                  </View>
                </View>
                {!closed && !expired && (
                  <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => handleApply(item)}
                  >
                    <Text style={styles.applyText}>Apply Now</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color="#fff"
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* ── POST / EDIT MODAL ── */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingJob ? "Edit Job" : "Post a New Job"}
            </Text>
            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={submitJob}
            >
              <Text style={styles.modalSubmitText}>
                {editingJob ? "Update" : "Post"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
           
            
            <Text style={styles.sectionLabel}>Basic Info</Text>
            {[
              { ph: "Job Title *", val: title, fn: setTitle },
              { ph: "Company Name *", val: company, fn: setCompany },
            ].map((f, i) => (
              <TextInput
                key={i}
                placeholder={f.ph}
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={f.val}
                onChangeText={f.fn}
              />
            ))}

            <Text style={styles.sectionLabel}>Details</Text>
            {[
              { ph: "Location *", val: jobLocation, fn: setJobLocation },
              {
                ph: "Experience (e.g. 1-3 Years)",
                val: experienceRange,
                fn: setExperienceRange,
              },
              {
                ph: "Function (Engineering, Design, Product…)",
                val: functionName,
                fn: setFunctionName,
              },
              {
                ph: "Skills (React, Node, Python…)",
                val: skills,
                fn: setSkills,
              },
            ].map((f, i) => (
              <TextInput
                key={i}
                placeholder={f.ph}
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={f.val}
                onChangeText={f.fn}
              />
            ))}

            <TextInput
              placeholder="Job Description *"
              placeholderTextColor="#94a3b8"
              multiline
              style={styles.textArea}
              value={jobDescription}
              onChangeText={setJobDescription}
            />

            <Text style={styles.sectionLabel}>Application</Text>
            {[
              { ph: "Apply Email", val: applyEmail, fn: setApplyEmail },
              { ph: "Apply URL", val: applyUrl, fn: setApplyUrl },
              {
                ph: "Expiry Date (2026-12-31)",
                val: expiresOn,
                fn: setExpiresOn,
              },
            ].map((f, i) => (
              <TextInput
                key={i}
                placeholder={f.ph}
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={f.val}
                onChangeText={f.fn}
              />
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // HEADER
  header: {
    paddingHorizontal: Platform.OS === "web" ? 60:20,
    paddingTop: 20,
    paddingBottom: 28,
   
   
  },
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
   
  },
  heading: { color: "#fff",  fontSize: Platform.OS === "web" ? 42 : 30, fontWeight: "800" ,textAlign:  Platform.OS === "web" ?"center":"left",},
  subHeading: { color: "#cbd5e1", marginTop: 5, marginBottom: 16, fontSize: 15,textAlign:  Platform.OS === "web" ?"center":"left", },
  postMiniBtn: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#818cf8",
  },
  postMiniText: {
    color: "#fff",
    fontWeight: "800",
    marginLeft: 6,
    fontSize: 14,
  },

  // STATS
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statBox: {
    flex: 1,
  
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  statNum: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLbl: { color: "#fff", fontSize: 10, marginTop: 2 },

  // SEARCH
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchBox: {
    width: Platform.OS === "web" ? "95%" : "85%",
    height: 58,
  
    backgroundColor: "#fff",
    borderRadius: 18,
  
    flexDirection: "row",
    alignItems: "center",
  
    paddingHorizontal: 14,
  
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
  
    shadowOpacity: 0.12,
    shadowRadius: 12,
  
    elevation: 5,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#111827",outlineStyle: "none"  }as any,
  clearBtn: {
    width: 26,
    height: 26,
    backgroundColor: "#F1F5F9",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  filterToggleBtn: {
    width: 54,
    height: 54,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterToggleBtnActive: {
    backgroundColor: "#eef2ff",
    borderWidth: 1.5,
    borderColor: "#818cf8",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },

  // DROPDOWN
  searchDropdown: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownHeaderLeft: { fontSize: 11, fontWeight: "700", color: "#94A3B8" },
  dropdownHeaderRight: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  dropdownInfo: { flex: 1 },
  dropdownTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  dropdownMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  dropdownBadge: {
    backgroundColor: "#EDE9FE",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  dropdownBadgeText: { fontSize: 10, fontWeight: "700", color: "#6D28D9" },
  noResultText: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "600",
  },

  // FILTERS PANEL
  filtersPanel: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 16,
    elevation: 2,
  },
  filtersPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filtersPanelTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  clearFiltersText: { fontSize: 13, color: "#4f46e5", fontWeight: "700" },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 8,
    marginTop: 4,
  },
  pillScroll: { marginBottom: 4 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterPillActive: { backgroundColor: "#eef2ff", borderColor: "#818cf8" },
  filterPillText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  filterPillTextActive: { color: "#4f46e5" },

  resultCount: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginHorizontal: 20,
    marginTop: 14,
  },
  clearFiltersBtn: {
    marginTop: 16,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearFiltersBtnText: { color: "#4f46e5", fontWeight: "700", fontSize: 14 },

  // JOB CARD
  card: {
    backgroundColor: "#fff",
    marginHorizontal: Platform.OS === "web" ?30:20,
    marginTop: 16,
    borderRadius: 22,
    padding: 19,
    elevation: 3,
    overflow: "hidden",
  },
  cardClosed: { opacity: 0.6 },

  

  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f1f5f9",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  closedText: { fontSize: 11, fontWeight: "700", color: "#64748b" },

  companyRow: { flexDirection: "row", alignItems: "flex-start" },
  jobTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  company: { marginTop: 4, color: "#64748b", fontSize: 13 },
  newBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  newBadgeText: { color: "#16A34A", fontSize: 11, fontWeight: "700" },

  infoChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  infoChipText: { fontSize: 12, color: "#4f46e5", fontWeight: "600" },

  skillRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 8 },
  skillChip: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  skillText: { color: "#6d28d9", fontWeight: "700", fontSize: 12 },

  description: { marginTop: 12, color: "#475569", lineHeight: 22, fontSize: 14 },

  // OWNER ACTIONS
  ownerActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  ownerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  ownerBtnDanger: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  ownerBtnText: { fontSize: 13, fontWeight: "700", color: "#4f46e5" },

  // ADMIN ACTIONS
  
  // CARD FOOTER
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  userRow: { flexDirection: "row", alignItems: "center" },
  userImage: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  postedBy: { color: "#334155", fontWeight: "700", fontSize: 13 },
  expire: { color: "#ef4444", marginTop: 2, fontSize: 11 },
  applyBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  applyText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // MODAL
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  modalSubmitBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalSubmitText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  modalScroll: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 14,
    color: "#0f172a",
  },
  textArea: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    height: 120,
    textAlignVertical: "top",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 14,
    color: "#0f172a",
  },

  // AUTO LOGO (modal only)
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  logoPreviewBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  logoPreviewImg: { width: 60, height: 60, borderRadius: 14 },
  logoPlaceholderBox: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  logoSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  logoHint: { fontSize: 12, color: "#64748b" },
  logoLoading: { fontSize: 12, color: "#f59e0b", fontWeight: "600" },
  logoFound: { fontSize: 12, color: "#16a34a", fontWeight: "700" },
  logoNotFound: { fontSize: 12, color: "#ef4444", fontWeight: "600" },
});