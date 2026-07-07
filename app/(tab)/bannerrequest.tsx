// ======================================================
// bannerrequest.tsx
// Alumni submits a request to Admin for placing an
// advertisement banner on the Home page.
// Route: app/bannerrequest.tsx
// ======================================================

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Base API URL dynamically loaded from .env
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://127.0.0.1:2000";
const API_URL  = `${API_BASE}/banner-request`;
const isWeb    = Platform.OS === "web";

const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

// ── Reusable Form Components ───────────────────────
function TInput({ value, onChange, placeholder, keyboardType = "default", multiline = false, error }: any) {
  return (
    <TextInput
      style={[
        styles.input, 
        multiline && { height: 110, textAlignVertical: "top", paddingTop: 14 },
        error && styles.inputError // Visual red border indicator
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboardType}
      multiline={multiline}
    />
  );
}

function ChipGroup({ options, value, onChange }: {
  options: { label: string; value: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map(o => (
        <TouchableOpacity
          key={o.value}
          style={[styles.chip, value === o.value && styles.chipOn]}
          onPress={() => onChange(o.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipTxt, value === o.value && styles.chipTxtOn]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function SectionHead({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.secHead}>
      <View style={styles.secIcon}>
        <Ionicons name={icon as any} size={16} color="#4F46E5" />
      </View>
      <Text style={styles.secTitle}>{title}</Text>
    </View>
  );
}

function FieldBox({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {!!error && <Text style={styles.errorTxt}>{error}</Text>}
      {!!hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  return (
    <View style={isWeb ? styles.rowWeb : styles.rowMob}>
      {React.Children.map(children, child => (
        <View style={isWeb ? { flex: 1 } : { width: "100%" }}>{child}</View>
      ))}
    </View>
  );
}

const DURATION_OPTIONS = [
  { label: "1 Week",  value: "1_week"  },
  { label: "2 Weeks", value: "2_weeks" },
  { label: "1 Month", value: "1_month" },
  { label: "Custom",  value: "custom"  },
];

// ─────────────────────────────────────────────────────────────────
export default function BannerRequestScreen() {
  const router = useRouter();

  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name:          "",
    email:               "",
    mobile:              "",
    organisation_name:   "",
    banner_title:        "",
    banner_description:  "",
    website_link:        "",
    preferred_duration:  "1_week",
    preferred_start_date:"",
    additional_notes:    "",
  });

  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  // ── Prefill name / email / mobile from the logged-in user ──────
  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem("user");
        if (data) {
          const u = JSON.parse(data);
          setForm(p => ({
            ...p,
            full_name: u.full_name || "",
            email:     u.email     || "",
            mobile:    u.mobile    || "",
          }));
        }
      } catch (e) {
        console.warn("Failed to load user session", e);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

 const pickBannerImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // 🚨 Fixed the deprecation warning
      allowsEditing: true, 
      quality: 0.85, 
      aspect: [16, 9],
    });
    if (!result.canceled) {
      setBannerImage(result.assets[0].uri);
      setErrors(p => ({ ...p, banner_image: "" }));
    }
  };

  const validate = (): boolean => {
    const e: { [k: string]: string } = {};
    if (!form.full_name.trim())          e.full_name = "Name is required";
    if (!form.email.trim())              e.email = "Email is required";
    if (!form.mobile.trim())             e.mobile = "Mobile number is required";
    if (!form.banner_title.trim())       e.banner_title = "Banner title is required";
    if (!form.banner_description.trim()) e.banner_description = "Please describe what the banner is for";
    if (!bannerImage)                    e.banner_image = "Please upload a banner image";
    if (form.preferred_duration === "custom" && !form.preferred_start_date.trim()) {
      e.preferred_start_date = "Please specify preferred start date";
    }
    
    setErrors(e);
    if (Object.keys(e).length > 0) {
      showAlert("Missing information", "Please fill in all required fields highlighted in red.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      if (bannerImage) {
        if (isWeb) {
          const res  = await fetch(bannerImage);
          const blob = await res.blob();
          fd.append("banner_image", blob, "banner.jpg");
        } else {
          const filename = bannerImage.split("/").pop() || "banner.jpg";
          const match    = /\.(\w+)$/.exec(filename);
          fd.append("banner_image", {
            uri: bannerImage, name: filename,
            type: match ? `image/${match[1]}` : "image/jpeg",
          } as any);
        }
      }

      await axios.post(API_URL, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showAlert("Request Sent ✅", "Your advertisement banner request has been sent to the admin for review. You'll be notified once it's approved.");
      router.back();
    } catch {
      showAlert("Error", "Failed to send request. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loaderTxt}>Initializing form...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }} edges={['top']}>
     <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>

        {/* ══ HERO HEADER ══ */}
        <LinearGradient
          colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.dec1} />
          <View style={styles.dec2} />

          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Request Ad Banner</Text>
              <Text style={styles.headerSub}>Feature your business or event on the SVIMSAA Home page</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ══ FORM CONTENT ══ */}
        <View style={styles.content}>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color="#5B21B6" style={{ marginTop: 2 }} />
            <Text style={styles.infoBannerTxt}>
              Submit your banner asset and requirements here. An admin will review your artwork and assign a placement fee for your requested duration.
            </Text>
          </View>

          {/* Requester Info */}
          <SectionHead icon="person-outline" title="Your Details" />
          <View style={styles.card}>
            <Row2>
              <FieldBox label="Full Name *" error={errors.full_name}>
                <TInput value={form.full_name} onChange={(t: string) => set("full_name", t)} placeholder="Rahul Sharma" error={errors.full_name} />
              </FieldBox>
              <FieldBox label="Mobile Number *" error={errors.mobile}>
                <TInput value={form.mobile} onChange={(t: string) => set("mobile", t)} placeholder="98765 43210" keyboardType="phone-pad" error={errors.mobile} />
              </FieldBox>
            </Row2>
            <Row2>
              <FieldBox label="Email Address *" error={errors.email}>
                <TInput value={form.email} onChange={(t: string) => set("email", t)} placeholder="you@example.com" keyboardType="email-address" error={errors.email} />
              </FieldBox>
              <FieldBox label="Organisation / Business Name" hint="Optional">
                <TInput value={form.organisation_name} onChange={(t: string) => set("organisation_name", t)} placeholder="e.g. Infosys Ltd." />
              </FieldBox>
            </Row2>
          </View>

          {/* Banner details */}
          <SectionHead icon="image-outline" title="Banner Artwork" />
          <View style={styles.card}>
            <FieldBox label="Banner Title *" error={errors.banner_title}>
              <TInput value={form.banner_title} onChange={(t: string) => set("banner_title", t)} placeholder="e.g. Tech Conference 2026" error={errors.banner_title} />
            </FieldBox>
            
            <FieldBox label="Description *" hint="Briefly explain the purpose of this advertisement." error={errors.banner_description}>
              <TInput
                value={form.banner_description}
                onChange={(t: string) => set("banner_description", t)}
                placeholder="We are hosting a recruitment drive and would like to..."
                multiline
                error={errors.banner_description}
              />
            </FieldBox>

            <FieldBox label="Website / Target Link" hint="Optional — Where should users be redirected when they tap the banner?">
              <TInput value={form.website_link} onChange={(t: string) => set("website_link", t)} placeholder="https://yourwebsite.com" keyboardType="url" />
            </FieldBox>

            {/* Banner image upload */}
            <FieldBox label="Banner Image Asset *" hint="Required format: 16:9 Aspect Ratio (e.g. 1200 x 400px)" error={errors.banner_image}>
              <TouchableOpacity 
                style={[styles.uploadBox, !!errors.banner_image && { borderColor: "#DC2626", backgroundColor: "#FEF2F2" }]} 
                onPress={pickBannerImage} 
                activeOpacity={0.85}
              >
                {bannerImage ? (
                  <Image source={{ uri: bannerImage }} style={styles.uploadPreview} />
                ) : (
                  <View style={styles.uploadEmpty}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#4F46E5" />
                    <Text style={styles.uploadEmptyTxt}>Tap to select image from gallery</Text>
                  </View>
                )}
                {bannerImage && (
                  <View style={styles.uploadOverlay}>
                    <Ionicons name="camera" size={14} color="#fff" />
                    <Text style={styles.uploadOverlayTxt}>Change Image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </FieldBox>
          </View>

          {/* Duration */}
          <SectionHead icon="time-outline" title="Scheduling" />
          <View style={styles.card}>
            <FieldBox label="Requested Display Duration">
              <ChipGroup options={DURATION_OPTIONS} value={form.preferred_duration} onChange={v => set("preferred_duration", v)} />
            </FieldBox>
            
            {form.preferred_duration === "custom" && (
              <FieldBox
                label="Preferred Start Date *"
                hint="Admin will review and confirm availability for this slot."
                error={errors.preferred_start_date}
              >
                <TInput
                  value={form.preferred_start_date}
                  onChange={(t: string) => set("preferred_start_date", t)}
                  placeholder="YYYY-MM-DD"
                  error={errors.preferred_start_date}
                />
              </FieldBox>
            )}
          </View>

          {/* Notes */}
          <SectionHead icon="chatbox-ellipses-outline" title="Additional Notes" />
          <View style={styles.card}>
            <FieldBox label="Message for the Admin" hint="Optional">
              <TInput
                value={form.additional_notes}
                onChange={(t: string) => set("additional_notes", t)}
                placeholder="Any special requests or instructions..."
                multiline
              />
            </FieldBox>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtnInner}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#fff" />
                    <Text style={styles.submitTxt}>Submit Application</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderTxt:  { marginTop: 14, color: "#64748B", fontSize: 15, fontWeight: "500" },

  header: {
    paddingHorizontal: 24,
    paddingTop: 10, // 🚨 Let SafeAreaView handle the camera notch automatically
    paddingBottom: 40,
    overflow: "hidden",
  },
  dec1: {
    position: "absolute", right: -60, top: -40,
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.1)",
  },
  dec2: {
    position: "absolute", right: 40, top: 50,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  headerTopRow: {
    flexDirection: "row", alignItems: "center",
    gap: 16, marginBottom: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerSub:   { fontSize: 13.5, color: "rgba(255,255,255,0.8)", marginTop: 4, fontWeight: "500", lineHeight: 18 },

  content: {
    padding: isWeb ? 32 : 16,
    maxWidth: isWeb ? 800 : undefined,
    alignSelf: "center",
    width: "100%",
    marginTop: -20, // Pulls the content up slightly to overlap the header nicely
  },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: "#EEF2FF", borderRadius: 16,
    padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "#E0E7FF"
  },
  infoBannerTxt: { flex: 1, fontSize: 13, color: "#4338CA", lineHeight: 20, fontWeight: "500" },

  secHead: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 24, marginBottom: 12,
    paddingBottom: 8,
  },
  secIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center", alignItems: "center",
  },
  secTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },

  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 20,
    shadowColor: "#0F172A", shadowOpacity: 0.04,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
    borderWidth: 1, borderColor: "#F1F5F9"
  },

  rowWeb: { flexDirection: "row", gap: 16 },
  rowMob: { flexDirection: "column" },

  fieldBox: { marginBottom: 18 },
  label: { fontSize: 13.5, fontWeight: "700", color: "#334155", marginBottom: 8 },
  hint:  { fontSize: 12, color: "#94A3B8", marginTop: 6 },
  errorTxt: { fontSize: 12, color: "#DC2626", marginTop: 6, fontWeight: "500" },

  input: {
    backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0",
    borderRadius: 14, paddingHorizontal: 16, height: 52,
    fontSize: 14, color: "#0F172A",
  },
  inputError: {
    borderColor: "#FCA5A5", backgroundColor: "#FEF2F2"
  },

  chipRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  chip:    { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
  chipOn:  { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  chipTxt:   { fontSize: 13.5, fontWeight: "600", color: "#64748B" },
  chipTxtOn: { color: "#4F46E5", fontWeight: "700" },

  uploadBox: {
    height: 180, borderRadius: 16, overflow: "hidden",
    backgroundColor: "#F8FAFC", borderWidth: 2, borderColor: "#E2E8F0",
    borderStyle: "dashed", justifyContent: "center", alignItems: "center",
  },
  uploadEmpty: { alignItems: "center", gap: 8 },
  uploadEmptyTxt: { fontSize: 14, color: "#4F46E5", fontWeight: "600" },
  uploadPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadOverlay: {
    position: "absolute", bottom: 12, right: 12,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  uploadOverlayTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },

  btnRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  submitBtn: { flex: 2, borderRadius: 16, overflow: "hidden" },
  submitBtnInner: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10, paddingVertical: 16,
  },
  submitTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  cancelBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", borderRadius: 16,
    paddingVertical: 16, borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  cancelTxt: { color: "#475569", fontWeight: "700", fontSize: 15 },
});