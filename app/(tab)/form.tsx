import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
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
// Yeh line add karo (Header import ke saath):
import { useFocusEffect } from "@react-navigation/native";

import Header from "../components/Header";
//////////////////////////////////////////////////////
// API URL
//////////////////////////////////////////////////////

const API_URL = "http://192.168.29.217:2000";

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
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);
const [replyModal, setReplyModal] =
  useState(false);

const [selectedPost, setSelectedPost] =
  useState<any>(null);

const [replyText, setReplyText] =
  useState("");
  const [replies, setReplies] =
  useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const postScale = useSharedValue(1);

  useEffect(() => {
    postScale.value = withRepeat(
      withTiming(1.08, {
        duration: 900,
      }),
      -1,
      true
    );
  }, []);
 


  const postAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: postScale.value,
        },
      ],
    };
  });
  //////////////////////////////////////////////////////
  // CREATE POST STATES
  //////////////////////////////////////////////////////

  const [subject, setSubject] =
    useState("");

  const [body, setBody] = useState("");

  const [category, setCategory] =
    useState("Question");

  const categories = [
    "All",
    "Suggestion",
    "Feedback",
    "Question",
    "Announcement",
  ];

  //////////////////////////////////////////////////////
  // LOAD USER
  //////////////////////////////////////////////////////

  useEffect(() => {
    loadUser();
    fetchPosts();
  }, []);

  const loadUser = async () => {
    const data =
      await AsyncStorage.getItem(
        "user"
      );

    if (data) {
      setUser(JSON.parse(data));
    }
  };

  //////////////////////////////////////////////////////
  // FETCH POSTS
  //////////////////////////////////////////////////////

  const fetchPosts = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/forum/posts`
      );

      setPosts(res.data.data);
    } catch (err) {
      console.log(err);

      Alert.alert(
        "Error",
        "Failed to load posts"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  //////////////////////////////////////////////////////
  // REFRESH
  //////////////////////////////////////////////////////

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  //////////////////////////////////////////////////////
  // CREATE POST
  //////////////////////////////////////////////////////

  const handleCreatePost =
    async () => {
      if (!subject || !body) {
        Alert.alert(
          "Validation",
          "Please fill all fields"
        );
        return;
      }

      try {
        await axios.post(
          `${API_URL}/forum/create`,
          {
            user_id: user.id,
            category,
            subject,
            body,
          }
        );

        Alert.alert(
          "Success",
          "Post created successfully"
        );

        setSubject("");
        setBody("");
        setCategory("Question");

        setShowModal(false);

        fetchPosts();
      } catch (err) {
        console.log(err);

        Alert.alert(
          "Error",
          "Failed to create post"
        );
      }
    };

  //////////////////////////////////////////////////////
  // LIKE / UNLIKE
  //////////////////////////////////////////////////////

  const handleLike = async (
    postId: number
  ) => {
  
    try {
  
      await axios.post(
        `${API_URL}/forum/like`,
        {
          post_id: postId,
          user_id: user.id,
        }
      );
  
      // fresh data from backend
      fetchPosts();
  
    } catch (err) {
      console.log(err);
    }
  };
  //////////////////////////////////////////////////////
  // REPORT
  //////////////////////////////////////////////////////

  const handleReport = async (
    postId: number
  ) => {
  
    try {
  
      const res = await axios.post(
        `${API_URL}/forum/report`,
        {
          post_id: postId,
          reported_by: user.id,
          reason: "Abusive Content",
        }
      );
  
      Alert.alert(
        "Report",
        res.data.message
      );
  
      fetchPosts();
  
    } catch (err) {
  
      console.log(err);
  
      Alert.alert(
        "Error",
        "Failed to report post"
      );
    }
  };

const fetchReplies = async (
    postId: number
  ) => {
  
    try {
  
      const res =
        await axios.get(
          `${API_URL}/forum/replies/${postId}`
        );
  
      setReplies(res.data.data);
  
    } catch (err) {
      console.log(err);
    }
  };
const handleReply = async () => {

    if (!replyText) {
      Alert.alert(
        "Validation",
        "Please write reply"
      );
      return;
    }
  
    try {
  
      await axios.post(
        `${API_URL}/forum/reply`,
        {
          post_id: selectedPost.id,
          user_id: user.id,
          reply: replyText,
        }
      );
  
      Alert.alert(
        "Success",
        "Reply added"
      );
  
      setReplyText("");
      setReplyModal(false);
  
      fetchPosts();
  
    } catch (err) {
  
      console.log(err);
  
      Alert.alert(
        "Error",
        "Reply failed"
      );
    }
  };
  //////////////////////////////////////////////////////
  // FILTER POSTS
  //////////////////////////////////////////////////////
 
  const filteredPosts = posts.filter(
    (item) => {
      const matchCategory =
        selectedCategory === "All"
          ? true
          : item.category ===
            selectedCategory;

      const matchSearch =
        item.subject
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        item.body
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      return (
        matchCategory && matchSearch
      );
    }
  );

  //////////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////////

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />
      </View>
    );
  }
//////////////////////////////////////////////////////
// TIME FORMAT
//////////////////////////////////////////////////////

const formatTimeAgo = (
    dateString: string
  ): string => {
  
    const now = new Date();
  
    const postDate =
      new Date(dateString);
  
    const seconds =
      Math.floor(
        (now.getTime() -
          postDate.getTime()) /
          1000
      );
  
    const minutes =
      Math.floor(seconds / 60);
  
    const hours =
      Math.floor(minutes / 60);
  
    const days =
      Math.floor(hours / 24);
  
    const weeks =
      Math.floor(days / 7);
  
    const months =
      Math.floor(days / 30);
  
    const years =
      Math.floor(days / 365);
  
    if (seconds < 60) {
      return "Just now";
    }
  
    if (minutes < 60) {
      return `${minutes} m ago`;
    }
  
    if (hours < 24) {
      return `${hours} h ago`;
    }
  
    if (days < 7) {
      return `${days} d ago`;
    }
  
    if (weeks < 5) {
      return `${weeks} w ago`;
    }
  
    if (months < 12) {
      return `${months} mo ago`;
    }
  
    return `${years} y ago`;
  };
  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////
  const categoryColor = (cat: string) => {
    switch (cat) {
      case "Question":    return { bg: "#DBEAFE", text: "#2563EB" };
      case "Suggestion":  return { bg: "#DCFCE7", text: "#16A34A" };
      case "Feedback":    return { bg: "#FEF3C7", text: "#D97706" };
      case "Announcement":return { bg: "#F3E8FF", text: "#7C3AED" };
      default:            return { bg: "#F1F5F9", text: "#64748B" };
    }
  };
  return (
    <View
      style={styles.container}
    >
          <Header />
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) =>
          item.id.toString()
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <LinearGradient
  colors={["#0f172a", "#1e3a8a"]}
  style={styles.header}
>
  <View style={styles.forumTopRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.heading}>Alumni Forum</Text>
      <Text style={styles.subHeading}>Connect with alumni community</Text>
    </View>
    <Animated.View style={postAnimatedStyle}>
      <TouchableOpacity
        style={styles.createBtnInline}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.createInlineText}>Post</Text>
      </TouchableOpacity>
    </Animated.View>
  </View>

  {/* SEARCH BOX */}
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

  {/* DROPDOWN */}
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
              setSearch("");
              setSearchFocused(false);
              setSelectedPost(item);
              fetchReplies(item.id);
              setReplyModal(true);
            }}
          >
            <Image
              source={{
                uri: item.profile_photo
                  ? `${API_URL}/uploads/${item.profile_photo}`
                  : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
              }}
              style={styles.dropdownAvatar}
            />
            <View style={styles.dropdownInfo}>
              <Text style={styles.dropdownTitle} numberOfLines={1}>{item.subject}</Text>
              <Text style={styles.dropdownMeta}>{item.full_name} · {formatTimeAgo(item.created_at)}</Text>
            </View>
            <View style={[styles.dropdownBadge, { backgroundColor: categoryColor(item.category).bg }]}>
              <Text style={[styles.dropdownBadgeText, { color: categoryColor(item.category).text }]}>
                {item.category}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

    </View>
  )}

</LinearGradient>

            {/* CREATE BUTTON */}
            

            {/* CATEGORY FILTER */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.categoryContainer
              }
            >
              {categories.map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryBtn,

                      selectedCategory ===
                        cat &&
                        styles.activeCategory,
                    ]}
                    onPress={() =>
                      setSelectedCategory(
                        cat
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.categoryText,

                        selectedCategory ===
                          cat &&
                          styles.activeCategoryText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* TOP */}
            <View style={styles.topRow}>
              <Image
                source={{
                  uri:
                    item.profile_photo
                      ? `${API_URL}/uploads/${item.profile_photo}`
                      : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                }}
                style={styles.avatar}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {item.full_name}
                </Text>

                <Text style={styles.role}>
                  {item.programme} •{" "}
                  {item.batch_year}
                </Text>

                <Text style={styles.time}>
  {formatTimeAgo(item.created_at)}
</Text>
              </View>

              <View style={styles.badge}>
                <Text
                  style={styles.badgeText}
                >
                  {item.category}
                </Text>
              </View>
            </View>

            {/* SUBJECT */}
            <Text style={styles.subject}>
              {item.subject}
            </Text>

            {/* BODY */}
            <Text style={styles.body}>
              {item.body}
            </Text>

            {/* STATS */}
            <View style={styles.statsRow}>
              <Text style={styles.stats}>
                👍 {item.likes_count}
              </Text>

              <Text style={styles.stats}>
                💬 {item.replies_count}
              </Text>

              <Text style={styles.stats}>
                🚩{" "}
                {item.reports_count}
              </Text>
            </View>

            {/* ACTIONS */}
            <View style={styles.actionRow}>

  {/* LIKE */}
  <TouchableOpacity
  style={[
    styles.actionBtn,

    (
      item.liked_by_user === true ||
      item.liked_by_user === 1 ||
      item.liked_by_user === "1"
    ) && {
      backgroundColor: "#2563eb",
      borderColor: "#2563eb",
    },
  ]}
  onPress={() =>
    handleLike(item.id)
  }
>
  <Ionicons
    name={
      item.liked_by_user === true ||
      item.liked_by_user === 1 ||
      item.liked_by_user === "1"
        ? "thumbs-up"
        : "thumbs-up-outline"
    }
    size={18}
    color={
      item.liked_by_user === true ||
      item.liked_by_user === 1 ||
      item.liked_by_user === "1"
        ? "#fff"
        : "#2563eb"
    }
  />

  <Text
    style={[
      styles.actionText,
      {
        color:
          item.liked_by_user === true ||
          item.liked_by_user === 1 ||
          item.liked_by_user === "1"
            ? "#fff"
            : "#2563eb",
      },
    ]}
  >
    {item.likes_count}
  </Text>
</TouchableOpacity>
  {/* REPLY */}
  <TouchableOpacity
  style={styles.actionBtn}
  onPress={() => {

    setSelectedPost(item);

    fetchReplies(item.id);

    setReplyModal(true);
  }}
>
  <Ionicons
    name="chatbubble-outline"
    size={18}
    color="#2563eb"
  />

  <Text style={styles.actionText}>
    {item.replies_count}
  </Text>
</TouchableOpacity>

  {/* REPORT */}
  <TouchableOpacity
  style={[
    styles.actionBtn,

    item.isReported && {
      backgroundColor: "#fee2e2",
    },
  ]}
  onPress={() =>
    handleReport(item.id)
  }
>
  <Ionicons
    name={
      item.isReported
        ? "flag"
        : "flag-outline"
    }
    size={18}
    color="#ef4444"
  />

  <Text
    style={[
      styles.actionText,
      {
        color: "#ef4444",
      },
    ]}
  >
    {item.reports_count}
  </Text>
</TouchableOpacity>

</View>
</View>
        )}
      />

      {/* CREATE POST MODAL */}

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Create Post
            </Text>

            {/* CATEGORY */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              style={{
                marginBottom: 14,
              }}
            >
              {categories
                .filter(
                  (c) => c !== "All"
                )
                .map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modalCat,

                      category === cat && {
                        backgroundColor:
                          "#2563eb",
                      },
                    ]}
                    onPress={() =>
                      setCategory(cat)
                    }
                  >
                    <Text
                      style={{
                        color:
                          category === cat
                            ? "#fff"
                            : "#111",
                        fontWeight: "700",
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <TextInput
              placeholder="Subject"
              value={subject}
              onChangeText={setSubject}
              style={styles.input}
            />

            <TextInput
              placeholder="Write something..."
              value={body}
              onChangeText={setBody}
              multiline
              style={styles.textArea}
            />

            <View
              style={styles.modalBtnRow}
            >
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() =>
                  setShowModal(false)
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.postBtn}
                onPress={
                  handleCreatePost
                }
              >
                <Text
                  style={styles.postText}
                >
                  Post
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
   
      <Modal
  visible={replyModal}
  transparent
  animationType="slide"
>
  <View style={styles.modalBg}>

    <View style={styles.replyModal}>

      <Text style={styles.modalTitle}>
        Replies
      </Text>

      {/* REPLY LIST */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        style={{
          maxHeight: 300,
        }}
      >

        {replies.length === 0 ? (

          <Text
            style={{
              textAlign: "center",
              color: "#64748b",
              marginBottom: 16,
            }}
          >
            No Replies Yet
          </Text>

        ) : (

          replies.map((item) => (

            <View
              key={item.id}
              style={styles.replyCard}
            >

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >

                <Image
                  source={{
                    uri:
                      item.profile_photo
                        ? `${API_URL}/uploads/${item.profile_photo}`
                        : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                  }}
                  style={
                    styles.replyAvatar
                  }
                />

                <View
                  style={{
                    flex: 1,
                  }}
                >

                  <Text
                    style={
                      styles.replyName
                    }
                  >
                    {
                      item.full_name
                    }
                  </Text>

                  <Text
                    style={
                      styles.replyTime
                    }
                  >
                   {formatTimeAgo(item.created_at)}
                  </Text>

                </View>

              </View>

              <Text
                style={
                  styles.replyText
                }
              >
                {item.reply}
              </Text>

            </View>
          ))
        )}
      </ScrollView>

      {/* INPUT */}

      <TextInput
        placeholder="Write reply..."
        multiline
        value={replyText}
        onChangeText={setReplyText}
        style={styles.textArea}
      />

      <View style={styles.modalBtnRow}>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() =>
            setReplyModal(false)
          }
        >
          <Text style={styles.cancelText}>
            Close
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postBtn}
          onPress={handleReply}
        >
          <Text style={styles.postText}>
            Reply
          </Text>
        </TouchableOpacity>

      </View>

    </View>

  </View>
</Modal>

    </View>
    
  );
}

////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  //////////////////////////////////////////////////////
  // HEADER
  //////////////////////////////////////////////////////

  header: {
    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 20,
    
  },

  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
  },

  subHeading: {
    fontSize: 15,
    color: "#cbd5e1",
    marginTop: 5,
    marginBottom: 20,
  },

  //////////////////////////////////////////////////////
  // SEARCH
  //////////////////////////////////////////////////////

  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 54,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111",
  },

  //////////////////////////////////////////////////////
  // CREATE BUTTON
  //////////////////////////////////////////////////////
  replyModal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
  },
  
  replyCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  forumTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  createBtnInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  
    backgroundColor: "#2563eb",
  
    paddingHorizontal: 18,
    paddingVertical: 11,
  
    borderRadius: 10,
  
    borderWidth: 1.5,
    borderColor: "#60a5fa",
  
    elevation: 10,
  
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  createInlineText: {
    color: "#fff",
    fontWeight: "800",
    marginLeft: 6,
    fontSize: 17,
    letterSpacing: 0.5,
  },
  replyAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  
  replyName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  
  replyTime: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  
  replyText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
  },
  
  createText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  clearBtn: {
    width: 26, height: 26,
    backgroundColor: "#F1F5F9",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
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
  dropdownHeaderLeft: {
    fontSize: 11, fontWeight: "700", color: "#94A3B8",
  },
  dropdownHeaderRight: {
    fontSize: 11, fontWeight: "600", color: "#94A3B8",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12, gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  dropdownAvatar: {
    width: 40, height: 40, borderRadius: 20,
  },
  dropdownInfo: { flex: 1 },
  dropdownTitle: {
    fontSize: 14, fontWeight: "700", color: "#0F172A",
  },
  dropdownMeta: {
    fontSize: 12, color: "#64748B", marginTop: 2,
  },
  dropdownBadge: {
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20,
  },
  dropdownBadgeText: {
    fontSize: 10, fontWeight: "700",
  },
  noResultText: {
    color: "#94A3B8", fontSize: 14,
    marginTop: 8, fontWeight: "600",
  },
  //////////////////////////////////////////////////////
  // CATEGORY
  //////////////////////////////////////////////////////

  categoryContainer: {
    paddingHorizontal: 14,
    marginTop: 18,
    paddingBottom: 8,
  },

  categoryBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
  },

  activeCategory: {
    backgroundColor: "#2563eb",
  },

  categoryText: {
    color: "#475569",
    fontWeight: "600",
  },

  activeCategoryText: {
    color: "#fff",
  },

  //////////////////////////////////////////////////////
  // CARD
  //////////////////////////////////////////////////////

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 18,
    elevation: 3,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginRight: 14,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  role: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  time: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },

  badge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  badgeText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
  },

  //////////////////////////////////////////////////////
  // CONTENT
  //////////////////////////////////////////////////////

  subject: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 18,
    lineHeight: 28,
  },

  body: {
    fontSize: 15,
    color: "#475569",
    marginTop: 12,
    lineHeight: 24,
  },

  //////////////////////////////////////////////////////
  // STATS
  //////////////////////////////////////////////////////

  statsRow: {
    flexDirection: "row",
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 14,
  },

  stats: {
    marginRight: 18,
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },

  //////////////////////////////////////////////////////
  // ACTIONS
  //////////////////////////////////////////////////////

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  
    backgroundColor: "#f8fafc",
  
    marginHorizontal: 4,
  
    borderRadius: 14,
  
    paddingVertical: 12,
  
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionText: {
    marginLeft: 6,
    fontWeight: "700",
    color: "#2563eb",
  },

  //////////////////////////////////////////////////////
  // MODAL
  //////////////////////////////////////////////////////

  modalBg: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    marginBottom: 18,
  },

  modalCat: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
  },

  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 55,
    marginBottom: 14,
  },

  textArea: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    height: 130,
    textAlignVertical: "top",
  },

  modalBtnRow: {
    flexDirection: "row",
    marginTop: 18,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginRight: 8,
  },

  postBtn: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginLeft: 8,
  },

  cancelText: {
    color: "#111",
    fontWeight: "700",
  },

  postText: {
    color: "#fff",
    fontWeight: "700",
  },
});