import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const AUTO_SCROLL_MS = 5000;

export default function FeaturedAdCarousel({ ads }: { ads: any[] }) {
  const router = useRouter();
  
  // ── REACTIVE LAYOUT ENGINE ──
  // By placing this inside the component, the Web View will instantly 
  // react and resize if the user drags their browser window.
  const { width } = useWindowDimensions();
  const isTablet = width >= 640 && width < 1100;
  const isDesktop = width >= 1100;
  const px = isDesktop ? 32 : isTablet ? 24 : 16;

  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!ads || ads.length === 0) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const goTo = (index: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setCurrent(index), 150);
  };

  const prev = () => {
    resetAutoScroll();
    goTo(current === 0 ? ads.length - 1 : current - 1);
  };

  const next = () => {
    resetAutoScroll();
    goTo(current === ads.length - 1 ? 0 : current + 1);
  };

  const startAutoScroll = () => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prevIndex) => {
        const nextIndex = prevIndex === ads.length - 1 ? 0 : prevIndex + 1;
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        return nextIndex;
      });
    }, AUTO_SCROLL_MS);
  };

  const resetAutoScroll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    startAutoScroll();
  };

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads.length]);

  const item = ads[current];

  // ── SAFE IMAGE PARSER ──
  // Ensures we don't duplicate domain paths if the DB already includes "http://"
  const safeImageUri = item.banner_image 
    ? (item.banner_image.startsWith("http") ? item.banner_image : `${API_BASE}${item.banner_image.startsWith('/') ? '' : '/'}${item.banner_image}`)
    : null;

  return (
    <View style={[styles.outerWrap, { paddingHorizontal: px }]}>
      
      {/* ── Section Header Row ── */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionLeft}>
          <View style={styles.indicatorDot} />
          <Text style={styles.sectionLabel}>Featured Announcements</Text>
        </View>
        {ads.length > 1 && (
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtn} onPress={prev} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={14} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.navCount}>
              {current + 1} <Text style={styles.navCountDivider}>/</Text> {ads.length}
            </Text>
            <TouchableOpacity style={styles.navBtn} onPress={next} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={14} color="#475569" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Premium Hero Card ── */}
      <Animated.View 
        style={[
          styles.heroSection, 
          { opacity: fadeAnim, height: isDesktop ? 260 : isTablet ? 280 : 240 }
        ]}
      >
        {/* Background Image Asset */}
        {safeImageUri ? (
          <Image source={{ uri: safeImageUri }} style={styles.heroBg} resizeMode="cover" />
        ) : (
          <View style={[styles.heroBg, styles.imgFallback]}>
            <Ionicons name="prism-outline" size={48} color="rgba(255,255,255,0.15)" />
          </View>
        )}

        {/* Multi-layered Vignette Overlay */}
        <View style={styles.overlayGradient} />

        {/* Content Container */}
        <View style={styles.heroContent}>
          <View style={styles.topMetaRow}>
            <View style={styles.sponsoredBadge}>
              <Ionicons name="sparkles" size={10} color="#F59E0B" />
              <Text style={styles.sponsoredText}>SPONSORED</Text>
            </View>

            {item.organisation_name && (
              <View style={styles.glassTag}>
                <Text style={styles.organizerText} numberOfLines={1}>
                  {item.organisation_name}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.middleBlock}>
            <Text 
              style={[styles.heroMainTitle, { fontSize: isDesktop ? 26 : isTablet ? 24 : 20, lineHeight: isDesktop ? 34 : isTablet ? 32 : 26 }]} 
              numberOfLines={2}
            >
              {item.banner_title}
            </Text>

            <Text numberOfLines={2} style={[styles.heroDescription, { fontSize: isDesktop ? 14 : 13 }]}>
              {item.banner_description}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.heroInfoRow}>
              {item.preferred_start_date && (
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-clear-outline" size={14} color="#94A3B8" />
                  <Text style={styles.infoRowText}>{formatDate(item.preferred_start_date)}</Text>
                </View>
              )}

              {item.website_link && (
                <View style={styles.infoItem}>
                  <Ionicons name="link-outline" size={14} color="#94A3B8" />
                  <Text style={styles.infoRowText} numberOfLines={1}>
                    {item.website_link.replace(/^https?:\/\/(www\.)?/, "")}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.heroBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/bannerdetail",
                  params: {
                    banner_title: item.banner_title,
                    banner_description: item.banner_description,
                    banner_image: item.banner_image,
                    organisation_name: item.organisation_name,
                    website_link: item.website_link,
                    preferred_start_date: item.preferred_start_date,
                    duration: item.preferred_duration,
                    additional_notes: item.additional_notes,
                    status: item.status,
                  },
                })
              }
            >
              <Text style={styles.heroBtnText}>Explore Now</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Track Pagination Indicators */}
        {ads.length > 1 && (
          <View style={styles.dotsRow}>
            {ads.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  resetAutoScroll();
                  goTo(i);
                }}
                activeOpacity={0.7}
                style={styles.dotTouchTarget}
              >
                <View style={[styles.dot, i === current && styles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: { marginTop: 16, marginBottom: 16, backgroundColor: "transparent", width: "100%" },

  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6366F1" },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#1E293B", letterSpacing: 0.3 },

  navRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  navBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  navCount: { fontSize: 11, fontWeight: "600", color: "#64748B", paddingHorizontal: 6 },
  navCountDivider: { color: "#CBD5E1" },

  heroSection: { width: "100%", overflow: "hidden", borderRadius: 20, backgroundColor: "#0F172A", shadowColor: "#0F172A", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  heroBg: { width: "100%", height: "100%", position: "absolute" },
  imgFallback: { backgroundColor: "#1E1B4B", alignItems: "center", justifyContent: "center" },
  overlayGradient: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(15, 23, 42, 0.82)" },
  
  heroContent: { flex: 1, padding: 20, justifyContent: "space-between" },
  topMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  
  sponsoredBadge: { backgroundColor: "rgba(245, 158, 11, 0.12)", borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.25)", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  sponsoredText: { fontSize: 9, fontWeight: "800", color: "#FBBF24", letterSpacing: 1 },
  
  glassTag: { backgroundColor: "rgba(255, 255, 255, 0.06)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, flexShrink: 1 },
  organizerText: { color: "#E2E8F0", fontSize: 11, fontWeight: "600" },

  middleBlock: { marginVertical: 8 },
  heroMainTitle: { fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.3 },
  heroDescription: { color: "#94A3B8", lineHeight: 18, marginTop: 6 },

  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: "auto" },
  heroInfoRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 16, flex: 1 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoRowText: { color: "#CBD5E1", fontSize: 12, fontWeight: "500" },
  
  heroBtn: { backgroundColor: "#6366F1", height: 36, paddingHorizontal: 14, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  heroBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },

  dotsRow: { position: "absolute", top: 24, right: 20, flexDirection: "row", alignItems: "center", gap: 4 },
  dotTouchTarget: { padding: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255, 255, 255, 0.2)" },
  dotActive: { width: 14, backgroundColor: "#6366F1" },
});