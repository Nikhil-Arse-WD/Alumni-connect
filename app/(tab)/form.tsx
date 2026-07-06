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
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const API_URL = "http://10.232.80.175:2000";

// ─── Animated Action Button ───────────────────────────────────────────────────
function ActionButton({
  icon,
  iconActive,
  count,
  active,
  color,
  activeBg,
  activeBorder,
  onPress,
}: {
  icon: string;
  iconActive: string;
  count: number;
  active: boolean;
  color: string;
  activeBg: string;
  activeBorder: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    // Pop animation on press
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
        active && {
          backgroundColor: activeBg,
          borderColor: activeBorder,
        },
      ]}
    >
      <Animated.View style={[animStyle, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
        <Ionicons
          name={(active ? iconActive : icon) as any}
          size={18}
          color={active ? "#fff" : color}
        />
        <Text style={[styles.actionText, { color: active ? "#fff" : color }]}>
          {count}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DiscussionForumScreen() {
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("user").then((data) => {
        if (data) {
          const u = JSON.parse(data);
          axios.post(`${API_URL}/forum/seen/${u.id}`).catch(() => {});
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

  // Permanent local tracking — persisted in AsyncStorage
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());
  const [loadingLike, setLoadingLike] = useState<number | null>(null);
  const [loadingReport, setLoadingReport] = useState<number | null>(null);

  // ── Storage helpers ────────────────────────────────────────────────────────
  // Keys are set after user loads — placeholder until then
  const [LIKED_KEY, setLikedKey]       = useState("forum_liked_ids_guest");
  const [REPORTED_KEY, setReportedKey] = useState("forum_reported_ids_guest");

  const loadPersistedSets = async () => {
    try {
      const [likedRaw, reportedRaw] = await Promise.all([
        AsyncStorage.getItem(LIKED_KEY),
        AsyncStorage.getItem(REPORTED_KEY),
      ]);
      if (likedRaw)    setLikedIds(new Set<number>(JSON.parse(likedRaw)));
      if (reportedRaw) setReportedIds(new Set<number>(JSON.parse(reportedRaw)));
    } catch {}
  };

  const persistLiked = async (next: Set<number>) => {
    try { await AsyncStorage.setItem(LIKED_KEY, JSON.stringify([...next])); } catch {}
  };
  const persistReported = async (next: Set<number>) => {
    try { await AsyncStorage.setItem(REPORTED_KEY, JSON.stringify([...next])); } catch {}
  };

  const postScale = useSharedValue(1);

  useEffect(() => {
    postScale.value = withRepeat(withTiming(1.08, { duration: 900 }), -1, true);
  }, []);

  const postAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: postScale.value }],
  }));

  const categories = ["All", "Suggestion", "Feedback", "Question", "Announcement"];

  useEffect(() => {
    loadUser(); // loads user + their persisted like/report sets
    fetchPosts();
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
      // ✅ User load hone ke baad hi fetchPosts karo with uid
      fetchPosts(uid);
    }
  };
  
  // ✅ useEffect mein sirf loadUser karo — fetchPosts wahan se call hoga
  useEffect(() => {
    loadUser();
  }, []);

  const fetchPosts = async (currentUserId?: number) => {
    try {
      const uid = currentUserId ?? user?.id;
      const res = await axios.get(`${API_URL}/forum/posts`, {
        params: uid ? { user_id: uid } : {},
      });
      const data: any[] = res.data.data;
      setPosts(data);
  
      const serverLiked = new Set<number>();
      const serverReported = new Set<number>();
  
      data.forEach((p) => {
        if (p.liked_by_user === 1 || p.liked_by_user === true || p.liked_by_user === "1") {
          serverLiked.add(p.id);
        }
        if (p.reported_by_user === 1 || p.reported_by_user === true || p.reported_by_user === "1") {
          serverReported.add(p.id);
        }
      });
  
      setLikedIds(serverLiked);
      setReportedIds(serverReported); // ✅ Server se sahi state
  
    } catch (err) {
      Alert.alert("Error", "Failed to load posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  const handleCreatePost = async () => {
    if (!subject || !body) { Alert.alert("Validation", "Please fill all fields"); return; }
    try {
      await axios.post(`${API_URL}/forum/create`, { user_id: user.id, category, subject, body });
      Alert.alert("Success", "Post created successfully");
      setSubject(""); setBody(""); setCategory("Question"); setShowModal(false);
      fetchPosts();
    } catch { Alert.alert("Error", "Failed to create post"); }
  };

  const handleLike = async (postId: number) => {
    if (loadingLike === postId) return;
    const wasLiked = likedIds.has(postId);
  
    // Optimistic: likedIds toggle
    setLikedIds((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(postId) : next.add(postId);
      persistLiked(next);
      return next;
    });
  
    // Optimistic: count update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: wasLiked ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      )
    );
  
    setLoadingLike(postId);
    try {
      await axios.post(`${API_URL}/forum/like`, { post_id: postId, user_id: user.id });
  
      // ✅ Server se sirf updated count lo — likedIds ko TOUCH MAT KARO
      const res = await axios.get(`${API_URL}/forum/posts`, {
        params: { user_id: user.id },
      });
      // Sirf posts update karo, setLikedIds nahi
      setPosts(res.data.data);
  
    } catch {
      // Revert both on error
      setLikedIds((prev) => {
        const next = new Set(prev);
        wasLiked ? next.add(postId) : next.delete(postId);
        persistLiked(next);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes_count: wasLiked ? p.likes_count + 1 : p.likes_count - 1 }
            : p
        )
      );
    } finally {
      setLoadingLike(null);
    }
  };

  // ── OPTIMISTIC REPORT ──────────────────────────────────────────────────────
  const handleReport = async (postId: number) => {
    if (loadingReport === postId) return;
    if (reportedIds.has(postId)) return; // already reported
  
    // Optimistic: flag instantly
    setReportedIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      persistReported(next);
      return next;
    });
  
    // Optimistic: count bump
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, reports_count: p.reports_count + 1 } : p
      )
    );
  
    setLoadingReport(postId);
    try {
      const res = await axios.post(`${API_URL}/forum/report`, {
        post_id: postId,
        reported_by: user.id,
        reason: "Abusive Content",
      });
      Alert.alert("Report", res.data.message);
  
      // ✅ Server se sirf counts refresh karo — reportedIds ko TOUCH MAT KARO
      const updated = await axios.get(`${API_URL}/forum/posts`, {
        params: { user_id: user.id },
      });
      setPosts(updated.data.data);
  
    } catch {
      // Revert on error
      setReportedIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        persistReported(next);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, reports_count: p.reports_count - 1 } : p
        )
      );
      Alert.alert("Error", "Failed to report post");
    } finally {
      setLoadingReport(null);
    }
  };

  const fetchReplies = async (postId: number) => {
    try {
      const res = await axios.get(`${API_URL}/forum/replies/${postId}`);
      setReplies(res.data.data);
    } catch {}
  };

  // ── OPTIMISTIC REPLY COUNT ─────────────────────────────────────────────────
  const handleReply = async () => {
    if (!replyText) { Alert.alert("Validation", "Please write reply"); return; }
    try {
      await axios.post(`${API_URL}/forum/reply`, {
        post_id: selectedPost.id, user_id: user.id, reply: replyText,
      });
      // Optimistically bump reply count
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id ? { ...p, replies_count: p.replies_count + 1 } : p
        )
      );
      Alert.alert("Success", "Reply added");
      setReplyText(""); setReplyModal(false);
      fetchPosts();
    } catch { Alert.alert("Error", "Reply failed"); }
  };

  const filteredPosts = posts.filter((item) => {
    const matchCategory = selectedCategory === "All" ? true : item.category === selectedCategory;
    const matchSearch =
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.body.toLowerCase().includes(search.toLowerCase());
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
      case "Question":     return { bg: "#DBEAFE", text: "#2563EB" };
      case "Suggestion":   return { bg: "#DCFCE7", text: "#16A34A" };
      case "Feedback":     return { bg: "#FEF3C7", text: "#D97706" };
      case "Announcement": return { bg: "#F3E8FF", text: "#7C3AED" };
      default:             return { bg: "#F1F5F9", text: "#64748B" };
    }
  };

  

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <LinearGradient
              colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <View style={styles.forumTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heading}>Alumni Forum</Text>
                  <Text style={styles.subHeading}>Connect with alumni community</Text>
                </View>
                <Animated.View style={postAnimatedStyle}>
                  <TouchableOpacity style={styles.createBtnInline} onPress={() => setShowModal(true)}>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.createInlineText}>Post</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* SEARCH */}
              <View style={[styles.searchBox, searchFocused && { borderWidth: 2, borderColor: "#818CF8" }]}>
                <Ionicons name="search" size={20} color="#64748b" />
                <TextInput
                  placeholder="Search discussions..."
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
                      <Text style={styles.noResultText}>No posts found</Text>
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
                          source={{ uri: item.profile_photo ? `${API_URL}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
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
            </LinearGradient>

            {/* CATEGORY FILTER */}
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryContainer}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryBtn, selectedCategory === cat && styles.activeCategory]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryText, selectedCategory === cat && styles.activeCategoryText]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => {
          const liked = likedIds.has(item.id);
          const reported = reportedIds.has(item.id);
          const cc       = categoryColor(item.category);

          return (
            <View style={styles.card}>
              {/* TOP ROW */}
              <View style={styles.topRow}>
                <Image
                  source={{ uri: item.profile_photo ? `${API_URL}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
                  style={styles.avatar}
                />
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
                  <Ionicons name="thumbs-up" size={13} color={liked ? "#2563eb" : "#94a3b8"} />
                  <Text style={[styles.stats, liked && { color: "#2563eb" }]}>{item.likes_count}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble" size={13} color="#64748b" />
                  <Text style={styles.stats}>{item.replies_count}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="flag" size={13} color={reported ? "#ef4444" : "#94a3b8"} />
                  <Text style={[styles.stats, reported && { color: "#ef4444" }]}>{item.reports_count}</Text>
                </View>
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.actionRow}>
                {/* LIKE */}
                <ActionButton
                  icon="thumbs-up-outline"
                  iconActive="thumbs-up"
                  count={item.likes_count}
                  active={liked}
                  color="#2563eb"
                  activeBg="#2563eb"
                  activeBorder="#1d4ed8"
                  onPress={() => handleLike(item.id)}
                />

                {/* REPLY */}
                <ActionButton
                  icon="chatbubble-outline"
                  iconActive="chatbubble"
                  count={item.replies_count}
                  active={false}
                  color="#7C3AED"
                  activeBg="#7C3AED"
                  activeBorder="#6d28d9"
                  onPress={() => {
                    setSelectedPost(item);
                    fetchReplies(item.id);
                    setReplyModal(true);
                  }}
                />

                {/* REPORT */}
                <ActionButton
                  icon="flag-outline"
                  iconActive="flag"
                  count={item.reports_count}
                  active={reported}
                  color="#ef4444"
                  activeBg="#ef4444"
                  activeBorder="#dc2626"
                  onPress={() => handleReport(item.id)}
                />
              </View>
            </View>
          );
        }}
      />

      {/* ── CREATE POST MODAL ── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create Post</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {categories.filter((c) => c !== "All").map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.modalCat, category === cat && { backgroundColor: "#2563eb" }]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={{ color: category === cat ? "#fff" : "#111", fontWeight: "700" }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput placeholder="Subject" value={subject} onChangeText={setSubject} style={styles.input} />
            <TextInput placeholder="Write something..." value={body} onChangeText={setBody} multiline style={styles.textArea} />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postBtn} onPress={handleCreatePost}>
                <Text style={styles.postText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── REPLY MODAL ── */}
      <Modal visible={replyModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.replyModal}>
            <Text style={styles.modalTitle}>Replies</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {replies.length === 0 ? (
                <Text style={{ textAlign: "center", color: "#64748b", marginBottom: 16 }}>No Replies Yet</Text>
              ) : (
                replies.map((item) => (
                  <View key={item.id} style={styles.replyCard}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Image
                        source={{ uri: item.profile_photo ? `${API_URL}/uploads/${item.profile_photo}` : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
                        style={styles.replyAvatar}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.replyName}>{item.full_name}</Text>
                        <Text style={styles.replyTime}>{formatTimeAgo(item.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={styles.replyText}>{item.reply}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TextInput placeholder="Write reply..." multiline value={replyText} onChangeText={setReplyText} style={styles.textArea} />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setReplyModal(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postBtn} onPress={handleReply}>
                <Text style={styles.postText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f1f5f9" },
  loader:     { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { paddingTop: 25, paddingBottom: 30, paddingHorizontal: 20 },
  heading:    { textAlign: Platform.OS === "web" ? "center" : "left", fontSize: Platform.OS === "web" ? 42 : 30, fontWeight: "800", color: "#fff" },
  subHeading: { textAlign: Platform.OS === "web" ? "center" : "left", fontSize: 15, color: "#cbd5e1", marginTop: 5, marginBottom: 20 },

  forumTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  createBtnInline: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#2563eb", paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 10, borderWidth: 1.5, borderColor: "#60a5fa",
    elevation: 10, shadowColor: "#2563eb", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  createInlineText: { color: "#fff", fontWeight: "800", marginLeft: 6, fontSize: 17, letterSpacing: 0.5 },

  searchBox: {
    backgroundColor: "#fff", borderRadius: 16, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, height: 54,
    width: Platform.OS === "web" ? "78%" : "100%",
    marginLeft: Platform.OS === "web" ? 130 : 0,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#111",outlineStyle: "none"  } as any,
  clearBtn:    { width: 26, height: 26, backgroundColor: "#F1F5F9", borderRadius: 13, justifyContent: "center", alignItems: "center" },

  searchDropdown:     { marginTop: 10, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0" },
  dropdownHeader:     { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  dropdownHeaderLeft: { fontSize: 11, fontWeight: "700", color: "#94A3B8" },
  dropdownHeaderRight:{ fontSize: 11, fontWeight: "600", color: "#94A3B8" },
  dropdownItem:       { flexDirection: "row", alignItems: "center", padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  dropdownAvatar:     { width: 40, height: 40, borderRadius: 20 },
  dropdownInfo:       { flex: 1 },
  dropdownTitle:      { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  dropdownMeta:       { fontSize: 12, color: "#64748B", marginTop: 2 },
  dropdownBadge:      { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  dropdownBadgeText:  { fontSize: 10, fontWeight: "700" },
  noResultText:       { color: "#94A3B8", fontSize: 14, marginTop: 8, fontWeight: "600" },

  categoryContainer: { paddingHorizontal: 14, marginTop: 18, paddingBottom: 8 },
  categoryBtn:        { backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, marginRight: 10 },
  activeCategory:     { backgroundColor: "#2563eb" },
  categoryText:       { color: "#475569", fontWeight: "600" },
  activeCategoryText: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: Platform.OS === "web" ? 30 : 20,
    marginTop: 14,
    borderRadius: 22,
    padding: 28,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  topRow:  { flexDirection: "row", alignItems: "center" },
  avatar:  { width: 58, height: 58, borderRadius: 29, marginRight: 14 },
  name:    { fontSize: 17, fontWeight: "700", color: "#111827" },
  role:    { fontSize: 13, color: "#64748b", marginTop: 2 },
  time:    { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  badge:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText:{ fontSize: 12, fontWeight: "700" },

  subject: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginTop: 18, lineHeight: 28 },
  body:    { fontSize: 15, color: "#475569", marginTop: 12, lineHeight: 24 },

  statsRow: {
    flexDirection: "row", gap: 16,
    marginTop: 18, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 14,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  stats:    { color: "#64748b", fontSize: 13, fontWeight: "600" },

  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, gap: 8 },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    // transition feel — slight shadow on all
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: { marginLeft: 6, fontWeight: "700", fontSize: 14 },

  modalBg:    { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modal:      { backgroundColor: "#fff", borderRadius: 24, padding: 20 },
  replyModal: { backgroundColor: "#fff", borderRadius: 24, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#111", marginBottom: 18 },
  modalCat:   { backgroundColor: "#f1f5f9", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginRight: 10 },
  input:      { backgroundColor: "#f8fafc", borderRadius: 16, paddingHorizontal: 16, height: 55, marginBottom: 14 },
  textArea:   { backgroundColor: "#f8fafc", borderRadius: 16, paddingHorizontal: 16, paddingTop: 16, height: 130, textAlignVertical: "top" },
  modalBtnRow:{ flexDirection: "row", marginTop: 18 },
  cancelBtn:  { flex: 1, backgroundColor: "#e2e8f0", paddingVertical: 14, borderRadius: 16, alignItems: "center", marginRight: 8 },
  postBtn:    { flex: 1, backgroundColor: "#2563eb", paddingVertical: 14, borderRadius: 16, alignItems: "center", marginLeft: 8 },
  cancelText: { color: "#111", fontWeight: "700" },
  postText:   { color: "#fff", fontWeight: "700" },

  replyCard:   { backgroundColor: "#f8fafc", borderRadius: 16, padding: 14, marginBottom: 12 },
  replyAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  replyName:   { fontSize: 15, fontWeight: "700", color: "#111827" },
  replyTime:   { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  replyText:   { marginTop: 10, fontSize: 14, lineHeight: 22, color: "#334155" },
});