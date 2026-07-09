import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Footer from "../components/Footer";
import BirthdayModal from "./birthdaymodel";
import FeaturedAdCarousel from "./livead";
// ─── Responsive ────────────────────────────────────────────────────────────────
const { width: W } = Dimensions.get("window");
const isWeb     = Platform.OS === "web";
const isMobile  = W < 640;
const isTablet  = W >= 640 && W < 1100;
const isDesktop = W >= 1100;
const px        = isDesktop ? 48 : isTablet ? 28 : 18;
const API       = "http://10.254.25.118:2000";

// ─── Data ──────────────────────────────────────────────────────────────────────
const EVENT_PALETTES = [
  { bg: "#EEF2FF", icon: "#4F46E5" },
  { bg: "#DCFCE7", icon: "#16A34A" },
  { bg: "#FEF3C7", icon: "#D97706" },
  { bg: "#FEE2E2", icon: "#DC2626" },
  { bg: "#F3E8FF", icon: "#7C3AED" },
  { bg: "#FFEDD5", icon: "#EA580C" },
];

const JOB_PALETTES = [
  { bg: "#EEF2FF", icon: "#4F46E5" },
  { bg: "#DCFCE7", icon: "#16A34A" },
  { bg: "#FEF3C7", icon: "#D97706" },
  { bg: "#FEE2E2", icon: "#DC2626" },
  { bg: "#F3E8FF", icon: "#7C3AED" },
];

const TESTIMONIALS = [
  { initials: "PV", bg: "#8b5cf6", name: "Priya Verma",  role: "UI/UX Designer, Adobe",    stars: 5, text: "This platform helped me reconnect with classmates and discover amazing career opportunities I never would have found otherwise." },
  { initials: "AP", bg: "#f97316", name: "Aman Patel",   role: "Data Scientist, Microsoft", stars: 5, text: "The mentorship sessions gave me confidence and the skills to crack my dream job interview. Truly grateful for this community." },
  { initials: "RM", bg: "#10b981", name: "Rohan Mehta",  role: "Founder, TechNova",         stars: 5, text: "From finding co-founders to getting investor intros — the alumni network has been invaluable for building my startup." },
];

const MENTOR_FEATURES = [
  { icon: "person-outline",        title: "1-on-1 Mentorship", desc: "Dedicated sessions" },
  { icon: "compass-outline",       title: "Career Guidance",    desc: "Expert direction"  },
  { icon: "document-text-outline", title: "Resume Review",      desc: "Stand out faster"  },
  { icon: "mic-outline",           title: "Mock Interviews",    desc: "Practice & win"    },
];

const QUICK_LINKS = [
  { icon: "calendar-outline",   label: "Events",     route: "/event_detail",    color: "#EEF2FF", ic: "#4F46E5" },
  { icon: "people-outline",     label: "Directory",  route: "/alumnidirectory", color: "#DCFCE7", ic: "#16A34A" },
  { icon: "briefcase-outline",  label: "Jobs",       route: "/job",             color: "#FEF3C7", ic: "#D97706" },
  { icon: "heart-outline",      label: "Donate",     route: "/donation",        color: "#F3E8FF", ic: "#7C3AED" },
  { icon: "ribbon-outline",     label: "Mentorship", route: "/donation",        color: "#FFEDD5", ic: "#EA580C" },
];

// Office bearers — using require() for local assets
const OFFICE_BEARERS = [
  { role: "President",       name: "Dr. George Thomas",   img: require("../../assets/Alumni_Pics/director.jpg")       },
  { role: "Chairman",        name: "Mr. Sujeet Singhal",  img: require("../../assets/Alumni_Pics/Chairman.jpeg")      },
  { role: "Secretary",       name: "Mr. Upendra Jain",    img: require("../../assets/Alumni_Pics/Secretary.jpeg")     },
  { role: "Joint Secretary", name: "Mr. Sanjay Agrawal",  img: require("../../assets/Alumni_Pics/JointSecretary.jpeg")},
  { role: "Treasurer",       name: "Dr. Jitendra Jain",   img: require("../../assets/Alumni_Pics/img1.jpg")           },
  { role: "Member",          name: "Ms. Harsha Deshpande",img: require("../../assets/Alumni_Pics/Member.jpeg")        },
  { role: "Member",          name: "Dr. Vibhor Airen",    img: require("../../assets/Alumni_Pics/img1.jpg")           },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ initials, bg, size = 52 }: { initials: string; bg: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: size * 0.31 }}>{initials}</Text>
    </View>
  );
}

function Stars({ n = 5 }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {Array.from({ length: n }).map((_, i) => <Ionicons key={i} name="star" size={12} color="#f0a500" />)}
    </View>
  );
}

function Pill({ label, color = "#EEF2FF", textColor = "#4F46E5" }: any) {
  return (
    <View style={{ backgroundColor: color, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ fontSize: 10, fontWeight: "700", color: textColor }}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, sub, label = "View all →", onPress }: { title: string; sub?: string; label?: string; onPress?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: px, paddingTop: 36, paddingBottom: 18 }}>
      <View>
        <Text style={{ fontSize: isDesktop ? 24 : 20, fontWeight: "800", color: "#0f172a", letterSpacing: -0.5 }}>{title}</Text>
        {sub && <Text style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>{sub}</Text>}
      </View>
      {onPress && (
        <TouchableOpacity onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#4F46E5" }}>{label}</Text>
          <Ionicons name="arrow-forward" size={12} color="#4F46E5" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function Divider() { return <View style={{ height: 1, backgroundColor: "#f1f5f9", marginHorizontal: px }} />; }

// ── Calculate how many years a couple has been married, based on
//    anniversary_date. Handles same-day-today (0 → "New Milestone").
function getYearsTogether(anniversaryDateStr: string | null | undefined): number | null {
  if (!anniversaryDateStr) return null;
  const annivDate = new Date(anniversaryDateStr);
  if (isNaN(annivDate.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - annivDate.getFullYear();
  // If today's month/day hasn't reached the anniversary month/day yet this year, subtract 1
  const hasHadAnniversaryThisYear =
    today.getMonth() > annivDate.getMonth() ||
    (today.getMonth() === annivDate.getMonth() && today.getDate() >= annivDate.getDate());
  if (!hasHadAnniversaryThisYear) years -= 1;
  return Math.max(years, 0);
}

function OfficeBearerCard({
  item,
  index,
  fadeAnim,
}: {
  item: typeof OFFICE_BEARERS[0];
  index: number;
  fadeAnim: Animated.Value;
}) {
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  // Responsive Width
  const cardW = isDesktop
  ? (Math.min(W, 1400) - px * 2 - 48) / 4
  : isTablet
  ? (W - px * 2 - 24) / 3
  : 250;
  return (
    <Animated.View
      style={[
        styles.bearerCard,
        {
          width: cardW,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.bearerImgWrap}>
        <Image source={item.img} style={styles.bearerImg}  resizeMode="cover" />

        <LinearGradient
          colors={["transparent", "rgba(15,23,42,0.65)"]}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={styles.bearerInfo}>
        <View style={styles.bearerRolePill}>
          <Text style={styles.bearerRoleText}>{item.role}</Text>
        </View>

        <Text style={styles.bearerName} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </Animated.View>
  );
}
// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router   = useRouter();
  const scrollY  = useRef(new Animated.Value(0)).current;
  const floatY   = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bearerFade = useRef(new Animated.Value(0)).current;

  const [events,  setEvents]  = useState<any[]>([]);
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [bannerAds, setBannerAds] = useState<any[]>([]); // ← approved ad banners
  const [stats,   setStats]   = useState({ total_members: 0, total_events: 0, active_jobs: 0 });
  const [loading, setLoading] = useState(true);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  
  const [anniversaries, setAnniversaries] = useState<any[]>([]);
  // ── Birthday modal state (same pattern as the other home screen) ─────────
  const [userDateOfBirth, setUserDateOfBirth] = useState<string | null>(null);

  const formatDate = (date: any) => {
    const d = new Date(date);
  
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ─── SHOW ONLY 3 INITIALLY ─────────────────────────────────
  const visibleBearers = OFFICE_BEARERS.slice(0, 4);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning ☀️" : h < 18 ? "Good Afternoon ✨" : "Good Evening 🌙";
  }, []);

  // ─── Combined celebrations feed — birthdays + anniversaries in one row ──
  const celebrations = useMemo(() => {
    const bdayItems = birthdays.map((b) => ({ ...b, __type: "birthday" as const }));
    const annivItems = anniversaries.map((a) => ({ ...a, __type: "anniversary" as const }));
    return [...bdayItems, ...annivItems];
  }, [birthdays, anniversaries]);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatY,   { toValue: -12, duration: 2200, useNativeDriver: true }),
      Animated.timing(floatY,   { toValue: 0,   duration: 2200, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
    ])).start();

    Animated.timing(bearerFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    fetchAll();
    fetchUserProfile(); // ← fetch DOB for birthday modal trigger
  }, []);

  // ── Fetch user profile for birthday check ──────────────────────────────
  const fetchUserProfile = async () => {
    try {
      // Future API Call:
      // const profileRes = await axios.get(`${API}/user/me`);
      // setUserDateOfBirth(profileRes.data.dob);

      // For now, using today's date dynamically (YYYY-MM-DD) so the
      // modal triggers correctly when it actually matches user's DOB logic
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");

      const mockToday = `${yyyy}-${mm}-${dd}`;
      setUserDateOfBirth(mockToday);
    } catch (error) {
      console.log("Error fetching profile:", error);
    }
  };

  const fetchAll = async () => {
    try {
      const [evR, jbR, stR, bnR,bdR] = await Promise.allSettled([
        axios.get(`${API}/events`),
        axios.get(`${API}/jobs`),
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/banners/active`),
        axios.get(`${API}/birthdays/today`),
         // ← approved banner ads
      ]);
      if (evR.status === "fulfilled") setEvents((evR.value.data.events || []).filter((e: any) => e.status === "Upcoming").slice(0, 6));
      if (jbR.status === "fulfilled") setJobs((jbR.value.data.jobs || []).filter((j: any) => !j.is_closed).slice(0, 6));
      if (stR.status === "fulfilled" && stR.value.data.success) setStats(stR.value.data.data);
      if (bnR.status === "fulfilled" && bnR.value.data.success) setBannerAds(bnR.value.data.data || []);
      if (bdR.status === "fulfilled" && bdR.value.data.success) {
        setBirthdays(bdR.value.data.birthdays || []);
        setAnniversaries(bdR.value.data.anniversaries || []);
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const headerBg = scrollY.interpolate({ inputRange: [0, 140], outputRange: ["transparent", "rgba(13,27,62,0.98)"], extrapolate: "clamp" });
  const eW = isDesktop ? (W - px * 2 - 36) / 3 : isTablet ? 280 : 230;
  const bW = isDesktop ? 380 : isTablet ? 320 : 280;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 99, backgroundColor: headerBg, height: 64 }} pointerEvents="none" />

      <ScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 60 }}
>

        {/* ══════════════ HERO ══════════════ */}
        <LinearGradient
          colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0}}
          style={[styles.hero, { paddingHorizontal: px }]}
        >
          

          <View style={[styles.heroInner, isDesktop && { flexDirection: "row", alignItems: "center", gap: 40 }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.greetingBadge}>
                <Animated.View style={[styles.pingDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.greetingText}>{greeting}</Text>
              </View>

              <Text style={[styles.heroH1, isDesktop && { fontSize: 58, lineHeight: 70 }]}>
                Connect.{"\n"}Inspire.{"\n"}
                <Text style={{ color: "#fbbf24" }}>Grow Together.</Text>
              </Text>

              <Text style={[styles.heroDesc, isDesktop && { fontSize: 16, maxWidth: 520 }]}>
                Reconnect with classmates, discover career opportunities, find mentors, and grow professionally with your alumni community.
              </Text>

              <View style={styles.heroBtns}>
                <TouchableOpacity style={styles.heroBtnGold} onPress={() => router.push("/event_detail")} activeOpacity={0.88}>
                  <Ionicons name="calendar" size={17} color="#1e1b4b" />
                  <Text style={styles.heroBtnGoldText}>Explore Events</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroBtnGhost} onPress={() => router.push("/alumnidirectory")} activeOpacity={0.88}>
                  <Ionicons name="people-outline" size={17} color="#fff" />
                  <Text style={styles.heroBtnGhostText}>Alumni Directory</Text>
                </TouchableOpacity>
              </View>
            </View>
              
            {isDesktop && (
              <Animated.View style={[styles.heroIllus, { transform: [{ translateY: floatY }] }]}>
                <LinearGradient colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"]} style={styles.ilustGlass}>
                  <Ionicons name="school" size={120} color="rgba(255,255,255,0.25)" />
                  <Text style={styles.ilustText}>SVIMAA</Text>
                  <Text style={styles.ilustSub}>Alumni Network</Text>
                  <View style={styles.ilustPills}>
                    {["2,400+ Alumni", "180+ Companies", "95% Placement"].map((p, i) => (
                      <View key={i} style={styles.ilustPill}>
                        <Text style={styles.ilustPillText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                  
                </LinearGradient>
              </Animated.View>
            )}
          </View>
          {bannerAds.length > 0 && (
  <FeaturedAdCarousel ads={bannerAds} />
)}
        </LinearGradient>

        {/* ══════════ TODAY'S CELEBRATIONS — birthdays + anniversaries, one row ══════════ */}
        {celebrations.length > 0 && (
          <View style={[styles.birthdaySection, { paddingHorizontal: px }]}>
            <View style={styles.birthdayHeader}>
              <View style={styles.birthdayHeaderIconWrap}>
                <Text style={{ fontSize: 22 }}>🎉</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.birthdaySectionTitle}>Today's Celebrations</Text>
                <Text style={styles.birthdaySectionSub}>Birthdays & anniversaries — wish them well!</Text>
              </View>
              <View style={styles.celebCountPill}>
                <Text style={styles.celebCountText}>{celebrations.length}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.birthdayScrollContent}>
              {celebrations.map((item) => {
                const isBday = item.__type === "birthday";
                const years = isBday ? null : getYearsTogether(item.anniversary_date);

                return (
                  <TouchableOpacity
                    key={`${item.__type}-${item.id}`}
                    style={styles.birthdayCard}
                    activeOpacity={0.85}
                    onPress={() => router.push({ pathname: "/alumniprofile", params: { id: item.id } })}
                  >
                    <LinearGradient
                      colors={isBday ? ["#fff", "#fdf2f8"] : ["#fff", "#eff6ff"]}
                      style={styles.birthdayCardInner}
                    >
                      {/* Decorative confetti dots */}
                      <View style={styles.confettiDot1} />
                      <View style={styles.confettiDot2} />
                      <View style={styles.confettiDot3} />

                      {/* Type ribbon — top-left */}
                      <View
                        style={[
                          styles.typeRibbon,
                          { backgroundColor: isBday ? "#db2777" : "#2563eb" },
                        ]}
                      >
                        <Text style={styles.typeRibbonText}>{isBday ? "BIRTHDAY" : "ANNIVERSARY"}</Text>
                      </View>

                      {/* Years badge for anniversaries — top-right */}
                      {!isBday && years !== null && years > 0 && (
                        <View style={styles.yearsBadge}>
                          <Text style={styles.yearsBadgeText}>{years}{"\n"}YRS</Text>
                        </View>
                      )}

                      <View
                        style={[
                          styles.birthdayRing,
                          { borderColor: isBday ? "#fbcfe8" : "#BFDBFE" },
                        ]}
                      >
                        <View style={styles.birthdayAvatarWrap}>
                          {item.profile_photo ? (
                            <Image source={{ uri: `${API}/uploads/${item.profile_photo}` }} style={styles.birthdayAvatar} />
                          ) : (
                            <LinearGradient
                              colors={isBday ? ["#f472b6", "#ec4899"] : ["#60a5fa", "#3b82f6"]}
                              style={styles.birthdayFallbackAvatar}
                            >
                              <Text style={styles.birthdayFallbackText}>{item.full_name?.charAt(0)}</Text>
                            </LinearGradient>
                          )}
                          <View style={styles.cakeBadge}>
                            <Text style={{ fontSize: 12 }}>{isBday ? "🎂" : "💍"}</Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.birthdayName} numberOfLines={1}>{item.full_name}</Text>

                      {isBday ? (
                        item.batch_year ? (
                          <Text style={styles.birthdayBatch}>Batch {item.batch_year}</Text>
                        ) : null
                      ) : (
                        item.spouse_name ? (
                          <Text style={styles.birthdayBatch} numberOfLines={1}>& {item.spouse_name}</Text>
                        ) : null
                      )}

                      {isBday ? (
                        <View style={styles.birthdayWishBtn}>
                          <Ionicons name="gift-outline" size={12} color="#db2777" />
                          <Text style={styles.birthdayWishBtnText}>Say Happy Birthday</Text>
                        </View>
                      ) : (
                        <View style={styles.anniversaryYearsRow}>
                          <Ionicons name="heart" size={11} color="#2563eb" />
                          <Text style={styles.anniversaryYearsText}>
                            {years !== null
                              ? years === 0
                                ? "Just Married!"
                                : `${years} ${years === 1 ? "Year" : "Years"} Together`
                              : "Happy Anniversary"}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

<View style={{ marginTop: 24 }}>
  <LinearGradient
    colors={["#7c2d12", "#ea580c", "#fb923c"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.highlightHero, { paddingHorizontal: px }]}
  >
    <View style={styles.highlightDecor1} />
    <View style={styles.highlightDecor2} />

    <View style={styles.highlightInner}>
      <View>
        <View style={styles.highlightBadge}>
          <Ionicons
            name="calendar-outline"
            size={12}
            color="#fdba74"
          />

          <Text style={styles.highlightBadgeText}>
            Upcoming Events
          </Text>
        </View>

        <Text style={styles.highlightTitle}>
          Alumni Events & Meetups
        </Text>

        <Text style={styles.highlightSub}>
          Explore networking sessions, reunions,
          workshops and alumni activities.
        </Text>
      </View>

      {!isMobile && (
        <TouchableOpacity
          style={styles.highlightBtn}
          onPress={() => router.push("/event_detail")}
        >
          <Text
            style={[
              styles.highlightBtnText,
              { color: "#ea580c" },
            ]}
          >
            Explore Events
          </Text>

          <Ionicons
            name="arrow-forward"
            size={16}
            color="#ea580c"
          />
        </TouchableOpacity>
      )}
    </View>
  </LinearGradient>
</View>
<View style={{ marginTop: 35 }}></View>
        {events.length > 0 ? (
          <FlatList
            horizontal
            data={events}
            keyExtractor={i => i.event_id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: px, gap: 16, paddingBottom: 4 }}
            renderItem={({ item, index }) => {
              const p = EVENT_PALETTES[index % EVENT_PALETTES.length];
              return (
                <TouchableOpacity style={[styles.eventCard, { width: eW }]} onPress={() => router.push("/event_detail")} activeOpacity={0.88}>
                  <View style={[styles.eventThumb, { backgroundColor: p.bg }]}>
                    {item.cover_photo
                      ? <Image source={{ uri: API + item.cover_photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                      : <Ionicons name="calendar-outline" size={42} color={p.icon} />}
                    <View style={styles.eventDateBadge}>
                      <Text style={styles.eventDateBadgeText}>{formatDate(item.event_date)}</Text>
                    </View>
                  </View>
                  <View style={styles.eventBody}>
                    <Text style={styles.eventName} numberOfLines={2}>{item.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
                      <Ionicons name="location-outline" size={12} color={p.icon} />
                      <Text style={[styles.eventLoc, { color: p.icon }]} numberOfLines={1}>{item.venue}</Text>
                    </View>
                    <View style={styles.eventFooter}>
                      <View style={styles.eventStatusDot} />
                      <Text style={styles.eventStatus}>Upcoming</Text>
                      <View style={{ flex: 1 }} />
                      <View style={[styles.rsvpBtn, { backgroundColor: p.bg }]}>
                        <Text style={[styles.rsvpText, { color: p.icon }]}>RSVP</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No upcoming events</Text>
          </View>
        )}

        {/* ══════════ CAREER OPPORTUNITIES ══════════ */}
{/* ══════════ CAREER OPPORTUNITIES ══════════ */}

<View style={{ marginTop: 24 }}>
  <LinearGradient
    colors={["#052e16", "#15803d", "#22c55e"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.highlightHero, { paddingHorizontal: px }]}
  >
    <View style={styles.highlightDecor1} />
    <View style={styles.highlightDecor2} />

    <View style={styles.highlightInner}>
      <View>
        <View style={styles.highlightBadge}>
          <Ionicons
            name="briefcase-outline"
            size={12}
            color="#86efac"
          />

          <Text style={styles.highlightBadgeText}>
            Careers
          </Text>
        </View>

        <Text style={styles.highlightTitle}>
          Career Opportunities
        </Text>

        <Text style={styles.highlightSub}>
          Find jobs, internships, referrals and
          hiring opportunities shared by alumni.
        </Text>
      </View>

      {!isMobile && (
        <TouchableOpacity
          style={styles.highlightBtn}
          onPress={() => router.push("/job")}
        >
          <Text
            style={[
              styles.highlightBtnText,
              { color: "#16a34a" },
            ]}
          >
            Explore Jobs
          </Text>

          <Ionicons
            name="arrow-forward"
            size={16}
            color="#16a34a"
          />
        </TouchableOpacity>
      )}
    </View>
  </LinearGradient>
</View>
{/* JOBS LIST */}
<View style={{ marginTop: 35 }}>
  
  </View>
        {jobs.length > 0 ? (
          <View style={[styles.jobsWrap, { paddingHorizontal: px }, isDesktop && { flexDirection: "row", flexWrap: "wrap", gap: 14 }]}>
            {jobs.map((job, i) => {
              const p = JOB_PALETTES[i % JOB_PALETTES.length];
              return (
                <TouchableOpacity
                  key={job.id}
                  style={[styles.jobItem, isDesktop && { width: "48%" }]}
                  onPress={() => router.push("/job")}
                  activeOpacity={0.88}
                >
                  <LinearGradient colors={[p.bg, "#fff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.jobGrad}>
                    <View style={[styles.jobIconBox, { backgroundColor: p.bg }]}>
                      <Ionicons name="briefcase-outline" size={22} color={p.icon} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                      <Text style={styles.jobMeta} numberOfLines={1}>{job.company} · {job.location}</Text>
                      <View style={styles.jobTags}>
                        {job.experience_range && <Pill label={job.experience_range} color={p.bg} textColor={p.icon} />}
                        {job.function_name && <Pill label={job.function_name} color="#f8fafc" textColor="#64748b" />}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.bookmarkBtn} activeOpacity={0.7}>
                      <Ionicons name="bookmark-outline" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="briefcase-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyText}>No active jobs</Text>
          </View>
        )}

        
<View style={{ marginTop: 12 }}>
  {/* Header */}
  <LinearGradient
    colors={["#1e3a8a", "#1d4ed8", "#3b82f6"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.bearerHero, { paddingHorizontal: px }]}
  >
    <View style={styles.bearerHeroDecor} />
    <View style={styles.bearerHeroDecor2} />

    <View
      style={[
        styles.bearerHeroInner,
        isDesktop && {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
      ]}
    >
      <View>
        <View style={styles.bearerBadge}>
          <Ionicons
            name="ribbon-outline"
            size={12}
            color="#fbbf24"
          />

          <Text style={styles.bearerBadgeText}>
            Leadership
          </Text>
        </View>

        <Text
          style={[
            styles.bearerHeroTitle,
            isDesktop && { fontSize: 30 },
          ]}
        >
          Office Bearers
        </Text>

        <Text style={styles.bearerHeroSub}>
          Meet the leaders of SVIM Alumni Association
        </Text>
      </View>

      {isDesktop && (
        <View style={styles.bearerStatRow}>
          {[
            { n: "7", l: "Leaders" },
            { n: "25+", l: "Years" },
            { n: "2,400+", l: "Alumni" },
          ].map((s, i) => (
            <View key={i} style={styles.bearerStatBox}>
              <Text style={styles.bearerStatNum}>{s.n}</Text>
              <Text style={styles.bearerStatLbl}>{s.l}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  </LinearGradient>

  {/* Cards */}
  {isMobile ? (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{
      paddingHorizontal: px,
      gap: 14,
      paddingTop: 20,
      paddingBottom: 8,
    }}
  >
    {visibleBearers.map((item, index) => (
      <OfficeBearerCard
        key={index}
        item={item}
        index={index}
        fadeAnim={bearerFade}
      />
    ))}
  </ScrollView>
) : (
  <View style={[styles.bearerGrid, { paddingHorizontal: px }]}>
    {visibleBearers.map((item, index) => (
      <OfficeBearerCard
        key={index}
        item={item}
        index={index}
        fadeAnim={bearerFade}
      />
    ))}
  </View>
)}

  {/* View More */}
  {/* View Details Button */}
<TouchableOpacity
  activeOpacity={0.9}
  onPress={() => router.push("/office")}
  style={styles.viewMoreBtn}
>
  <Text style={styles.viewMoreText}>
    View Details
  </Text>

  <Ionicons
    name="arrow-forward"
    size={18}
    color="#2563eb"
  />
</TouchableOpacity>
</View>

        {/* ══════════ MENTORSHIP ══════════ */}
        <View style={{ marginTop: 24 }} />
        <LinearGradient colors={["#1e0060", "#3730a3", "#4f46e5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.mentorSection, { paddingHorizontal: px }]}>
          <View style={styles.mentorBlob} />
          <View style={styles.mentorBlob2} />
          <View style={[styles.mentorInner, isDesktop && { flexDirection: "row", gap: 48, alignItems: "center" }]}>
            <View style={isDesktop ? { flex: 1 } : {}}>
              <View style={styles.mentorBadge}>
                <Ionicons name="star" size={12} color="#fbbf24" />
                <Text style={styles.mentorBadgeText}>Featured Program</Text>
              </View>
              <Text style={[styles.mentorTitle, isDesktop && { fontSize: 30 }]}>Mentorship Program</Text>
              <Text style={styles.mentorDesc}>Connect with experienced alumni mentors for career guidance, interview prep, and industry networking.</Text>
              <TouchableOpacity style={styles.mentorBtn} onPress={() => router.push("/donation")} activeOpacity={0.88}>
                <Ionicons name="arrow-forward-circle" size={18} color="#1e1b4b" />
                <Text style={styles.mentorBtnText}>Find a Mentor</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.mentorFeatures, isDesktop && { flex: 1 }]}>
              {MENTOR_FEATURES.map((f, i) => (
                <View key={i} style={styles.mentorFeatureCard}>
                  <View style={styles.mentorFeatureIcon}>
                    <Ionicons name={f.icon as any} size={20} color="#fbbf24" />
                  </View>
                  <View>
                    <Text style={styles.mentorFeatureTitle}>{f.title}</Text>
                    <Text style={styles.mentorFeatureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.mentorStatsRow}>
            {[{ n: "120+", l: "Active Mentors" }, { n: "450+", l: "Sessions Done" }, { n: "98%", l: "Satisfaction" }].map((s, i) => (
              <View key={i} style={styles.mentorStatBox}>
                <Text style={styles.mentorStatNum}>{s.n}</Text>
                <Text style={styles.mentorStatLbl}>{s.l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ══════════ TESTIMONIALS ══════════ */}
        <View style={{ marginTop: 12 }} />
        <Divider />
        <View style={{ paddingHorizontal: px }}>
          <SectionHeader title="What Alumni Say" sub="Real stories from our community" />
          <View style={[styles.testimonialGrid, isDesktop && { flexDirection: "row", gap: 16 }]}>
            {TESTIMONIALS.map((t, i) => (
              <View key={i} style={[styles.testimonialCard, i === 1 && styles.testimonialCardDark, isDesktop && { flex: 1 }]}>
                <Stars n={t.stars} />
                <Text style={[styles.testimonialText, i === 1 && { color: "#94a3b8" }]}>"{t.text}"</Text>
                <View style={styles.testimonialAuthor}>
                  <Avatar initials={t.initials} bg={t.bg} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.authorName, i === 1 && { color: "#fff" }]}>{t.name}</Text>
                    <Text style={styles.authorRole}>{t.role}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ══════════ DONATE BANNER ══════════ */}
        <View style={{ paddingHorizontal: px, marginTop: 28 }}>
          <LinearGradient colors={["#fbbf24", "#f59e0b", "#d97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.donateBanner, isDesktop && { flexDirection: "row", alignItems: "center" }]}>
            <View style={styles.donateIllus}><Text style={{ fontSize: 40 }}>🎓</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.donateTitle}>Support Future Generations</Text>
              <Text style={styles.donateDesc}>Help students through scholarships, mentorship programs, and campus development initiatives.</Text>
            </View>
            <TouchableOpacity style={styles.donateBtn} onPress={() => router.push("/donation")} activeOpacity={0.88}>
              <Ionicons name="heart" size={16} color="#f59e0b" />
              <Text style={styles.donateBtnText}>Donate Now</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Footer />
      </ScrollView>

      {/* ── BIRTHDAY MODAL — rendered at root level, same as other home screen ── */}
      <BirthdayModal/>

    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // HERO
  hero:           { paddingTop: isMobile ? 20 : 20, paddingBottom: 30, overflow: "hidden" },
  blob1:          { position: "absolute", width: 400, height: 400, borderRadius: 200, backgroundColor: "rgba(255,255,255,0.05)", right: -120, top: -100 },
  blob2:          { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: "rgba(251,191,36,0.08)", left: -60, bottom: -60 },
  blob3:          { position: "absolute", width: 160, height: 160, borderRadius: 80,  backgroundColor: "rgba(255,255,255,0.04)", left: 200, top: 30 },
  heroInner:      { gap: 30 },
  greetingBadge:  { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, marginBottom: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  pingDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fbbf24" },
  greetingText:   { fontSize: 20, color: "#e2d9f3", fontWeight: "600" },
  heroH1:         { fontSize: isMobile ? 34 : 44, fontWeight: "900", color: "#fff", lineHeight: isMobile ? 42 : 54, letterSpacing: -1.5, marginBottom: 14 },
  heroDesc:       { fontSize: 14, color: "#c4b5fd", lineHeight: 22, maxWidth: 440, marginBottom: 28 },
  heroBtns:       { flexDirection: "row", gap: 12, flexWrap: "wrap", marginBottom: 32 },
  heroBtnGold:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fbbf24", paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, shadowColor: "#fbbf24", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  heroBtnGoldText:  { fontSize: 14, fontWeight: "800", color: "#1e1b4b" },
  heroBtnGhost:     { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)", backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14 },
  heroBtnGhostText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  statsRow:       { flexDirection: "row", gap: 10 },
  statCard:       { flex: 1, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  statIconBox:    { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(251,191,36,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statNum:        { fontSize: isMobile ? 16 : 18, fontWeight: "800", color: "#fbbf24", letterSpacing: -0.5 },
  statLbl:        { fontSize: 10, color: "#a78bfa", marginTop: 2, textAlign: "center" },
  heroIllus:      { alignItems: "center" },
  ilustGlass:     { width: 320, borderRadius: 28, padding: 30, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  ilustText:      { fontSize: 28, fontWeight: "900", color: "rgba(255,255,255,0.6)", marginTop: 12 },
  ilustSub:       { fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 16 },
  ilustPills:     { gap: 8, width: "100%" },
  ilustPill:      { backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  ilustPillText:  { fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: "600", textAlign: "center" },

  // QUICK GRID
  quickGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-around" },
  quickItem:  { alignItems: "center", gap: 6, minWidth: 56 },
  quickIcon:  { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 11, fontWeight: "600", color: "#475569", textAlign: "center" },

  // ── SPONSORED / AD BANNERS ──
  sponsoredCard:      { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  sponsoredImg:       { width: "100%", height: 130 },
  sponsoredImgEmpty:  { backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  sponsoredBody:      { padding: 13 },
  sponsoredTitle:     { fontSize: 14, fontWeight: "800", color: "#fff" },
  sponsoredDesc:      { fontSize: 11.5, color: "#64748b", marginTop: 4, lineHeight: 16 },
  sponsoredLinkRow:   { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  sponsoredLinkTxt:   { fontSize: 11, color: "#4F46E5", fontWeight: "700" },

  // ── OFFICE BEARERS ──
  bearerHero: {
    paddingTop: 32,
    paddingBottom: 28,
    overflow: "hidden",
    marginTop: 24,
  },

highlightHero: {
  paddingTop: 30,
  paddingBottom: 24,
  overflow: "hidden",
  marginTop: 24,
},

highlightDecor1: {
  position: "absolute",
  width: 240,
  height: 240,
  borderRadius: 120,
  backgroundColor: "rgba(255,255,255,0.06)",
  right: -70,
  top: -70,
},

highlightDecor2: {
  position: "absolute",
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: "rgba(255,255,255,0.08)",
  left: 30,
  bottom: -30,
},

highlightInner: {
  flexDirection: isDesktop ? "row" : "column",
  alignItems: isDesktop ? "center" : "flex-start",
  justifyContent: "space-between",
  gap: 18,
},

highlightBadge: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  backgroundColor: "rgba(255,255,255,0.12)",
  alignSelf: "flex-start",
  paddingHorizontal: 12,
  paddingVertical: 5,
  borderRadius: 20,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.15)",
},

highlightBadgeText: {
  fontSize: 11,
  color: "#fff",
  fontWeight: "700",
},

highlightTitle: {
  fontSize: isMobile ? 24 : 30,
  fontWeight: "900",
  color: "#fff",
  letterSpacing: -0.7,
  marginBottom: 6,
},

highlightSub: {
  fontSize: 14,
  color: "rgba(255,255,255,0.82)",
  lineHeight: 21,
  maxWidth: 520,
},

highlightBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: "#fff",
  paddingHorizontal: 18,
  paddingVertical: 12,
  borderRadius: 14,

  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: {
    width: 0,
    height: 4,
  },

  elevation: 5,
},

highlightBtnText: {
  fontSize: 13,
  fontWeight: "800",
  color: "#111827",
},
  viewMoreBtn: {
    marginTop: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 10,
  },
  
  viewMoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
  },
  bearerHeroDecor:  { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(255,255,255,0.05)", right: -80, top: -80 },
  bearerHeroDecor2: { position: "absolute", width: 140, height: 140, borderRadius: 70,  backgroundColor: "rgba(251,191,36,0.08)", left: 40, bottom: -40 },
  bearerHeroInner:  { gap: 16 },
  bearerBadge:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(251,191,36,0.15)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: "rgba(251,191,36,0.25)" },
  bearerBadgeText:  { fontSize: 11, color: "#fbbf24", fontWeight: "700" },
  bearerHeroTitle:  { fontSize: isMobile ? 24 : 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5, marginBottom: 6 },
  bearerHeroSub:    { fontSize: 14, color: "#bfdbfe", lineHeight: 20 },
  bearerStatRow:    { flexDirection: "row", gap: 24 },
  bearerStatBox:    { alignItems: "center" },
  bearerStatNum:    { fontSize: 26, fontWeight: "900", color: "#fbbf24", letterSpacing: -0.5 },
  bearerStatLbl:    { fontSize: 11, color: "#93c5fd", marginTop: 2 },

  bearerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingTop: 20,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
  
  bearerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  
    shadowColor: "#1e3a8a",
    shadowOffset: {
      width: 0,
      height: 4,
    },
  
    shadowOpacity: 0.1,
    shadowRadius: 12,
  
    elevation: 5,
  
    ...(isMobile && {
      maxWidth: 430,
      alignSelf: "center",
    }),
  },
  bearerImgWrap: {
    height: isDesktop
      ? 280
      : isTablet
      ? 180
      : 220,
  
    backgroundColor: "#dbeafe",
    overflow: "hidden",
  },
  bearerImg: {
    width: "100%",
    height: "100%",
  },
  bearerInfo: {
    padding: 16,
    gap: 8,
  },
  
  bearerRolePill: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  
  bearerRoleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F46E5",
  },
  
  bearerName: {
    fontSize: isMobile ? 16 : 15,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 22,
  },
  // EVENTS
  eventCard:        { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  eventThumb:       { height: 130, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
  eventDateBadge:   { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  eventDateBadgeText:{ fontSize: 10, color: "#fff", fontWeight: "700" },
  eventBody:        { padding: 14 },
  eventName:        { fontSize: 14, fontWeight: "800", color: "#0f172a", lineHeight: 20 },
  eventLoc:         { fontSize: 11, fontWeight: "600" },
  eventFooter:      { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  eventStatusDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  eventStatus:      { fontSize: 11, color: "#22c55e", fontWeight: "600" },
  rsvpBtn:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  rsvpText:         { fontSize: 11, fontWeight: "700" },

  // JOBS
  jobsWrap:     { gap: 12, paddingBottom: 8 },
  jobItem:      { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#e2e8f0" },
  jobGrad:      { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  jobIconBox:   { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  jobTitle:     { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 3 },
  jobMeta:      { fontSize: 12, color: "#64748b", marginBottom: 6 },
  jobTags:      { flexDirection: "row", gap: 6 },
  bookmarkBtn:  { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },

  // MENTORSHIP
  mentorSection:       { paddingTop: 36, paddingBottom: 32, overflow: "hidden" },
  mentorBlob:          { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "rgba(251,191,36,0.06)", right: -80, top: -80 },
  mentorBlob2:         { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.04)", left: -40, bottom: -40 },
  mentorInner:         { gap: 2 },
  mentorBadge:         { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(251,191,36,0.15)", alignSelf: "flex-start", paddingHorizontal: 18, paddingVertical: 5, borderRadius: 20, marginBottom: 12 },
  mentorBadgeText:     { fontSize: 11, color: "#fbbf24", fontWeight: "700" },
  mentorTitle:         { fontSize: isMobile ? 22 : 22, fontWeight: "900", color: "#fff", marginBottom: 10 },
  mentorDesc:          { fontSize: 13, color: "#a5b4fc", lineHeight: 20, marginBottom: 20, maxWidth: 360 },
  mentorBtnText:       { fontSize: 14, fontWeight: "800", color: "#1e1b4b" },
   mentorFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
    width: "100%",
    maxWidth: isDesktop ? 850 : "100%",
  
    justifyContent: isDesktop
      ? "flex-end"
      : "flex-start",
  },
  mentorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fbbf24",
    alignSelf: "flex-start",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: "#fbbf24",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  
    marginTop: 10,
  },
  mentorFeatureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  
    backgroundColor: "rgba(255,255,255,0.07)",
  
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  
    paddingHorizontal: 14,
    paddingVertical: 14,
  
    borderRadius: 16,
  
    width: isDesktop
      ? "48%"
      : isTablet
      ? "48%"
      : "100%",
  
    minHeight: 82,
  },
  mentorFeatureIcon:   { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(251,191,36,0.15)", alignItems: "center", justifyContent: "center" },
  mentorFeatureTitle:  { fontSize: 12, fontWeight: "700", color: "#fff" },
  mentorFeatureDesc:   { fontSize: 11, color: "#a5b4fc", marginTop: 1 },
  mentorStatsRow:      { flexDirection: "row", marginTop: 28, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 20, gap: 0 },
  mentorStatBox:       { flex: 1, alignItems: "center" },
  mentorStatNum:       { fontSize: isMobile ? 22 : 26, fontWeight: "900", color: "#fbbf24", letterSpacing: -0.5 },
  mentorStatLbl:       { fontSize: 11, color: "#818cf8", marginTop: 3, textAlign: "center" },

  // TESTIMONIALS
  testimonialGrid:     { gap: 14, paddingBottom: 8 },
  testimonialCard:     { backgroundColor: "#f8fafc", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "#e2e8f0" },
  testimonialCardDark: { backgroundColor: "#0f172a", borderColor: "#1e293b" },
  testimonialText:     { fontSize: 14, color: "#475569", lineHeight: 22, fontStyle: "italic", marginVertical: 14 },
  testimonialAuthor:   { flexDirection: "row", alignItems: "center", gap: 12 },
  authorName:          { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  authorRole:          { fontSize: 11, color: "#64748b", marginTop: 2 },

  // DONATE
  donateBanner: { borderRadius: 24, padding: 24, gap: 16 ,marginBottom:30},
  donateIllus:  { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  donateTitle:  { fontSize: isMobile ? 18 : 22, fontWeight: "900", color: "#1e1b4b", marginBottom: 6 },
  donateDesc:   { fontSize: 13, color: "rgba(30,27,75,0.65)", lineHeight: 19 },
  donateBtn:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, alignSelf: "flex-start", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  donateBtnText:{ fontWeight: "800", color: "#f59e0b", fontSize: 14 },

  // MISC
  emptyBox: { alignItems: "center", paddingVertical: 28, gap: 8, backgroundColor: "#fff" },
  emptyText:{ fontSize: 13, color: "#94A3B8", fontWeight: "600" },

  // ── BIRTHDAY / ANNIVERSARY — combined row ──
  birthdaySection: { marginTop: 32 },
  birthdayHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  birthdayHeaderIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#FCE7F3",
    alignItems: "center", justifyContent: "center",
  },
  birthdaySectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  birthdaySectionSub: { fontSize: 13, color: "#64748b", marginTop: 1 },
  celebCountPill: {
    backgroundColor: "#0f172a",
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  celebCountText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  birthdayScrollContent: { gap: 14, paddingBottom: 10, paddingTop: 4 },

  birthdayCard: {
    width: 168,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#db2777",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  birthdayCardInner: {
    padding: 18,
    paddingTop: 26,
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(219,39,119,0.12)",
    position: "relative",
    overflow: "hidden",
  },

  // decorative confetti dots on the birthday card
  confettiDot1: { position: "absolute", top: 14, left: 14, width: 6, height: 6, borderRadius: 3, backgroundColor: "#fbcfe8" },
  confettiDot2: { position: "absolute", top: 22, right: 18, width: 4, height: 4, borderRadius: 2, backgroundColor: "#f9a8d4" },
  confettiDot3: { position: "absolute", bottom: 60, right: 12, width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#fbcfe8" },

  // Type ribbon — distinguishes birthday vs anniversary cards in the merged row
  typeRibbon: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomRightRadius: 12,
  },
  typeRibbonText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.6,
  },

  birthdayRing: {
    padding: 4,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "#fbcfe8",
    marginBottom: 12,
  },
  birthdayAvatarWrap: { position: "relative" },
  birthdayAvatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: "#fff" },
  birthdayFallbackAvatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  birthdayFallbackText: { fontSize: 26, fontWeight: "800", color: "#fff" },
  cakeBadge: {
    position: "absolute", bottom: -2, right: -4,
    backgroundColor: "#fff", width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3,
    borderWidth: 1, borderColor: "#f1f5f9",
  },
  birthdayName: { fontSize: 14.5, fontWeight: "800", color: "#831843", textAlign: "center" },
  birthdayBatch: { fontSize: 11, color: "#9d174d", opacity: 0.7, marginTop: 2, marginBottom: 8 },

  birthdayWishBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: "#db2777", shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,
  },
  birthdayWishBtnText: { fontSize: 10.5, fontWeight: "700", color: "#db2777" },

  // Anniversary-specific
  yearsBadge: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 4,
    alignItems: "center", justifyContent: "center",
  },
  yearsBadgeText: { fontSize: 9, fontWeight: "900", color: "#fff", textAlign: "center", lineHeight: 10 },

  anniversaryYearsRow: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: "#2563eb", shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,
  },
  anniversaryYearsText: { fontSize: 10.5, fontWeight: "700", color: "#2563eb" },
});