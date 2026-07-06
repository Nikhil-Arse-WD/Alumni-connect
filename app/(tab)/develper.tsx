import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Ellipse, Circle, Line } from "react-native-svg";

const isWeb = Platform.OS === "web";

const TEAM = [
  {
    id: "divya",
    name: "Divya Bhawsar",
    fullName: "Divya Bhawsar",
    title: "Technical Lead",
    cardTitle: "Software Developer",
    photo: require("../../assets/Alumni_Pics/divya.png"),
    accent: "#3B4FDB",
    accentSoft: "#E8EEFF",
    bg: "#EEF1FB",
    bio: "Experienced full-stack developer leading the Alumni Connect App — from architecture to shipped features. Passionate about clean code and seamless user experiences.",
    course: "MCA (2024 - 2026)",
    university: "Shri Vaishnav Institute of Management & Science Indore",
    location: "Madhya Pradesh, India",
    email: "bhawsardivya791@gmail.com",
    phone: "+91 7067236880",
    github: "https://github.com/Divya-Bhawsar",
    linkedin: "https://www.linkedin.com/in/divya-bhawsar-166309258",
    instagram: "https://instagram.com/divyabhawsar",
    linkedinLabel: "linkedin.com/in/\ndivya-bhawsar",
    githubLabel: "github.com/\ndivya-bhawsar",
    stats: [
      { icon: "ribbon-outline", n: "3 Roles", l: "Project, Dev & Testing" },
      { icon: "git-branch-outline", n: "15+ Modules", l: "Built & Integrated" },
      { icon: "headset-outline", n: "Always", l: "Available to Support" },
    ],
    roles: [
      { icon: "flag-outline", role: "Project Leader", desc: "Oversees project planning, task coordination, and overall execution of the Alumni Connect App." },
      { icon: "code-slash-outline", role: "Lead Developer", desc: "Develops React Native frontend, backend APIs, and integrates modules like authentication, events, and job board." },
      { icon: "bug-outline", role: "Testing Engineer", desc: "Performs app testing, bug fixing, API validation, and system integration testing." },
    ],
  },
  {
    id: "jagriti",
    name: "Jagriti Gupta",
    fullName: "Jagriti Gupta",
    title: "System & Documentation Lead",
    cardTitle: "Software Developer",
    photo: require("../../assets/Alumni_Pics/jagriti.jpeg"),
    accent: "#3B4FDB",
    accentSoft: "#E8EEFF",
    bg: "#EEF1FB",
    bio: "Architects the data backbone of the platform and tells its story through clear, structured documentation and presentations.",
    course: "MCA (2024 - 2026)",
    university: "Shri Vaishnav Institute of Management & Science Indore",
    location: "Madhya Pradesh, India",
    email: "jagritigupta160203@example.com",
    phone: "+91 9098138316",
    github: "https://github.com/jagritigupta",
    linkedin: "https://linkedin.com/in/jagritigupta",
    instagram: "https://instagram.com/jagritigupta",
    linkedinLabel: "linkedin.com/in/\njagriti-gupta",
    githubLabel: "github.com/\njagriti-gupta",
    stats: [
      { icon: "server-outline", n: "3 Roles", l: "DB, Docs & Support" },
      { icon: "albums-outline", n: "10+ Tables", l: "Designed & Managed" },
      { icon: "easel-outline", n: "Full", l: "Project Documentation" },
    ],
    roles: [
      { icon: "server-outline", role: "Database Manager", desc: "Designs and manages MySQL database for alumni records, jobs, events, and notifications." },
      { icon: "document-text-outline", role: "Documentation & Presentation Head", desc: "Prepares project documentation, report writing, diagrams, and PPT presentation." },
      { icon: "color-palette-outline", role: "Support Developer", desc: "Assists in UI design and admin panel management." },
    ],
  },
];

// ── Dot grid ─────────────────────────────────────────
function DotGrid({ rows = 6, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <View style={{ flexDirection: "column", gap: 8 }} pointerEvents="none">
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flexDirection: "row", gap: 8 }}>
          {Array.from({ length: cols }).map((_, c) => (
            <View key={c} style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.28)" }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── 4-point sparkle ──────────────────────────────────
function Sparkle({ size = 14, color = "rgba(150,160,255,0.9)", style }: any) {
  return (
    <View pointerEvents="none" style={[{ position: "absolute", width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
      <View style={{ position: "absolute", width: size, height: 2.5, backgroundColor: color, borderRadius: 2 }} />
      <View style={{ position: "absolute", width: 2.5, height: size, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

// ── Leaf decoration ───────────────────────────────────
function Leaf({ style }: any) {
  return (
    <View pointerEvents="none" style={[{ position: "absolute", width: 90, height: 180 }, style]}>
      <Svg width="90" height="180" viewBox="0 0 90 180">
        <Path d="M22 170 C22 135 22 100 22 15" stroke="#82AFFF" strokeWidth="2.5" fill="none" />
        <Ellipse cx="38" cy="20"  rx="12" ry="6" fill="#7EA9FF" transform="rotate(-35 38 20)" />
        <Ellipse cx="38" cy="45"  rx="12" ry="6" fill="#7EA9FF" transform="rotate(-35 38 45)" />
        <Ellipse cx="38" cy="70"  rx="12" ry="6" fill="#7EA9FF" transform="rotate(-35 38 70)" />
        <Ellipse cx="38" cy="95"  rx="12" ry="6" fill="#7EA9FF" transform="rotate(-35 38 95)" />
        <Ellipse cx="38" cy="120" rx="12" ry="6" fill="#7EA9FF" transform="rotate(-35 38 120)" />
        <Ellipse cx="10" cy="32"  rx="12" ry="6" fill="#7EA9FF" transform="rotate(35 10 32)" />
        <Ellipse cx="10" cy="57"  rx="12" ry="6" fill="#7EA9FF" transform="rotate(35 10 57)" />
        <Ellipse cx="10" cy="82"  rx="12" ry="6" fill="#7EA9FF" transform="rotate(35 10 82)" />
        <Ellipse cx="10" cy="107" rx="12" ry="6" fill="#7EA9FF" transform="rotate(35 10 107)" />
        <Ellipse cx="10" cy="132" rx="12" ry="6" fill="#7EA9FF" transform="rotate(35 10 132)" />
      </Svg>
    </View>
  );
}

// ── Hero dot grid (blue dots inside hero) ────────────
function BlueDotGrid() {
  return (
    <View pointerEvents="none" style={{ flexDirection: "column", gap: 7 }}>
      {Array.from({ length: 4 }).map((_, r) => (
        <View key={r} style={{ flexDirection: "row", gap: 7 }}>
          {Array.from({ length: 5 }).map((_, c) => (
            <View key={c} style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#8FA8D8", opacity: 0.55 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── StatCard ──────────────────────────────────────────
function StatCard({ icon, n, l, accent, delay }: { icon: string; n: string; l: string; accent: string; delay: number }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    fade.setValue(0); slide.setValue(14);
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, [delay]);
  return (
    <Animated.View style={[styles.statCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={[styles.statIconCircle, { backgroundColor: accent }]}>
        <Ionicons name={icon as any} size={22} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statNum}>{n}</Text>
        <Text style={styles.statLabel}>{l}</Text>
      </View>
    </Animated.View>
  );
}

// ── RoleCard ──────────────────────────────────────────
function RoleCard({ icon, role, desc, accent, accentSoft, delay }: {
  icon: string; role: string; desc: string; accent: string; accentSoft: string; delay: number;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    fade.setValue(0); slide.setValue(18);
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, [delay]);
  return (
    <Animated.View style={[styles.roleCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={[styles.roleIconBox, { backgroundColor: accentSoft }]}>
        <Ionicons name={icon as any} size={20} color={accent} />
      </View>
      <Text style={styles.roleTitle}>{role}</Text>
      <Text style={styles.roleDesc}>{desc}</Text>
      <View style={[styles.roleAccentBar, { backgroundColor: accent }]} />
    </Animated.View>
  );
}

// ── SocialIcon ────────────────────────────────────────
function SocialIcon({ icon, color, bg, onPress }: { icon: string; color: string; bg: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      onPressIn={() => Animated.spring(scale, { toValue: 0.85, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start()}
      onPress={onPress} activeOpacity={0.85}
    >
      <Animated.View style={[styles.socialIcon, { backgroundColor: bg, transform: [{ scale }] }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Profile Detail Screen (inside Modal) ─────────────
function ProfileDetail({ member, onClose, openLink }: {
  member: typeof TEAM[0];
  onClose: () => void;
  openLink: (url: string) => void;
}) {
  const { width: W } = useWindowDimensions();
  const isDesktop = W >= 900;
  const isTablet  = W >= 640 && W < 900;
  const px = isDesktop ? 56 : isTablet ? 32 : 20;
  const photoSize = isDesktop ? 320 : isTablet ? 260 : Math.min(W * 0.52, 230);

  const heroFade  = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;
  const photoPop  = useRef(new Animated.Value(0.88)).current;
  const bounce    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    heroFade.setValue(0); heroSlide.setValue(20); photoPop.setValue(0.88);
    Animated.parallel([
      Animated.timing(heroFade,  { toValue: 1, duration: 460, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 460, useNativeDriver: true }),
      Animated.spring(photoPop,  { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -9, duration: 1800, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,  duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [member.id]);

  const initials = member.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: "#EEF1FB" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>

        {/* ══ HEADER ══ */}
        <View style={{ position: "relative" }}>
          <LinearGradient
             colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 0}}
            style={[styles.header, { paddingHorizontal: px }]}
          >
            <View style={styles.decCircle1} />
            <View style={styles.decCircle2} />
            <View style={styles.decCircle3} />
            <View style={{ position: "absolute", top: 16, right: 18 }} pointerEvents="none">
              <DotGrid rows={6} cols={8} />
            </View>
            <Sparkle size={16} color="rgba(180,175,255,0.95)" style={{ top: 150, left: W * 0.46 }} />

            {/* Back button */}
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Developer Profile</Text>
            <Text style={styles.headerSub}>Alumni Connect Team</Text>
          </LinearGradient>

          {/* Wave */}
          <View style={{ marginTop: -2 }}>
            <Svg width={W} height={36} viewBox={`0 0 ${W} 36`} style={{ display: "flex" }}>
              <Path d={`M0,0 Q${W * 0.25},36 ${W * 0.5},18 Q${W * 0.75},0 ${W},20 L${W},0 Z`} fill="#3730C4" />
              <Path d={`M0,0 Q${W * 0.25},36 ${W * 0.5},18 Q${W * 0.75},0 ${W},20 L${W},36 L0,36 Z`} fill="#EEF1FB" />
            </Svg>
          </View>
        </View>

        {/* ══ HERO ══ */}
        <Animated.View style={{ opacity: heroFade, transform: [{ translateY: heroSlide }] }}>
          <View style={[styles.heroWrap, { paddingHorizontal: px }, isDesktop && styles.heroWrapDesktop]}>

            {/* LEFT */}
            <View style={[styles.heroLeft, isDesktop && { flex: 1 }]}>
              <View style={styles.hiBadge}>
                <Text style={styles.hiText}>Hi I'm</Text>
              </View>
              <Text style={[styles.heroName, !isDesktop && { fontSize: 36 }]}>{member.name}</Text>
              <Text style={styles.heroTitle}>{member.title}</Text>
              <Text style={styles.heroBio}>{member.bio}</Text>

              <View style={styles.ctaRow}>
                <TouchableOpacity
                  style={[styles.ctaFilled, { backgroundColor: "#3B4FDB" }]}
                  onPress={() => openLink(`mailto:${member.email}`)}
                  activeOpacity={0.88}
                >
                  <Ionicons name="mail-outline" size={16} color="#fff" />
                  <Text style={styles.ctaFilledText}>Contact Me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.ctaOutlined, { borderColor: "#3B4FDB" }]}
                  onPress={onClose}
                  activeOpacity={0.88}
                >
                  <Ionicons name="arrow-back-outline" size={15} color="#3B4FDB" />
                  <Text style={[styles.ctaOutlinedText, { color: "#3B4FDB" }]}>Go Back</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
                <SocialIcon icon="logo-github"    color="#1E1B4B" bg="#F1F5F9" onPress={() => openLink(member.github)} />
                <SocialIcon icon="logo-instagram" color="#DB2777" bg="#FDF2F8" onPress={() => openLink(member.instagram)} />
                <SocialIcon icon="logo-linkedin"  color="#2563EB" bg="#EFF6FF" onPress={() => openLink(member.linkedin)} />
              </View>
            </View>

            {/* RIGHT — photo */}
            <View style={[styles.heroRight, isDesktop && { flex: 1 }]}>
              <Sparkle size={14} color="rgba(100,120,220,0.65)" style={{ top: 10, left: 20 }} />
              <View style={[styles.ovalBlob, { width: photoSize * 1.05, height: photoSize * 1.15, borderRadius: (photoSize * 1.05) / 2 }]} />
              <View style={{ position: "absolute", bottom: 40, left: 10 }}>
                <BlueDotGrid />
              </View>
              <Sparkle size={13} color="rgba(100,120,220,0.7)" style={{ bottom: 30, right: 30 }} />

              <Animated.View style={{ transform: [{ translateY: bounce }, { scale: photoPop }] }}>
                <View style={[styles.photoRing, { width: photoSize + 14, height: photoSize + 14, borderRadius: (photoSize + 14) / 2 }]}>
                  <View style={[styles.photoCircle, { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }]}>
                    {member.photo ? (
                      <Image source={member.photo} style={{ width: "100%", height: "100%", borderRadius: photoSize / 2 }} />
                    ) : (
                      <Text style={{ fontSize: photoSize * 0.28, fontWeight: "900", color: "#3B4FDB" }}>{initials}</Text>
                    )}
                  </View>
                </View>
              </Animated.View>

              <Leaf style={{ position: "absolute", right: Platform.OS === "web" ? 75 : 4, bottom: Platform.OS === "web" ? 4 : -10, transform: [{ rotate: "40deg" }] }} />

              <View style={styles.personBadge}>
                <Ionicons name="person" size={17} color="#fff" />
              </View>
            </View>
          </View>

          {/* ══ STATS BAR ══ */}
          <View style={[styles.statsBar, { marginHorizontal: px }, isDesktop && { flexDirection: "row" }]}>
            {member.stats.map((s, i) => (
              <React.Fragment key={i}>
                <StatCard icon={s.icon} n={s.n} l={s.l} accent="#3B4FDB" delay={i * 100} />
                {i < member.stats.length - 1 && (
                  <View style={isDesktop ? styles.statDividerV : styles.statDividerH} />
                )}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        {/* ══ ROLES ══ */}
        <View style={[styles.rolesSection, { paddingHorizontal: px }]}>
          <Text style={[styles.rolesSectionLabel, { color: "#3B4FDB" }]}>What I Do</Text>
          <Text style={styles.rolesSectionTitle}>Roles & Responsibilities</Text>
          <View style={[styles.rolesGrid, isDesktop && styles.rolesGridDesktop]}>
            {member.roles.map((r, i) => (
              <RoleCard
                key={`${member.id}-${i}`}
                icon={r.icon} role={r.role} desc={r.desc}
                accent="#3B4FDB" accentSoft="#E8EEFF" delay={i * 120}
              />
            ))}
          </View>
        </View>

        {/* ══ FOOTER ══ */}
        <View style={[styles.footerCard, { marginHorizontal: px }]}>
          <View style={{ flexDirection: "row" }}>
            {TEAM.map((m, i) => (
              <View key={m.id} style={[styles.footerAvatar, { backgroundColor: "#3B4FDB", marginLeft: i > 0 ? -10 : 0, zIndex: TEAM.length - i }]}>
                <Text style={styles.footerAvatarText}>{m.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footerText}>
            Built with <Text style={{ color: "#EC4899" }}>♥</Text> by{" "}
            <Text style={{ fontWeight: "800", color: "#1E1B4B" }}>Divya Bhawsar</Text> &{" "}
            <Text style={{ fontWeight: "800", color: "#1E1B4B" }}>Jagriti Gupta</Text>
          </Text>
        </View>

        <Text style={styles.versionText}>Alumni Connect · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ── Main Developer Listing Screen ─────────────────────
export default function DeveloperScreen() {
  const { width: W } = useWindowDimensions();
  const isDesktop = W >= 900;
  const px = isDesktop ? 48 : 16;

  const [selectedMember, setSelectedMember] = useState<typeof TEAM[0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openLink = (url: string) => {
    if (isWeb) window.open(url, "_blank");
    else Linking.openURL(url).catch(() => {});
  };

  const handleViewProfile = (member: typeof TEAM[0]) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  // ── listing card ──
  const renderCard = (member: typeof TEAM[0]) => (
    <View key={member.id} style={[listStyles.card, !isDesktop && { marginBottom: 16 }]}>
      <View style={listStyles.cardTop}>
        {/* Photo — tappable */}
        <TouchableOpacity onPress={() => handleViewProfile(member)} activeOpacity={0.85}>
          <View style={listStyles.photoRingOuter}>
            <View style={listStyles.photoRingInner}>
              {member.photo ? (
                <Image source={member.photo} style={listStyles.photoImg} />
              ) : (
                <Text style={listStyles.photoInitials}>
                  {member.name.split(" ").map((n: string) => n[0]).join("")}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Info */}
        <View style={listStyles.cardInfo}>
          <TouchableOpacity onPress={() => handleViewProfile(member)} activeOpacity={0.85}>
            <Text style={listStyles.memberName}>{member.name}</Text>
          </TouchableOpacity>
          <Text style={listStyles.memberCardTitle}>{member.cardTitle}</Text>

          <View style={listStyles.infoRow}>
            <Ionicons name="school-outline" size={14} color="#1E3A8A" />
            <Text style={listStyles.infoText}>{member.course}</Text>
          </View>
          <View style={listStyles.infoRow}>
            <Ionicons name="business-outline" size={14} color="#1E3A8A" />
            <Text style={listStyles.infoText}>{member.university}</Text>
          </View>
          <View style={listStyles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#1E3A8A" />
            <Text style={listStyles.infoText}>{member.location}</Text>
          </View>

          <TouchableOpacity onPress={() => handleViewProfile(member)} style={listStyles.viewProfileBtn} activeOpacity={0.85}>
            <Text style={listStyles.viewProfileText}>View Full Profile</Text>
            <Ionicons name="arrow-forward" size={13} color="#3B4FDB" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={listStyles.cardDivider} />

      {/* Contact icons */}
      <View style={listStyles.contactRow}>
        {[
          { icon: "mail",         bg: "#2563EB", label: member.email,        sub: "Email",    url: `mailto:${member.email}` },
          { icon: "call",         bg: "#16A34A", label: member.phone,        sub: "Contact",  url: `tel:${member.phone}` },
          { icon: "logo-linkedin",bg: "#0A66C2", label: member.linkedinLabel,sub: "LinkedIn", url: member.linkedin },
          { icon: "logo-github",  bg: "#1A1A2E", label: member.githubLabel,  sub: "GitHub",   url: member.github },
        ].map((item) => (
          <TouchableOpacity key={item.sub} style={listStyles.contactItem} onPress={() => openLink(item.url)} activeOpacity={0.8}>
            <View style={[listStyles.contactIcon, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={17} color="#fff" />
            </View>
            <Text style={listStyles.contactLabel}>{item.label}</Text>
            <Text style={listStyles.contactSub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F0F4FA", marginBottom: Platform.OS === "web" ? 0 : 50 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }}>

        {/* ══ HERO HEADER ══ */}
        <LinearGradient
         colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
         start={{ x: 0, y: 0 }}
         end={{ x: 1, y: 0}}
          style={listStyles.hero}
        >
          <View style={{ position: "absolute", top: 24, left: 30 }} pointerEvents="none">
            <DotGrid rows={5} cols={6} />
          </View>
          <View style={{ position: "absolute", top: 24, right: 30 }} pointerEvents="none">
            <DotGrid rows={5} cols={6} />
          </View>
          <View style={listStyles.heroBgCircle1} />
          <View style={listStyles.heroBgCircle2} />

          <View style={listStyles.heroIconCircle}>
            <Ionicons name="people" size={32} color="#fff" />
          </View>
          <Text style={listStyles.heroTitle}>ABOUT DEVELOPERS</Text>
          <Text style={listStyles.heroSub}>Meet the developers behind Alumni Connect</Text>
          <View style={listStyles.heroDot} />
        </LinearGradient>

        {/* ══ CARDS ══ */}
        <View style={[listStyles.cardsSection, { paddingHorizontal: px }, isDesktop && { flexDirection: "row", gap: 20 }]}>
          {TEAM.map((m) => (
            <View key={m.id} style={{ flex: isDesktop ? 1 : undefined }}>
              {renderCard(m)}
            </View>
          ))}
        </View>

        {/* ══ TECH STACK ══ */}
        <View style={[listStyles.techSection, { paddingHorizontal: px }]}>
          <View style={listStyles.techHeadRow}>
            <View style={listStyles.techLine} />
            <Text style={listStyles.techHeading}>✦  TECHNOLOGY STACK  ✦</Text>
            <View style={listStyles.techLine} />
          </View>
          <View style={listStyles.techGrid}>
            {[
              { name: "React Native", color: "#61DAFB", letter: "⚛" },
              { name: "Node.js",      color: "#68A063", letter: "⬡" },
              { name: "Express.js",   color: "#333333", letter: "ex" },
              { name: "MySQL",        color: "#00758F", letter: "🐬" },
              //{ name: "JWT",          color: "#1E1E2E", letter: "🛡" },
            //  { name: "Razorpay",     color: "#2D5BE3", letter: "⚡" },
            //  { name: "Redis",        color: "#D82C20", letter: "🔴" },
            //  { name: "BullMQ",       color: "#B91C1C", letter: "🐂" },
            ].map((tech) => (
              <View key={tech.name} style={listStyles.techBadge}>
                <View style={listStyles.techIconBox}>
                  <Text style={[listStyles.techLetter, { color: tech.color }]}>{tech.letter}</Text>
                </View>
                <Text style={listStyles.techName}>{tech.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ══ FOOTER ══ */}
        <LinearGradient colors={["#0A1A5C", "#0D1F6E"]} style={listStyles.footer}>
          <View style={[listStyles.footerInner, { paddingHorizontal: px }, isDesktop && listStyles.footerInnerDesktop]}>
            <View style={listStyles.footerCol}>
              <View style={listStyles.footerLogoCircle}>
                <Ionicons name="people" size={22} color="#fff" />
              </View>
              <Text style={listStyles.footerColTitle}>ABOUT PROJECT</Text>
              <Text style={listStyles.footerColText}>Alumni Connect is a platform designed to connect alumni with their alma mater and fellow graduates.</Text>
            </View>
            <View style={listStyles.footerCol}>
              <Text style={listStyles.footerColTitle}>PROJECT DETAILS</Text>
              {[["Project Name","Alumni Connect"],["Course","MCA"],["Batch","2024 - 2026"],["Version","1.0.0"]].map(([l,v]) => (
                <View key={l} style={{ flexDirection: "row", marginBottom: 4 }}>
                  <Text style={[listStyles.footerColText, { width: 90, color: "#94A3B8" }]}>{l} :</Text>
                  <Text style={listStyles.footerColText}>{v}</Text>
                </View>
              ))}
            </View>
            <View style={listStyles.footerCol}>
              <Text style={listStyles.footerColTitle}>DEVELOPED BY</Text>
              <Text style={listStyles.footerColText}>MCA Students (2024 - 2026)</Text>
              <Text style={listStyles.footerMadeWith}>Made with <Text style={{ color: "#EC4899" }}>♥</Text> in India</Text>
            </View>
            
          </View>
          <View style={listStyles.footerCopyright}>
            <Text style={listStyles.footerCopyrightText}>© 2026 Alumni Connect. All Rights Reserved.</Text>
          </View>
        </LinearGradient>

      </ScrollView>

      {/* ══ PROFILE MODAL ══ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedMember && (
          <ProfileDetail
            member={selectedMember}
            onClose={() => setModalVisible(false)}
            openLink={openLink}
          />
        )}
      </Modal>
    </View>
  );
}

// ─── Profile detail styles (exact pehle wala) ────────
const styles = StyleSheet.create({
  header: {
    paddingTop: 40, paddingBottom: 30, overflow: "hidden",
  },
  decCircle1: { position: "absolute", right: -85, top: -55, width: 270, height: 270, borderRadius: 135, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.13)" },
  decCircle2: { position: "absolute", right: 5, top: 45, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.07)" },
  decCircle3: { position: "absolute", right: 58, top: 108, width: 75, height: 75, borderRadius: 38, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 18 },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  headerTitle: { fontSize: Platform.OS === "web" ? 42 : 28, fontWeight: "900", color: "#fff", marginBottom: 6 },
  headerSub: { fontSize: Platform.OS === "web" ? 18 : 14, color: "rgba(255,255,255,0.85)" },

  heroWrap: { paddingTop: 22, paddingBottom: 4 },
  heroWrapDesktop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", maxWidth: 1400, width: "100%", alignSelf: "center", paddingHorizontal: 50 },
  heroLeft: { flex: 1, maxWidth: 620, justifyContent: "center" },
  heroRight: { alignItems: "center", justifyContent: "center", marginTop: 16, position: "relative", overflow: "visible" },

  hiBadge: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 10, backgroundColor: "#DDE3F8" },
  hiText: { fontSize: 13, fontWeight: "600", color: "#4B5280" },
  heroName: { fontSize: 40, fontWeight: "900", color: "#1A1A3E", letterSpacing: -1, lineHeight: 46, marginBottom: 8 },
  heroTitle: { fontSize: 17, fontWeight: "700", color: "#2D3158", marginBottom: 14 },
  heroBio: { fontSize: 14, color: "#64748B", lineHeight: 22, maxWidth: 420, marginBottom: 24 },

  ctaRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  ctaFilled: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12, shadowColor: "#3B4FDB", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  ctaFilledText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  ctaOutlined: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, backgroundColor: "transparent" },
  ctaOutlinedText: { fontWeight: "700", fontSize: 14 },

  socialIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  ovalBlob: { position: "absolute", backgroundColor: "#D4DCF7" },
  photoRing: { backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#3B4FDB", shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  photoCircle: { overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#D4DCF7" },
  personBadge: { position: "absolute", bottom: 20, right: Platform.OS === "web" ? 190 : 80, width: 60, height: 60, borderRadius: 90, backgroundColor: "#3B4FDB", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#fff", shadowColor: "#3B4FDB", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },

  statsBar: { backgroundColor: "#fff", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16, marginTop: 28, shadowColor: "#1E1B4B", shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 5, gap: 0 },
  statCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, flex: 1 },
  statIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statNum: { fontSize: 15, fontWeight: "800", color: "#1E1B4B" },
  statLabel: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  statDividerH: { height: 1, backgroundColor: "#F1F5F9" },
  statDividerV: { width: 1, backgroundColor: "#F1F5F9", marginVertical: 8 },

  rolesSection: { marginTop: 44 },
  rolesSectionLabel: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 },
  rolesSectionTitle: { fontSize: 24, fontWeight: "900", color: "#1E1B4B", marginTop: 4, marginBottom: 20 },
  rolesGrid: { gap: 14 },
  rolesGridDesktop: { flexDirection: "row" },
  roleCard: { flex: 1, backgroundColor: "#fff", borderRadius: 20, padding: 20, position: "relative", overflow: "hidden", shadowColor: "#1E1B4B", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  roleIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  roleTitle: { fontSize: 15, fontWeight: "800", color: "#1E1B4B", marginBottom: 6 },
  roleDesc: { fontSize: 12.5, color: "#64748B", lineHeight: 19 },
  roleAccentBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 4 },

  footerCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 20, padding: 18, marginTop: 36, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  footerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  footerAvatarText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  footerText: { flex: 1, fontSize: 12.5, color: "#64748B", lineHeight: 19 },
  versionText: { fontSize: 11, color: "#CBD5E1", textAlign: "center", marginTop: 18 },
});

// ─── Listing screen styles ────────────────────────────
const listStyles = StyleSheet.create({
  hero: { paddingTop: Platform.OS === "web" ? 30 : 15, paddingBottom: 20, alignItems: "center", overflow: "hidden", position: "relative" },
  heroBgCircle1: { position: "absolute", right: -60, top: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(255,255,255,0.04)" },
  heroBgCircle2: { position: "absolute", left: -40, bottom: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.04)" },
  heroIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroTitle: { fontSize: Platform.OS === "web" ? 44 : 26, fontWeight: "900", color: "#fff", letterSpacing: 2, textAlign: "center" },
  heroSub: { fontSize: Platform.OS === "web" ? 16 : 13, color: "rgba(255,255,255,0.75)", marginTop: 10, textAlign: "center" },
  heroDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3B82F6", marginTop: 16 },

  cardsSection: { paddingTop: 28, paddingBottom: 10, backgroundColor: "#F0F4FA" },

  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#1E3A8A", shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", padding: 20, gap: 16 },
  photoRingOuter: { width: 120, height: 120, borderRadius: 60, borderWidth: 2.5, borderColor: "#1E3A8A", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  photoRingInner: { width: 108, height: 108, borderRadius: 54, overflow: "hidden", backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  photoImg: { width: "100%", height: "100%" },
  photoInitials: { fontSize: 32, fontWeight: "900", color: "#1E3A8A" },
  cardInfo: { flex: 1, paddingTop: 6 },
  memberName: { fontSize: 20, fontWeight: "900", color: "#0F172A", marginBottom: 2 },
  memberCardTitle: { fontSize: 14, fontWeight: "700", color: "#2563EB", marginBottom: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 },
  infoText: { fontSize: 12, color: "#374151" },
  viewProfileBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#EEF2FF", borderRadius: 8 },
  viewProfileText: { fontSize: 12, fontWeight: "700", color: "#3B4FDB" },
  cardDivider: { height: 1, backgroundColor: "#EEF2FF", marginHorizontal: 20 },
  contactRow: { flexDirection: "row", paddingVertical: 18, paddingHorizontal: 12, justifyContent: "space-around" },
  contactItem: { alignItems: "center", flex: 1, gap: 4 },
  contactIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  contactLabel: { fontSize: 9, color: "#374151", textAlign: "center", fontWeight: "600" },
  contactSub: { fontSize: 9, color: "#9CA3AF", textAlign: "center" },

  techSection: { marginTop: 24, paddingBottom: 8, backgroundColor: "#F0F4FA" },
  techHeadRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  techLine: { flex: 1, height: 1, backgroundColor: "#CBD5E1" },
  techHeading: { fontSize: 14, fontWeight: "800", color: "#0F172A", letterSpacing: 1.5 },
  techGrid: { flexDirection: "row", flexWrap: "wrap", gap: 0, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#fff" },
  techBadge: { width: "25%", alignItems: "center", paddingVertical: 20, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#E2E8F0" },
  techIconBox: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  techLetter: { fontSize: 26 },
  techName: { fontSize: 12, fontWeight: "600", color: "#374151", textAlign: "center" },

  footer: { marginTop: 28, paddingTop: 36 },
  footerInner: { gap: 28 },
  footerInnerDesktop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  footerCol: { flex: 1, minWidth: 100 },
  footerLogoCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#1E40AF", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  footerColTitle: { fontSize: 13, fontWeight: "800", color: "#60A5FA", letterSpacing: 1, marginBottom: 10 },
  footerColText: { fontSize: 12, color: "#CBD5E1", lineHeight: 20 },
  footerMadeWith: { fontSize: 14, color: "#CBD5E1", fontStyle: "italic", marginTop: 10 },
  footerSocial: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  footerCopyright: { marginTop: 32, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", alignItems: "center" },
  footerCopyrightText: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
});