// app/index.tsx
// Modern Responsive Alumni Dashboard
// Works beautifully on Mobile + Tablet + Web

import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import Footer from "../components/Footer";
import Header from "../components/Header";

const { width } = Dimensions.get("window");

const isWeb = Platform.OS === "web";
const isTablet = width >= 768;
const isDesktop = width >= 1150;

const API = "http://192.168.29.217:2000";

const EVENT_COLORS = [
  "#EEF2FF",
  "#DCFCE7",
  "#FEF3C7",
  "#FEE2E2",
  "#F3E8FF",
];

const JOB_COLORS = [
  "#EEF2FF",
  "#DCFCE7",
  "#FEF3C7",
  "#FEE2E2",
  "#F3E8FF",
];

const TESTIMONIALS = [
  {
    initials: "PV",
    bg: "#8b5cf6",
    name: "Priya Verma",
    role: "UI/UX Designer, Adobe",
    text: "This platform helped me reconnect with classmates and discover amazing career opportunities.",
  },
  {
    initials: "AP",
    bg: "#f97316",
    name: "Aman Patel",
    role: "Data Scientist, Microsoft",
    text: "The mentorship sessions gave me confidence to crack my dream interview.",
  },
  {
    initials: "RM",
    bg: "#10b981",
    name: "Rohan Mehta",
    role: "Founder, TechNova",
    text: "The alumni network became the biggest support system for my startup journey.",
  },
];

function Container({ children }: any) {
  return (
    <View
      style={{
        width: "100%",
        maxWidth: 1350,
        alignSelf: "center",
      }}
    >
      {children}
    </View>
  );
}

function Avatar({
  initials,
  bg,
  size = 52,
}: {
  initials: string;
  bg: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontWeight: "800",
          fontSize: size * 0.3,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {action && (
        <Pressable onPress={onPress}>
          <Text style={styles.viewAll}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const scrollY = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const [events, setEvents] = useState<any[]>([]);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const [stats, setStats] = useState({
    total_members: 0,
    total_events: 0,
  });

  const [searchName, setSearchName] = useState("");

  const greeting = useMemo(() => {
    const h = new Date().getHours();

    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";

    return "Good Evening";
  }, []);

  useEffect(() => {
    fetchAll();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),

        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const fetchAll = async () => {
    try {
      const [evRes, alRes, jobRes, statRes] = await Promise.all([
        axios.get(`${API}/events`),
        axios.get(`${API}/alumni`),
        axios.get(`${API}/jobs`),
        axios.get(`${API}/admin/stats`),
      ]);

      setEvents(
        (evRes.data.events || [])
          .filter((e: any) => e.status === "Upcoming")
          .slice(0, 6)
      );

      setAlumni((alRes.data.data || []).slice(0, 8));

      setJobs(
        (jobRes.data.jobs || [])
          .filter((j: any) => !j.is_closed)
          .slice(0, 6)
      );

      if (statRes.data.success) {
        setStats(statRes.data.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const eventWidth = isDesktop ? "31%" : isTablet ? 280 : 230;

  const headerBg = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: ["transparent", "#0d1b3e"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.safe}>
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            backgroundColor: headerBg,
          },
        ]}
      >
        <Header />
      </Animated.View>

      <Animated.ScrollView
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
          }
        )}
      >
        {/* HERO */}

        <LinearGradient
          colors={["#0d1b3e", "#142c63", "#0d1b3e"]}
          style={styles.hero}
        >
          <Container>
            <View
              style={[
                styles.heroInner,
                isDesktop && {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
              ]}
            >
              {/* LEFT */}

              <View style={{ flex: 1 }}>
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>
                    SVIMS Alumni Association
                  </Text>
                </View>

                <Text style={styles.greeting}>
                  {greeting} 👋
                </Text>

                <Text style={styles.heroTitle}>
                  Connect.
                  {"\n"}
                  Inspire.
                  {"\n"}
                  <Text style={{ color: "#f0a500" }}>
                    Grow Together.
                  </Text>
                </Text>

                <Text style={styles.heroDesc}>
                  Reconnect with classmates, discover opportunities,
                  attend alumni events, and grow professionally with
                  your alumni community.
                </Text>

                <View style={styles.heroBtns}>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => router.push("/event_detail")}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.primaryBtnText}>
                      Explore Events
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => router.push("/alumnidirectory")}
                  >
                    <Ionicons
                      name="people-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.secondaryBtnText}>
                      Alumni Directory
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>
                      {stats.total_members || 2400}+
                    </Text>
                    <Text style={styles.statLabel}>Alumni</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>180+</Text>
                    <Text style={styles.statLabel}>Companies</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statNum}>
                      {stats.total_events || 12}
                    </Text>
                    <Text style={styles.statLabel}>Events</Text>
                  </View>
                </View>
              </View>

              {/* RIGHT */}

              {isDesktop && (
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateY: floatAnim,
                      },
                    ],
                  }}
                >
                  <Image
                    source={{
                      uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                    }}
                    style={{
                      width: 420,
                      height: 420,
                      resizeMode: "contain",
                    }}
                  />
                </Animated.View>
              )}
            </View>
          </Container>
        </LinearGradient>

        {/* SEARCH */}

        {/* EVENTS */}

        <Container>
          <SectionHeader
            title="Upcoming Events"
            action="View All →"
            onPress={() => router.push("/event_detail")}
          />

          <View
            style={[
              styles.grid,
              isDesktop && {
                justifyContent: "space-between",
              },
            ]}
          >
            {events.map((item, index) => (
              <Pressable
                key={item.event_id}
                onPress={() => router.push("/event_detail")}
                style={({ hovered }) => [
                  styles.card,
                  {
                    width: eventWidth,
                  },
                  hovered &&
                    isWeb && {
                      transform: [{ translateY: -6 }],
                      borderColor: "#4F46E5",
                    },
                ]}
              >
                <View
                  style={[
                    styles.cardImage,
                    {
                      backgroundColor:
                        EVENT_COLORS[
                          index % EVENT_COLORS.length
                        ],
                    },
                  ]}
                >
                  {item.cover_photo ? (
                    <Image
                      source={{
                        uri: API + item.cover_photo,
                      }}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <Ionicons
                      name="calendar-outline"
                      size={42}
                      color="#4F46E5"
                    />
                  )}
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardDate}>
                    {item.event_date}
                  </Text>

                  <Text
                    style={styles.cardTitle}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={styles.cardMeta}
                    numberOfLines={1}
                  >
                    {item.venue}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Container>

        {/* ALUMNI */}

        <Container>
          <SectionHeader
            title="Alumni Spotlights"
            action="View All →"
            onPress={() => router.push("/alumnidirectory")}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 18,
              paddingBottom: 20,
            }}
          >
            {alumni.map((a: any, index: number) => {
              const initials =
                a.full_name
                  ?.split(" ")
                  .map((x: string) => x[0])
                  .join("")
                  .toUpperCase() || "AL";

              return (
                <Pressable
                  key={a.id}
                  style={({ hovered }) => [
                    styles.alumniCard,
                    hovered &&
                      isWeb && {
                        transform: [{ translateY: -5 }],
                      },
                  ]}
                >
                  {a.profile_photo ? (
                    <Image
                      source={{
                        uri: `${API}/uploads/${a.profile_photo}`,
                      }}
                      style={styles.alumniAvatar}
                    />
                  ) : (
                    <Avatar
                      initials={initials}
                      bg={
                        EVENT_COLORS[
                          index % EVENT_COLORS.length
                        ]
                      }
                    />
                  )}

                  <Text
                    style={styles.alumniName}
                    numberOfLines={1}
                  >
                    {a.full_name}
                  </Text>

                  <Text
                    style={styles.alumniRole}
                    numberOfLines={1}
                  >
                    {a.designation || "Alumni"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Container>

        {/* JOBS */}

        <Container>
          <SectionHeader
            title="Career Opportunities"
            action="Explore →"
            onPress={() => router.push("/job")}
          />

          <View style={styles.jobGrid}>
            {jobs.map((job, index) => (
              <Pressable
                key={job.id}
                style={({ hovered }) => [
                  styles.jobCard,
                  hovered &&
                    isWeb && {
                      transform: [{ scale: 1.02 }],
                    },
                ]}
              >
                <View
                  style={[
                    styles.jobIcon,
                    {
                      backgroundColor:
                        JOB_COLORS[
                          index % JOB_COLORS.length
                        ],
                    },
                  ]}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={22}
                    color="#4F46E5"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={styles.jobTitle}
                    numberOfLines={1}
                  >
                    {job.title}
                  </Text>

                  <Text
                    style={styles.jobMeta}
                    numberOfLines={1}
                  >
                    {job.company} • {job.location}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Container>

        {/* TESTIMONIALS */}

        <Container>
          <SectionHeader title="What Our Alumni Say" />

          <View style={styles.testimonialGrid}>
            {TESTIMONIALS.map((t, index) => (
              <View key={index} style={styles.testimonialCard}>
                <Text style={styles.quote}>"</Text>

                <Text style={styles.testimonialText}>
                  {t.text}
                </Text>

                <View style={styles.authorRow}>
                  <Avatar
                    initials={t.initials}
                    bg={t.bg}
                    size={42}
                  />

                  <View>
                    <Text style={styles.authorName}>
                      {t.name}
                    </Text>

                    <Text style={styles.authorRole}>
                      {t.role}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Container>

        {/* DONATE */}

        <Container>
          <LinearGradient
            colors={["#fff7ed", "#fef3c7"]}
            style={styles.donateBanner}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.donateTitle}>
                🎓 Support Future Generations
              </Text>

              <Text style={styles.donateDesc}>
                Help students through scholarships, mentorship,
                and community programs.
              </Text>
            </View>

            <Pressable
              style={styles.donateBtn}
              onPress={() => router.push("/donation")}
            >
              <Text style={styles.donateBtnText}>
                Donate Now
              </Text>
            </Pressable>
          </LinearGradient>
        </Container>

        <Footer />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  stickyHeader: {
    position: "absolute",
    width: "100%",
    zIndex: 999,
  },

  hero: {
    paddingTop: 120,
    paddingBottom: 70,
    paddingHorizontal: 20,
  },

  heroInner: {
    gap: 30,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    marginBottom: 20,
  },

  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f0a500",
  },

  badgeText: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "700",
  },

  greeting: {
    color: "#f0a500",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },

  heroTitle: {
    fontSize: isDesktop ? 62 : 38,
    lineHeight: isDesktop ? 72 : 46,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -2,
    marginBottom: 18,
  },

  heroDesc: {
    color: "#b6c4db",
    fontSize: 15,
    lineHeight: 25,
    maxWidth: 550,
    marginBottom: 30,
  },

  heroBtns: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 35,
  },

  primaryBtn: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },

  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },

  secondaryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  statsRow: {
    flexDirection: "row",
    gap: 18,
    flexWrap: "wrap",
  },

  statBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 18,
    minWidth: 120,
  },

  statNum: {
    color: "#f0a500",
    fontSize: 28,
    fontWeight: "900",
  },

  statLabel: {
    color: "#dbeafe",
    marginTop: 4,
  },

  searchBox: {
    backgroundColor: "#ffffffee",
    marginTop: -40,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 22,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 5,
  },

  searchTop: {
    marginBottom: 18,
  },

  searchTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },

  searchSub: {
    color: "#64748b",
    marginTop: 4,
  },

  searchRow: {
    flexDirection: isTablet ? "row" : "column",
    gap: 12,
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },

  searchBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  searchBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 20,
  },

  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
  },

  viewAll: {
    color: "#4F46E5",
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "#e2e8f0",

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,

    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 4,
  },

  cardImage: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },

  cardBody: {
    padding: 18,
  },

  cardDate: {
    color: "#64748b",
    fontSize: 12,
    marginBottom: 6,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },

  cardMeta: {
    color: "#64748b",
  },

  alumniCard: {
    width: 130,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 22,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 4,
  },

  alumniAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginBottom: 12,
  },

  alumniName: {
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },

  alumniRole: {
    color: "#64748b",
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },

  jobGrid: {
    paddingHorizontal: 20,
    gap: 14,
  },

  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,

    flexDirection: "row",
    alignItems: "center",
    gap: 14,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 4,
  },

  jobIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  jobTitle: {
    fontWeight: "800",
    color: "#0f172a",
    fontSize: 15,
  },

  jobMeta: {
    color: "#64748b",
    marginTop: 4,
  },

  testimonialGrid: {
    paddingHorizontal: 20,
    gap: 18,
    paddingBottom: 20,
  },

  testimonialCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 24,

    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 3,
  },

  quote: {
    fontSize: 48,
    color: "#cbd5e1",
    fontWeight: "900",
  },

  testimonialText: {
    color: "#475569",
    lineHeight: 24,
    marginBottom: 20,
    marginTop: -10,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  authorName: {
    fontWeight: "800",
    color: "#0f172a",
  },

  authorRole: {
    color: "#64748b",
    marginTop: 2,
  },

  donateBanner: {
    margin: 20,
    borderRadius: 28,
    padding: 28,
    flexDirection: isDesktop ? "row" : "column",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },

  donateTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },

  donateDesc: {
    color: "#475569",
    lineHeight: 24,
    maxWidth: 600,
  },

  donateBtn: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },

  donateBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});