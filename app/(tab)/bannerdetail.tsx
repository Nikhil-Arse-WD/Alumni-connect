import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Bind to Environment Variables ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const isWeb = Platform.OS === "web";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric", weekday: "long",
    });
  } catch { return dateStr; }
};

// ── Info tile component ──────────────────────────
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
      <Text style={styles.tileValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

export default function BannerDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWebLayout = width >= 768;

  // ── NEW STATE: Controls the full-screen image viewer ──
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

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
    preferred_start_date= "",
    duration            = "",
    additional_notes    = "",
    status              = "Approved",
  } = params;

  // Construct absolute image path
  const imageUri = banner_image ? (banner_image.startsWith("http") ? banner_image : `${API_BASE}${banner_image}`) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* ── FULL WIDTH BANNER IMAGE ── */}
        <View style={styles.bannerWrap}>
          {imageUri ? (
            // ── NEW: Clickable wrapper for the image ──
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => setIsImageViewerOpen(true)}
              style={[styles.bannerImg, isWeb && { cursor: 'zoom-in' as any }]}
            >
              <Image source={{ uri: imageUri }} style={styles.bannerImg} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <View style={[styles.bannerImg, styles.bannerFallback]}>
              <Ionicons name="image-outline" size={60} color="rgba(255,255,255,0.2)" />
              <Text style={styles.fallbackText}>Image Asset Unavailable</Text>
            </View>
          )}

          {/* Dark gradient overlay at bottom of image */}
          <View style={styles.bannerOverlay} pointerEvents="none" />

          {/* SPONSORED badge */}
          <View style={styles.sponsoredBadge} pointerEvents="none">
            <Text style={styles.sponsoredText}>SPONSORED</Text>
          </View>

          {/* Expand Icon Hint (Only shows if image exists) */}
          {imageUri && (
            <View style={styles.expandHint} pointerEvents="none">
              <Ionicons name="expand-outline" size={16} color="#fff" />
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backTxt}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* ── DETAIL CONTENT ── */}
        <View style={[styles.content, isWebLayout && styles.webContentBox]}>

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
                <Text style={styles.sponsoredBy}>Sponsored by: <Text style={{fontWeight: "700"}}>{organisation_name}</Text></Text>
              ) : null}
            </View>

            {website_link && isWebLayout ? (
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

          {/* ── 4 Info tiles Grid ── */}
          <View style={styles.tilesRow}>
            {preferred_start_date ? (
              <InfoTile
                icon="calendar-outline"
                label="Launch Date"
                value={formatDate(preferred_start_date) || preferred_start_date}
                iconBg="#EEF2FF" iconColor="#4F46E5"
              />
            ) : null}
            {organisation_name ? (
              <InfoTile
                icon="business-outline"
                label="Organisation"
                value={organisation_name}
                iconBg="#E0F2FE" iconColor="#0284C7"
              />
            ) : null}
            {duration ? (
              <InfoTile
                icon="time-outline"
                label="Duration"
                value={duration.replace("_", " ")}
                iconBg="#FEF3C7" iconColor="#D97706"
              />
            ) : null}
            {website_link ? (
              <InfoTile
                icon="link-outline"
                label="Web Link"
                value={website_link.replace(/^https?:\/\//, "").split("/")[0]}
                iconBg="#DCFCE7" iconColor="#16A34A"
              />
            ) : null}
          </View>

          {/* ── Additional Notes ── */}
          {additional_notes ? (
            <View style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Ionicons name="document-text" size={18} color="#4F46E5" />
                <Text style={styles.notesTitle}>Additional Information</Text>
              </View>
              <Text style={styles.notesTxt}>{additional_notes}</Text>
            </View>
          ) : null}

          {/* ── Bottom CTA (Mobile View primary, Desktop secondary) ── */}
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

      {/* ── NEW: FULL SCREEN IMAGE VIEWER MODAL ── */}
      <Modal
        visible={isImageViewerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageViewerOpen(false)} // Handles hardware back button on Android
      >
        <View style={styles.fullScreenOverlay}>
          <TouchableOpacity 
            style={styles.closeFullImageBtn} 
            onPress={() => setIsImageViewerOpen(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          {imageUri && (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.fullScreenImage} 
              resizeMode="contain" // Ensures the whole image is visible
            />
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { width: "100%", flexGrow: 1, paddingBottom: 60 },

  // Banner
  bannerWrap: { width: "100%", height: isWeb ? 420 : 280, backgroundColor: "#0F172A" },
  bannerImg:  { width: "100%", height: "100%" },
  bannerFallback: { alignItems: "center", justifyContent: "center", gap: 8 },
  fallbackText: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600", letterSpacing: 1 },
  bannerOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120, backgroundColor: "rgba(0,0,0,0.4)" },

  expandHint: {
    position: "absolute", bottom: 45, right: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 8, borderRadius: 20
  },

  sponsoredBadge: {
    position: "absolute", top: 16, right: 16,
    backgroundColor: "#FCD34D",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, elevation: 2
  },
  sponsoredText: { fontSize: 10.5, fontWeight: "900", color: "#78350F", letterSpacing: 1 },

  backBtn: {
    position: "absolute", top: 16, left: 16,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  backTxt: { color: "#fff", fontWeight: "700", fontSize: 13.5 },

  // Content Block
  content: {
    width: "100%",
    paddingHorizontal: 18,
    paddingVertical: 24,
    marginTop: -20,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  webContentBox: {
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 32,
    paddingVertical: 32,
    marginTop: -40,
    borderRadius: 24,
    shadowColor: "#0F172A", shadowOpacity: 0.05, shadowRadius: 24, elevation: 4
  },

  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 16, marginBottom: 16 },

  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, marginBottom: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16A34A" },
  statusTxt: { fontSize: 12, fontWeight: "800", color: "#16A34A", letterSpacing: 0.5, textTransform: "uppercase" },

  title: { fontSize: isWeb ? 32 : 24, fontWeight: "900", color: "#0F172A", letterSpacing: -0.5, marginBottom: 6, lineHeight: 34 },
  sponsoredBy: { fontSize: 14, color: "#64748B", fontWeight: "500" },

  visitBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 14, alignSelf: "flex-start", flexShrink: 0,
    shadowColor: "#4F46E5", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  visitBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 13.5 },

  desc: { fontSize: 15.5, color: "#334155", lineHeight: 26, marginBottom: 28 },

  // Flexbox Grid System for Tiles
  tilesRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  tile: {
    backgroundColor: "#fff",
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: "#E2E8F0",
    flexGrow: 1, flexShrink: 1,
    flexBasis: isWeb ? 150 : "45%",
    shadowColor: "#0F172A", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  tileIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  tileLabel: { fontSize: 11.5, color: "#64748B", fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  tileValue: { fontSize: 14.5, fontWeight: "800", color: "#0F172A", lineHeight: 20 },

  // Notes
  notesCard: { backgroundColor: "#EEF2FF", borderRadius: 18, padding: 20, borderWidth: 1, borderColor: "#E0E7FF", marginBottom: 32 },
  notesHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  notesTitle: { fontSize: 15.5, fontWeight: "800", color: "#312EBA" },
  notesTxt: { fontSize: 14.5, color: "#4338CA", lineHeight: 22, fontWeight: "500" },

  // CTA
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#4F46E5",
    paddingVertical: 18, borderRadius: 16,
    shadowColor: "#4F46E5", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  ctaTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },

  // ── Full Screen Modal Styles ──
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)", // Pitch black background
    justifyContent: "center",
    alignItems: "center",
  },
  closeFullImageBtn: {
    position: "absolute",
    top: Platform.OS === 'ios' ? 60 : 30, // Safely clears notches
    right: 24,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 8,
    borderRadius: 20,
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
});