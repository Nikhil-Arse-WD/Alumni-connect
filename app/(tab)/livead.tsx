import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width: W } = Dimensions.get("window");
const isMobile = W < 640;
const isTablet = W >= 640 && W < 1100;
const isDesktop = W >= 1100;
const px = isDesktop ? 48 : isTablet ? 28 : 18;
const API = "http://10.254.25.118:2000";

const AUTO_SCROLL_MS = 5000;

export default function FeaturedAdCarousel({ ads }: { ads: any[] }) {
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!ads || ads.length === 0) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
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

  ////////////////////////////////////////////////////////
  // AUTO SCROLL — advances automatically every 5s
  ////////////////////////////////////////////////////////
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

  return (
    <View style={[styles.outerWrap, { paddingHorizontal: px }]}>
      {/* ── Section header row ── */}
      <View style={styles.sectionRow}>
        <View style={styles.sectionLeft}>
          <Ionicons name="star" size={14} color="#f59e0b" />
          <Text style={styles.sectionLabel}>Featured Advertisement</Text>
        </View>
        {ads.length > 1 && (
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtn} onPress={prev} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={15} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.navCount}>
              {current + 1}/{ads.length}
            </Text>
            <TouchableOpacity style={styles.navBtn} onPress={next} activeOpacity={0.8}>
              <Ionicons name="chevron-forward" size={15} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Hero Card — same visual language as Upcoming Event card ── */}
      <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
        {/* BACKGROUND IMAGE */}
        {item.banner_image ? (
          <Image source={{ uri: API + item.banner_image }} style={styles.heroBg} />
        ) : (
          <View style={[styles.heroBg, styles.imgFallback]}>
            <Ionicons name="image-outline" size={44} color="rgba(255,255,255,0.3)" />
          </View>
        )}

        {/* DARK OVERLAY */}
        <View style={styles.overlay} />

        {/* CONTENT */}
        <View style={styles.heroContent}>
          {/* SPONSORED BADGE — styled like the "UPCOMING EVENT" tag */}
          <View style={styles.sponsoredBadge}>
            <Ionicons name="star" size={13} color="#78350F" />
            <Text style={styles.sponsoredText}>SPONSORED</Text>
          </View>

          {/* TITLE */}
          <Text style={styles.heroMainTitle} numberOfLines={2}>
            {item.banner_title}
          </Text>

          {/* ORGANIZER */}
          {item.organisation_name && (
            <Text style={styles.organizer}>{item.organisation_name}</Text>
          )}

          {/* INFO ROW — same pattern as event's calendar/time/venue row */}
          <View style={styles.heroInfoRow}>
            {item.preferred_start_date && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={styles.infoRowText}>{formatDate(item.preferred_start_date)}</Text>
              </View>
            )}

            

            {item.website_link && (
              <View style={styles.infoItem}>
                <Ionicons name="globe-outline" size={18} color="#fff" />
                <Text style={styles.infoRowText} numberOfLines={1}>
                  {item.website_link.replace(/^https?:\/\//, "")}
                </Text>
              </View>
            )}
          </View>

          {/* DESCRIPTION */}
          <Text numberOfLines={2} style={styles.heroDescription}>
            {item.banner_description}
          </Text>

          {/* CTA */}
          <View style={styles.heroBtnRow}>
            <TouchableOpacity
              style={styles.heroBtn}
              activeOpacity={0.88}
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
              <Text style={styles.heroBtnText}>View Details</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dot pagination */}
        {ads.length > 1 && (
          <View style={styles.dotsRow}>
            {ads.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  resetAutoScroll();
                  goTo(i);
                }}
                activeOpacity={0.8}
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
  outerWrap: {
    marginTop: -2,
    backgroundColor: "#fff",
    borderRadius: 18,
    height:isDesktop ?360:350,
    width:"103%",
    marginLeft:isDesktop ?-20:0
  },

  // Section header
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
   marginTop: 3,
   marginLeft:isDesktop ?-25:0
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4F46E5",
  },

  // Nav arrows
  navRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  navBtn: {
    width: 30,
    height: 30,
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  navCount: { fontSize: 12, fontWeight: "700", color: "#64748B", minWidth: 26, textAlign: "center", marginTop: 12, },

  // Hero card — mirrors the Upcoming Event hero styling
  heroSection: {
    marginTop: 0,
    width: isDesktop ?"104%":"100%",
    height: isDesktop ? 300 : isTablet ? 340 : 280,
 
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#1e1b4b",
   marginLeft:isDesktop ?-28:0
  },
  heroBg: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  imgFallback: {
    backgroundColor: "#312EBA",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(2,6,23,0.72)",
  },
  heroContent: {
    width: "100%",
    paddingHorizontal: isDesktop ? 36 : 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  // Sponsored badge (yellow, mirrors "UPCOMING EVENT" badge shape)
  sponsoredBadge: {
    backgroundColor: "#FCD34D",
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    marginBottom: 14,
  },
  sponsoredText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#78350F",
    letterSpacing: 1.2,
  },

  heroMainTitle: {
    fontSize: isDesktop ? 40 : isTablet ? 36 : 26,
    fontWeight: "900",
    color: "#fff",
    lineHeight: isDesktop ? 50 : isTablet ? 44 : 32,
    maxWidth: 900,
  },
  organizer: {
    color: "#C7D2FE",
    fontSize: isDesktop ? 16 : 13,
    marginTop: 8,
    fontWeight: "600",
  },

  heroInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 14,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 6,
  },
  infoRowText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: isDesktop ? 14 : 12,
    fontWeight: "600",
  },

  heroDescription: {
    color: "#E2E8F0",
    fontSize: isDesktop ? 15 : 13,
    lineHeight: 20,
    marginTop: 14,
    maxWidth: 760,
  },

  heroBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  heroBtn: {
    backgroundColor: "#4F46E5",
    height: isDesktop ? 54 : 46,
    paddingHorizontal: isDesktop ? 28 : 20,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  heroBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: isDesktop ? 15 : 13,
    marginRight: 8,
  },

  // Dots
  dotsRow: {
    position: "absolute",
    bottom: 14,
    right: isDesktop ? 30 : 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    width: 22,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
});