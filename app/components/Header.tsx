import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const API = "http://192.168.29.217:2000";

const scaleSize = (size: number) =>
  width < 400 ? size * 0.9 : width > 768 ? size * 1.2 : size;

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  // Forum visited flag — in-memory, resets on app restart
  const forumVisited = useRef(false);

  const router = useRouter();

  const scale = useSharedValue(1);
  const translateX = useSharedValue(-40);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.1, { duration: 1000 }), -1, true);
    translateX.value = withTiming(0, { duration: 500 });
    opacity.value = withTiming(1, { duration: 700 });
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  // ── Refresh counts on every screen focus
 // useFocusEffect mein — forumVisited.current reset karo
// Taaki naye screen pe aane par count dobara fetch ho
useFocusEffect(
  useCallback(() => {
    loadUser();
    fetchNotifCount();

    // Forum visited flag reset — taaki count fresh aaye
    forumVisited.current = false;  // ← YEH ADD KARO
    fetchForumCount();

    const interval = setInterval(() => {
      fetchNotifCount();
      if (!forumVisited.current) {
        fetchForumCount();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [])
);
  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (data) setUser(JSON.parse(data));
    } catch (err) {
      console.log("loadUser:", err);
    }
  };

  const getUserId = async (): Promise<number | null> => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (!data) return null;
      return JSON.parse(data).id;
    } catch {
      return null;
    }
  };

  const fetchNotifCount = async () => {
    try {
      const id = await getUserId();
      if (!id) return;
      const res = await axios.get(`${API}/notifications/unread-count/${id}`);
      if (res.data.success) setUnreadNotifs(res.data.count ?? 0);
    } catch (err: any) {
      console.log("Notif error:", err?.message);
    }
  };

  const fetchForumCount = async () => {
    try {
      const id = await getUserId();
      if (!id) return;
      const res = await axios.get(`${API}/forum/count/${id}`);
      if (res.data.success) setUnreadMsgs(res.data.count ?? 0);
    } catch (err: any) {
      console.log("Forum count error:", err?.message);
    }
  };

  const handleProfilePress = async () => {
    try {
      const email = await AsyncStorage.getItem("userEmail");
      router.push(
        email
          ? { pathname: "/profile", params: { email } }
          : "/loginscreen"
      );
    } catch {
      router.push("/loginscreen");
    }
  };

  const handleNotifPress = async () => {
    setUnreadNotifs(0);
    try {
      const id = await getUserId();
      if (id) {
        await axios.patch(`${API}/notifications/mark-read/${id}`);
      }
    } catch (err: any) {
      console.log("mark-read:", err?.message);
    }
    router.push("/notification");
  };

  const handleMsgPress = async () => {
    setUnreadMsgs(0);
    forumVisited.current = true;  // ab interval mein count fetch nahi hoga
  
    try {
      const id = await getUserId();
      if (id) {
        await axios.post(`${API}/forum/seen/${id}`);  // await karo
        console.log("Forum seen marked");
      }
    } catch (err) {
      console.log("seen error:", err);
    }
  
    router.push("/form");
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.wrapper}>
      <LinearGradient
        colors={["#f52e65", "#f98c0a"]}
        style={styles.header}
      >
        {/* LEFT — Logo + Title */}
        <View style={styles.left}>
          <Animated.Image
            source={require("../../assets/Alumni_Pics/icon.png")}
            style={[styles.logo, logoStyle]}
          />
          <Animated.View style={[styles.textContainer, textStyle]}>
            <Text numberOfLines={1} style={styles.title}>
              Alumni Connect
            </Text>
          </Animated.View>
        </View>

        {/* RIGHT — Icons */}
        <View style={styles.right}>

          {/* NOTIFICATIONS */}
          <TouchableOpacity style={styles.iconBtn} onPress={handleNotifPress}>
            <View>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <Badge count={unreadNotifs} />
            </View>
          </TouchableOpacity>

          {/* FORUM */}
          <TouchableOpacity style={styles.iconBtn} onPress={handleMsgPress}>
            <View>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
              <Badge count={unreadMsgs} />
              {unreadMsgs === 0 && <View style={styles.onlineDot} />}
            </View>
          </TouchableOpacity>

          {/* PROFILE */}
          <TouchableOpacity style={styles.iconBtn} onPress={handleProfilePress}>
            {user?.profile_photo ? (
              <Image
                source={{ uri: `${API}/uploads/${user.profile_photo}` }}
                style={styles.profileImg}
              />
            ) : (
              <Ionicons name="person-circle-outline" size={26} color="#fff" />
            )}
          </TouchableOpacity>

        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#f52e65",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(12),
    elevation: 8,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: scaleSize(53),
    height: scaleSize(50),
    borderRadius: 30,
    marginRight: 9,
    borderWidth: 2,
    borderColor: "#fff",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: scaleSize(22),
    fontWeight: "bold",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    marginLeft: 12,
    padding: 6,
  },
  profileImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#fff",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
  onlineDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});