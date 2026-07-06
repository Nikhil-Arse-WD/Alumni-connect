
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width: W } = Dimensions.get("window");
const isWeb     = Platform.OS === "web";
const API       = "http://10.254.25.118:2000";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric", weekday: "long",
    });
  } catch { return dateStr; }
};

// ── Info tile — image ke neeche 4 tiles ──────────────────────────
function InfoTile({ icon, label, value, iconBg, iconColor }: {
  icon: string; label: string; value: string;
  iconBg: string; iconColor: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

export default function BannerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    banner_title: string;
    banner_description: string;
    banner_image: string;
    organisation_name: string;
    website_link: string;
    preferred_start_date: string;
    duration: string;
    additional_notes: string;
    status: string;
  }>();

  const {
    banner_title        = "",
    banner_description  = "",
    banner_image        = "",
    organisation_name   = "",
    website_link        = "",
    preferred_start_date = "",
    duration            = "",
    additional_notes    = "",
    status              = "Approved",
  } = params;

  const imageUri = banner_image ? API + banner_image : null;

  return (
    <View style={styles.screen}>
     <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{
        width: "100%",
        flexGrow: 1,
        paddingBottom: 60,
    }}
>

        {/* ── FULL WIDTH BANNER IMAGE ── */}
        <View style={styles.bannerWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.bannerImg} resizeMode="cover" />
          ) : (
            <View style={[styles.bannerImg, styles.bannerFallback]}>
              <Ionicons name="image-outline" size={60} color="rgba(255,255,255,0.3)" />
            </View>
          )}

          {/* Dark gradient overlay at bottom of image */}
          <View style={styles.bannerOverlay} />

          {/* SPONSORED badge — top left, yellow */}
          <View style={styles.sponsoredBadge}>
            <Text style={styles.sponsoredText}>SPONSORED</Text>
          </View>

          {/* Back button — top left below sponsored */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backTxt}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* ── DETAIL CONTENT ── */}
        <View style={styles.content}>

          {/* Title row + Visit Website button */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              {/* Status badge */}
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusTxt}>{status}</Text>
              </View>
              <Text style={styles.title}>{banner_title}</Text>
              {organisation_name ? (
                <Text style={styles.sponsoredBy}>Sponsored by: {organisation_name}</Text>
              ) : null}
            </View>

            {website_link ? (
              <TouchableOpacity
                style={styles.visitBtn}
                onPress={() => Linking.openURL(website_link)}
                activeOpacity={0.88}
              >
                <Ionicons name="globe-outline" size={16} color="#fff" />
                <Text style={styles.visitBtnTxt}>Visit Website</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Description */}
          <Text style={styles.desc}>{banner_description}</Text>

          {/* ── 4 Info tiles — like screenshot ── */}
          <View style={styles.tilesRow}>
            {preferred_start_date ? (
              <InfoTile
                icon="calendar-outline"
                label="Start Date"
                value={formatDate(preferred_start_date) || preferred_start_date}
                iconBg="#EEF2FF" iconColor="#4F46E5"
              />
            ) : null}
            {organisation_name ? (
              <InfoTile
                icon="people-outline"
                label="Organisation"
                value={organisation_name}
                iconBg="#E0F2FE" iconColor="#0284C7"
              />
            ) : null}
            {duration ? (
              <InfoTile
                icon="time-outline"
                label="Duration"
                value={duration}
                iconBg="#FEF3C7" iconColor="#D97706"
              />
            ) : null}
            {website_link ? (
              <InfoTile
                icon="globe-outline"
                label="Website"
                value={website_link.replace(/^https?:\/\//, "")}
                iconBg="#DCFCE7" iconColor="#16A34A"
              />
            ) : null}
          </View>

          {/* ── Additional Notes ── */}
          {additional_notes ? (
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Ionicons name="document-text-outline" size={18} color="#4F46E5" />
                <Text style={styles.notesTitle}>Additional Notes</Text>
              </View>
              <Text style={styles.notesTxt}>{additional_notes}</Text>
            </View>
          ) : null}

          {/* ── Bottom CTA ── */}
          {website_link ? (
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => Linking.openURL(website_link)}
              activeOpacity={0.88}
            >
              <Ionicons name="open-outline" size={18} color="#fff" />
              <Text style={styles.ctaTxt}>Visit Official Website</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          ) : null}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" ,width:"100%",marginBottom:60},

  // Banner
 // bannerWrap: { position: "relative", width: "100%", height: isWeb ? 380 : 260 },
 bannerWrap: {
    width: "100%",
    alignSelf: "stretch",
    height: isWeb ? 380 : 260,
  },
  bannerImg:  { width: "100%", height: "100%" },
  bannerFallback: {
    backgroundColor: "#1E1B4B",
    alignItems: "center", justifyContent: "center",
  },
  bannerOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  sponsoredBadge: {
    position: "absolute", top: 16, left: 16,
    backgroundColor: "#FCD34D",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 7,
  },
  sponsoredText: {
    fontSize: 10, fontWeight: "900",
    color: "#78350F", letterSpacing: 1.5,
  },

  backBtn: {
    position: "absolute", top: 52, left: 16,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  backTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Content
  content: {
    width: "100%",
    paddingHorizontal: isWeb ? 32 : 12,
    paddingVertical: isWeb ? 32 : 18,
  
    ...(isWeb && {
      maxWidth: 1400,
      alignSelf: "center",
    }),
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },

  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginBottom: 8,
  },
  statusDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  statusTxt: { fontSize: 12, fontWeight: "700", color: "#16A34A" },

  title: {
    fontSize: isWeb ? 28 : 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sponsoredBy: { fontSize: 13, color: "#64748B", fontWeight: "500" },

  visitBtn: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 12, alignSelf: "flex-start", flexShrink: 0,
    shadowColor: "#4F46E5", shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  visitBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },

  desc: {
    fontSize: 15, color: "#475569", lineHeight: 23,
    marginBottom: 22,
    
  },

  // Tiles
  tilesRow: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 12, marginBottom: 22,
  },
  tile: {
    backgroundColor: "#fff",
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "#E2E8F0",
    minWidth: isWeb ? 80 : (W - 52) / 2,
    flex: isWeb ? 1 : 0,
    shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  tileIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginBottom: 10,
  },
  tileLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  tileValue: { fontSize: 14, fontWeight: "800", color: "#0F172A", lineHeight: 20 },

  // Notes
  notesCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: "#E0E7FF",
    marginBottom: 24,
  },
  notesHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  notesTitle: { fontSize: 15, fontWeight: "800", color: "#1E1B4B" },
  notesTxt: { fontSize: 14, color: "#475569", lineHeight: 22 },

  // CTA
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#4F46E5",
    paddingVertical: 16, borderRadius: 14,
    shadowColor: "#4F46E5", shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  ctaTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
});

