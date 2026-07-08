import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const isWeb = Platform.OS === "web";

const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

// ─── Animated Action Button ───────────────────────────────────────────────────
function ActionButton({
  icon, iconActive, count, active, color, activeBg, activeBorder, onPress,
}: {
  icon: string; iconActive: string; count: number; active: boolean;
  color: string; activeBg: string; activeBorder: string; onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.22, { damping: 6, stiffness: 300 }),
      withSpring(1,   { damping: 8, stiffness: 200 })
    );
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[
        styles.actionBtn,
        active && { backgroundColor: activeBg, borderColor: activeBorder },
      ]}
    >
      <Animated.View style={[animStyle, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
        <Ionicons name={(active ? iconActive : icon) as any} size={18} color={active ? "#fff" : color} />
        <Text style={[styles.actionText, { color: active ? "#fff" : color }]}>{count}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DiscussionForumScreen() {
  const { width } = useWindowDimensions();
  const isWebLayout = width >= 850;

  useFocusEffect(
    useCallback(() => {
      if (!API_BASE) return;
      AsyncStorage.getItem("user").then((data) => {
        if (data) {
          const u = JSON.parse(data);
          axios.post(`${API_BASE}/forum/seen/${u.id}`).catch(() => {});
        }
      });
    }, [])
  );

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const [showModal, setShowModal] = useState(false);
  const [replyModal, setReplyModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<any[]>([]);
  
  const [user, setUser] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Question");

  // Permanent local tracking
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());
  const [loadingLike, setLoadingLike] = useState<number | null>(null);
  const [loadingReport, setLoadingReport] = useState<number | null>(null);

  const [LIKED_KEY, setLikedKey]       = useState("forum_liked_ids_guest");
  const [REPORTED_KEY, setReportedKey] = useState("forum_reported_ids_guest");

  const persistLiked = async (next: Set<number>) => {
    try { await AsyncStorage.setItem(LIKED_KEY, JSON.stringify([...next])); } catch {}
  };
  const persistReported = async (next: Set<number>) => {
    try { await AsyncStorage.setItem(REPORTED_KEY, JSON.stringify([...next])); } catch {}
  };

  const postScale = useSharedValue(1);

  useEffect(() => {
    postScale.value = withRepeat(withTiming(1.06, { duration: 1000 }), -1, true);
  }, []);

  const postAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: postScale.value }],
  }));

  const categories = ["All", "Suggestion", "Feedback", "Question", "Announcement"];

  useEffect(() => {
    if (API_BASE) loadUser(); 
  }, []);

  const loadUser = async () => {
    const data = await AsyncStorage.getItem("user");
    if (data) {
      const u = JSON.parse(data);
      setUser(u);
      const uid = u.id;
      setLikedKey(`forum_liked_ids_${uid}`);
      setReportedKey(`forum_reported_ids_${uid}`);
      try {
        const reportedRaw = await AsyncStorage.getItem(`forum_reported_ids_${uid}`);
        if (reportedRaw) setReportedIds(new Set<number>(JSON.parse(reportedRaw)));
      } catch {}
      fetchPosts(uid);
    }
  };

  const fetchPosts = async (currentUserId?: number) => {
    try {
      const uid = currentUserId ?? user?.id;
      const res = await axios.get(`${API_BASE}/forum/posts`, {
        params: uid ? { user_id: uid } : {},
      });
      // 🚨 Fallback to [] prevents undefined crashes
      const data: any[] = res.data.data || [];
      setPosts(data);
  
      const serverLiked = new Set<number>();
      const serverReported = new Set<number>();
  
      data.forEach((p) => {
        if (p.liked_by_user === 1 || p.liked_by_user === true || p.liked_by_user === "1") serverLiked.add(p.id);
        if (p.reported_by_user === 1 || p.reported_by_user === true || p.reported_by_user === "1") serverReported.add(p.id);
      });
  
      setLikedIds(serverLiked);
      setReportedIds(serverReported); 
    } catch (err) {
      showAlert("Error", "Failed to load posts. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  const handleCreatePost = async () => {
    if (!subject.trim() || !body.trim()) { showAlert("Validation Error", "Please fill out both the subject and the body."); return; }
    try {
      await axios.post(`${API_BASE}/forum/create`, { user_id: user.id, category, subject, body });
      showAlert("Success", "Your post has been published to the forum.");
      setSubject(""); setBody(""); setCategory("Question"); setShowModal(false);
      fetchPosts();
    } catch { showAlert("Error", "Failed to create post. Please try again."); }
  };

  const handleLike = async (postId: number) => {
    if (loadingLike === postId) return;
    const wasLiked = likedIds.has(postId);
  
    setLikedIds((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(postId) : next.add(postId);
      persistLiked(next);
      return next;
    });
  
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: wasLiked ? p.likes_count - 1 : p.likes_count + 1 } : p));
  
    setLoadingLike(postId);
    try {
      await axios.post(`${API_BASE}/forum/like`, { post_id: postId, user_id: user.id });
      const res = await axios.get(`${API_BASE}/forum/posts`, { params: { user_id: user.id } });
      setPosts(res.data.data || []);
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        wasLiked ? next.add(postId) : next.delete(postId);
        persistLiked(next);
        return next;
      });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: wasLiked ? p.likes_count + 1 : p.likes_count - 1 } : p));
    } finally {
      setLoadingLike(null);
    }
  };

  const handleReport = async (postId: number) => {
    if (loadingReport === postId) return;
    if (reportedIds.has(postId)) return; 
  
    setReportedIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      persistReported(next);
      return next;
    });
  
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reports_count: p.reports_count + 1 } : p));
  
    setLoadingReport(postId);
    try {
      const res = await axios.post(`${API_BASE}/forum/report`, { post_id: postId, reported_by: user.id, reason: "Abusive Content" });
      showAlert("Report Submitted", res.data.message);
      const updated = await axios.get(`${API_BASE}/forum/posts`, { params: { user_id: user.id } });
      setPosts(updated.data.data || []);
    } catch {
      setReportedIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        persistReported(next);
        return next;
      });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reports_count: p.reports_count - 1 } : p));
      showAlert("Error", "Failed to report post");
    } finally {
      setLoadingReport(null);
    }
  };

  const fetchReplies = async (postId: number) => {
    try {
      const res = await axios.get(`${API_BASE}/forum/replies/${postId}`);
      setReplies(res.data.data || []);
    } catch {}
  };

  const handleReply = async () => {
    if (!replyText.trim()) { showAlert("Validation Error", "Please write a reply before posting."); return; }
    try {
      await axios.post(`${API_BASE}/forum/reply`, { post_id: selectedPost.id, user_id: user.id, reply: replyText });
      setPosts((prev) => prev.map((p) => p.id === selectedPost.id ? { ...p, replies_count: p.replies_count + 1 } : p));
      showAlert("Success", "Your reply has been added.");
      setReplyText(""); setReplyModal(false);
      fetchPosts();
    } catch { showAlert("Error", "Failed to post reply."); }
  };

  const filteredPosts = posts.filter((item) => {
    const matchCategory = selectedCategory === "All" ? true : item.category === selectedCategory;
    const matchSearch = item.subject?.toLowerCase().includes(search.toLowerCase()) || item.body?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const formatTimeAgo = (dateString: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    const m = Math.floor(seconds / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (seconds < 60) return "Just now";
    if (m < 60) return `${m} m ago`;
    if (h < 24) return `${h} h ago`;
    if (d < 7) return `${d} d ago`;
    if (d < 35) return `${Math.floor(d / 7)} w ago`;
    if (d < 365) return `${Math.floor(d / 30)} mo ago`;
    return `${Math.floor(d / 365)} y ago`;
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "Question":     return { bg: "#DBEAFE", text: "#1D4ED8" };
      case "Suggestion":   return { bg: "#DCFCE7", text: "#15803D" };
      case "Feedback":     return { bg: "#FEF3C7", text: "#B45309" };
      case "Announcement": return { bg: "#F3E8FF", text: "#6D28D9" };
      default:             return { bg: "#F1F5F9", text: "#475569" };
    }
  };

  // ── System Error Guard ──
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
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loaderTxt}>Loading forum...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            {/* ══ HERO HEADER ══ */}
            <LinearGradient
              colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <View style={styles.dec1} />
              <View style={styles.dec2} />

              <View style={[styles.headerContentWrapper, isWebLayout && styles.webWidthConstraints]}>
                <View style={styles.forumTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heading}>Alumni Forum</Text>
                    <Text style={styles.subHeading}>Engage, discuss, and connect with your community</Text>
                  </View>
                  <Animated.View style={postAnimatedStyle}>
                    <TouchableOpacity style={styles.createBtnInline} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                      <Ionicons name="add-circle" size={20} color="#4F46E5" />
                      <Text style={styles.createInlineText}>New Post</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>

                {/* SEARCH */}
                <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
                  <Ionicons name="search" size={20} color="#64748b" />
                  <TextInput
                    placeholder="Search discussions, topics, or keywords..."
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  />
                  {search.trim().length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
                      <Ionicons name="close" size={16} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* SEARCH DROPDOWN */}
                {search.trim().length > 0 && (
                  <View style={styles.searchDropdown}>
                    <View style={styles.dropdownHeader}>
                      <Text style={styles.dropdownHeaderLeft}>RESULTS</Text>
                      <Text style={styles.dropdownHeaderRight}>{filteredPosts.length} found</Text>
                    </View>
                    {filteredPosts.length === 0 ? (
                      <View style={{ padding: 24, alignItems: "center" }}>
                        <Ionicons name="search-outline" size={32} color="#CBD5E1" />
                        <Text style={styles.noResultText}>No discussions found</Text>
                      </View>
                    ) : (
                      filteredPosts.slice(0, 5).map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSearch(""); setSearchFocused(false);
                            setSelectedPost(item); fetchReplies(item.id); setReplyModal(true);
                          }}
                        >
                          <Image
                            source={{ uri: item.profile_photo ? (item.profile_photo.startsWith("http") ? item.profile_photo : `${API_BASE}/uploads/${item.profile_photo}`) : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
                            style={styles.dropdownAvatar}
                          />
                          <View style={styles.dropdownInfo}>
                            <Text style={styles.dropdownTitle} numberOfLines={1}>{item.subject}</Text>
                            <Text style={styles.dropdownMeta}>{item.full_name} · {formatTimeAgo(item.created_at)}</Text>
                          </View>
                          <View style={[styles.dropdownBadge, { backgroundColor: categoryColor(item.category).bg }]}>
                            <Text style={[styles.dropdownBadgeText, { color: categoryColor(item.category).text }]}>{item.category}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* CATEGORY FILTER */}
            <View style={[isWebLayout && styles.webWidthConstraints, { alignSelf: 'center', width: '100%' }]}>
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryContainer}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, selectedCategory === cat && styles.activeCategory]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.categoryText, selectedCategory === cat && styles.activeCategoryText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const liked = likedIds.has(item.id);
          const reported = reportedIds.has(item.id);
          const cc       = categoryColor(item.category);
          const safeAvatar = item.profile_photo ? (item.profile_photo.startsWith("http") ? item.profile_photo : `${API_BASE}/uploads/${item.profile_photo}`) : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

          return (
            <View style={[styles.card, isWebLayout && styles.webWidthConstraints]}>
              {/* TOP ROW */}
              <View style={styles.topRow}>
                <Image source={{ uri: safeAvatar }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.full_name}</Text>
                  <Text style={styles.role}>{item.programme} • {item.batch_year}</Text>
                  <Text style={styles.time}>{formatTimeAgo(item.created_at)}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: cc.bg }]}>
                  <Text style={[styles.badgeText, { color: cc.text }]}>{item.category}</Text>
                </View>
              </View>

              <Text style={styles.subject}>{item.subject}</Text>
              <Text style={styles.body}>{item.body}</Text>

              {/* STATS */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="thumbs-up" size={13} color={liked ? "#4F46E5" : "#94A3B8"} />
                  <Text style={[styles.stats, liked && { color: "#4F46E5" }]}>{item.likes_count}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble" size={13} color="#64748b" />
                  <Text style={styles.stats}>{item.replies_count}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="flag" size={13} color={reported ? "#DC2626" : "#94a3b8"} />
                  <Text style={[styles.stats, reported && { color: "#DC2626" }]}>{item.reports_count}</Text>
                </View>
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.actionRow}>
                <ActionButton
                  icon="thumbs-up-outline" iconActive="thumbs-up"
                  count={item.likes_count} active={liked}
                  color="#4F46E5" activeBg="#4F46E5" activeBorder="#4338CA"
                  onPress={() => handleLike(item.id)}
                />
                <ActionButton
                  icon="chatbubble-outline" iconActive="chatbubble"
                  count={item.replies_count} active={false}
                  color="#0F172A" activeBg="#0F172A" activeBorder="#000"
                  onPress={() => {
                    setSelectedPost(item); fetchReplies(item.id); setReplyModal(true);
                  }}
                />
                <ActionButton
                  icon="flag-outline" iconActive="flag"
                  count={item.reports_count} active={reported}
                  color="#DC2626" activeBg="#DC2626" activeBorder="#B91C1C"
                  onPress={() => handleReport(item.id)}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
             <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
             <Text style={styles.noResultText}>No posts in this category yet.</Text>
          </View>
        }
      />

      {/* ── CREATE POST MODAL ── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalBg}>
            <View style={[styles.modal, isWebLayout && { maxWidth: 600, width: "100%", alignSelf: 'center' }]}>
              <Text style={styles.modalTitle}>New Discussion</Text>
              
              <Text style={styles.fieldLabel}>Select Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18, flexGrow: 0 }}>
                {categories.filter((c) => c !== "All").map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalCat, category === cat && { backgroundColor: "#4F46E5", borderColor: "#4F46E5" }]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={{ color: category === cat ? "#fff" : "#475569", fontWeight: "700" }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Text style={styles.fieldLabel}>Subject Title</Text>
              <TextInput placeholder="e.g. How to prepare for tech interviews?" placeholderTextColor="#94A3B8" value={subject} onChangeText={setSubject} style={styles.input} />
              
              <Text style={styles.fieldLabel}>Discussion Details</Text>
              <TextInput placeholder="Share your thoughts or questions..." placeholderTextColor="#94A3B8" value={body} onChangeText={setBody} multiline style={styles.textArea} />
              
              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postBtn} onPress={handleCreatePost}>
                  <Text style={styles.postText}>Publish Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── REPLY MODAL ── */}
      <Modal visible={replyModal} transparent animationType="fade">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalBg}>
            <View style={[styles.replyModal, isWebLayout && { maxWidth: 600, width: "100%", alignSelf: 'center' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.modalTitle}>Discussion Replies</Text>
                <TouchableOpacity onPress={() => setReplyModal(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
                {replies.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <Ionicons name="chatbubbles-outline" size={40} color="#CBD5E1" />
                    <Text style={{ textAlign: "center", color: "#64748B", marginTop: 12, fontWeight: "500" }}>Be the first to reply!</Text>
                  </View>
                ) : (
                  replies.map((item) => {
                    const safeReplyAvatar = item.profile_photo ? (item.profile_photo.startsWith("http") ? item.profile_photo : `${API_BASE}/uploads/${item.profile_photo}`) : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                    return (
                      <View key={item.id} style={styles.replyCard}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Image source={{ uri: safeReplyAvatar }} style={styles.replyAvatar} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.replyName}>{item.full_name}</Text>
                            <Text style={styles.replyTime}>{formatTimeAgo(item.created_at)}</Text>
                          </View>
                        </View>
                        <Text style={styles.replyText}>{item.reply}</Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={{ marginTop: 16 }}>
                <Text style={styles.fieldLabel}>Your Reply</Text>
                <TextInput placeholder="Write your response..." placeholderTextColor="#94A3B8" multiline value={replyText} onChangeText={setReplyText} style={[styles.textArea, { height: 100 }]} />
                <TouchableOpacity style={[styles.postBtn, { marginTop: 12, marginLeft: 0 }]} onPress={handleReply}>
                  <Text style={styles.postText}>Submit Reply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderTxt:  { marginTop: 14, color: "#64748B", fontSize: 15, fontWeight: "500" },
  listContainer: { paddingBottom: 130 },

  // System Level Error Interfaces
  errorContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 32, textAlign: "center" as any },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20, maxWidth: 420 },

  header: { width: "100%", paddingTop: 30, paddingBottom: 36, paddingHorizontal: 24, overflow: "hidden" },
  dec1: { position: "absolute", right: -60, top: -40, width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" },
  dec2: { position: "absolute", right: 40, top: 50, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)" },

  webWidthConstraints: { maxWidth: 850, width: "100%", alignSelf: "center" },
  headerContentWrapper: { width: "100%" },

  forumTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  heading:    { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  subHeading: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4, fontWeight: "500" },

  createBtnInline: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)", paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  createInlineText: { color: "#4F46E5", fontWeight: "800", marginLeft: 6, fontSize: 14 },

  searchBox: {
    backgroundColor: "#fff", borderRadius: 16, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, height: 54, borderWidth: 2, borderColor: "transparent",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4
  },
  searchBoxFocused: { borderColor: "rgba(255,255,255,0.4)" },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, color: "#0F172A", ...Platform.select({ web: { outlineStyle: "none" } as any }) },
  clearBtn:    { width: 28, height: 28, backgroundColor: "#F1F5F9", borderRadius: 14, justifyContent: "center", alignItems: "center" },

  searchDropdown:     { marginTop: 10, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  dropdownHeader:     { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", backgroundColor: "#F8FAFC" },
  dropdownHeaderLeft: { fontSize: 11.5, fontWeight: "700", color: "#64748B", letterSpacing: 0.5 },
  dropdownHeaderRight:{ fontSize: 11.5, fontWeight: "600", color: "#64748B" },
  dropdownItem:       { flexDirection: "row", alignItems: "center", padding: 14, gap: 14, borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  dropdownAvatar:     { width: 44, height: 44, borderRadius: 22 },
  dropdownInfo:       { flex: 1 },
  dropdownTitle:      { fontSize: 14.5, fontWeight: "700", color: "#0F172A" },
  dropdownMeta:       { fontSize: 12.5, color: "#64748B", marginTop: 3 },
  dropdownBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dropdownBadgeText:  { fontSize: 10.5, fontWeight: "800", textTransform: "uppercase" },
  noResultText:       { color: "#64748B", fontSize: 14, marginTop: 10, fontWeight: "600" },

  categoryContainer: { paddingHorizontal: 20, marginTop: 24, paddingBottom: 10, gap: 10 },
  categoryBtn:        { backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  activeCategory:     { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  categoryText:       { color: "#475569", fontWeight: "600", fontSize: 13.5 },
  activeCategoryText: { color: "#fff" },

  card: {
    backgroundColor: "#fff", marginHorizontal: 20, marginTop: 14, borderRadius: 22, padding: 22,
    borderWidth: 1, borderColor: "#F1F5F9",
    shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  topRow:  { flexDirection: "row", alignItems: "center" },
  avatar:  { width: 54, height: 54, borderRadius: 27, marginRight: 14, borderWidth: 1, borderColor: "#F1F5F9" },
  name:    { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  role:    { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "500" },
  time:    { fontSize: 12, color: "#94A3B8", marginTop: 3 },
  badge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText:{ fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  subject: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 18, lineHeight: 26, letterSpacing: -0.2 },
  body:    { fontSize: 14.5, color: "#475569", marginTop: 10, lineHeight: 24 },

  statsRow: { flexDirection: "row", gap: 18, marginTop: 20, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 16 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stats:    { color: "#64748B", fontSize: 13.5, fontWeight: "600" },

  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center",
    backgroundColor: "#F8FAFC", borderRadius: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  actionText: { marginLeft: 6, fontWeight: "800", fontSize: 13.5 },

  emptyContainer: { alignItems: "center", paddingVertical: 60 },

  modalBg:    { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", padding: 20 },
  modal:      { backgroundColor: "#fff", borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  replyModal: { backgroundColor: "#fff", borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A", letterSpacing: -0.3 },
  
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8, marginTop: 4 },
  modalCat:   { backgroundColor: "#F8FAFC", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, borderWidth: 1.5, borderColor: "#E2E8F0" },
  input:      { backgroundColor: "#F8FAFC", borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: 16, borderWidth: 1.5, borderColor: "#E2E8F0", fontSize: 14, color: "#0F172A", ...Platform.select({ web: { outlineStyle: "none" } as any }) },
  textArea:   { backgroundColor: "#F8FAFC", borderRadius: 14, paddingHorizontal: 16, paddingTop: 16, height: 120, textAlignVertical: "top", borderWidth: 1.5, borderColor: "#E2E8F0", fontSize: 14, color: "#0F172A", ...Platform.select({ web: { outlineStyle: "none" } as any }) },
  
  modalBtnRow:{ flexDirection: "row", marginTop: 24, gap: 12 },
  cancelBtn:  { flex: 1, backgroundColor: "#fff", paddingVertical: 15, borderRadius: 14, alignItems: "center", borderWidth: 1.5, borderColor: "#E2E8F0" },
  postBtn:    { flex: 1, backgroundColor: "#4F46E5", paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  cancelText: { color: "#475569", fontWeight: "700", fontSize: 14.5 },
  postText:   { color: "#fff", fontWeight: "800", fontSize: 14.5 },

  replyCard:   { backgroundColor: "#F8FAFC", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#F1F5F9" },
  replyAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  replyName:   { fontSize: 14.5, fontWeight: "800", color: "#0F172A" },
  replyTime:   { fontSize: 12, color: "#94A3B8", marginTop: 2, fontWeight: "500" },
  replyText:   { marginTop: 10, fontSize: 14, lineHeight: 22, color: "#334155" },
});