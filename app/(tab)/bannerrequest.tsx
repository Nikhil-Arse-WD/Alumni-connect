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

const API_URL  = "http://10.254.25.118:2000/banner-request";
const isWeb    = Platform.OS === "web";

const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

// ── Reusable bits (kept local to this screen) ───────────────────────
function TInput({ value, onChange, placeholder, keyboardType = "default", multiline = false }: any) {
  return (
    <TextInput
      style={[styles.input, multiline && { height: 100, textAlignVertical: "top", paddingTop: 12 }]}
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
        <Ionicons name={icon as any} size={15} color="#6366F1" />
      </View>
      <Text style={styles.secTitle}>{title}</Text>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function FieldBox({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
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
      } catch {}
      setLoadingUser(false);
    })();
  }, []);

  const pickBannerImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, quality: 0.85, aspect: [16, 9],
    });
    if (!result.canceled) setBannerImage(result.assets[0].uri);
  };

  const validate = (): boolean => {
    const e: { [k: string]: string } = {};
    if (!form.full_name.trim())         e.full_name = "Name is required";
    if (!form.email.trim())             e.email = "Email is required";
    if (!form.mobile.trim())            e.mobile = "Mobile number is required";
    if (!form.banner_title.trim())      e.banner_title = "Banner title is required";
    if (!form.banner_description.trim()) e.banner_description = "Please describe what the banner is for";
    if (!bannerImage)                   e.banner_image = "Please upload a banner image";
    if (form.preferred_duration === "custom" && !form.preferred_start_date.trim()) {
      e.preferred_start_date = "Please specify preferred start date";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      showAlert("Missing information", "Please fill in all required fields.");
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
      showAlert("Error", "Failed to send request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loaderTxt}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* ══ HEADER ══ */}
        <LinearGradient
          colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.dec1} />
          <View style={styles.dec2} />

          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Request Ad Banner</Text>
              <Text style={styles.headerSub}>Ask admin to feature your banner on the Home page</Text>
            </View>
          </View>

          <View style={styles.iconCircleWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="megaphone-outline" size={30} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        {/* ══ FORM ══ */}
        <View style={styles.content}>

          {/* Info banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color="#5B21B6" />
            <Text style={styles.infoBannerTxt}>
              Fill out this form to request your advertisement banner be shown on the Home page.
              An admin will review your request and get back to you.
            </Text>
          </View>

          {/* Requester Info */}
          <SectionHead icon="person-outline" title="Your Details" />
          <Card>
            <Row2>
              <FieldBox label="Full Name *">
                <TInput value={form.full_name} onChange={(t: string) => set("full_name", t)} placeholder="Rahul Sharma" />
              </FieldBox>
              <FieldBox label="Mobile Number *">
                <TInput value={form.mobile} onChange={(t: string) => set("mobile", t)} placeholder="98765 43210" keyboardType="phone-pad" />
              </FieldBox>
            </Row2>
            <FieldBox label="Email *">
              <TInput value={form.email} onChange={(t: string) => set("email", t)} placeholder="you@example.com" keyboardType="email-address" />
            </FieldBox>
            <FieldBox label="Organisation / Business Name" hint="Optional — if this ad is for a business">
              <TInput value={form.organisation_name} onChange={(t: string) => set("organisation_name", t)} placeholder="Your company name" />
            </FieldBox>
          </Card>

          {/* Banner details */}
          <SectionHead icon="image-outline" title="Banner Details" />
          <Card>
            <FieldBox label="Banner Title *">
              <TInput value={form.banner_title} onChange={(t: string) => set("banner_title", t)} placeholder="e.g. Grand Opening Offer!" />
            </FieldBox>
            <FieldBox label="Description *" hint="What is this banner about?">
              <TInput
                value={form.banner_description}
                onChange={(t: string) => set("banner_description", t)}
                placeholder="Briefly describe the purpose of your banner..."
                multiline
              />
            </FieldBox>
            <FieldBox label="Website / Link" hint="Optional — where should the banner link to?">
              <TInput value={form.website_link} onChange={(t: string) => set("website_link", t)} placeholder="https://example.com" keyboardType="url" />
            </FieldBox>

            {/* Banner image upload */}
            <FieldBox label="Banner Image *" hint="Recommended size: 1200 x 400px (16:9 works well)">
              <TouchableOpacity style={styles.uploadBox} onPress={pickBannerImage} activeOpacity={0.85}>
                {bannerImage ? (
                  <Image source={{ uri: bannerImage }} style={styles.uploadPreview} />
                ) : (
                  <View style={styles.uploadEmpty}>
                    <Ionicons name="cloud-upload-outline" size={26} color="#6366F1" />
                    <Text style={styles.uploadEmptyTxt}>Tap to upload banner image</Text>
                  </View>
                )}
                {bannerImage && (
                  <View style={styles.uploadOverlay}>
                    <Ionicons name="camera" size={14} color="#fff" />
                    <Text style={styles.uploadOverlayTxt}>Change</Text>
                  </View>
                )}
              </TouchableOpacity>
            </FieldBox>
          </Card>

          {/* Duration */}
          <SectionHead icon="calendar-outline" title="Requested Duration" />
          <Card>
            <FieldBox label="How long should the banner run?">
              <ChipGroup options={DURATION_OPTIONS} value={form.preferred_duration} onChange={v => set("preferred_duration", v)} />
            </FieldBox>
            <FieldBox
              label={form.preferred_duration === "custom" ? "Preferred Start Date *" : "Preferred Start Date"}
              hint="Optional — admin will confirm the final schedule"
            >
              <TInput
                value={form.preferred_start_date}
                onChange={(t: string) => set("preferred_start_date", t)}
                placeholder="YYYY-MM-DD"
              />
            </FieldBox>
          </Card>

          {/* Notes */}
          <SectionHead icon="chatbox-ellipses-outline" title="Additional Notes" />
          <Card>
            <FieldBox label="Anything else the admin should know?" hint="Optional">
              <TInput
                value={form.additional_notes}
                onChange={(t: string) => set("additional_notes", t)}
                placeholder="Any special instructions..."
                multiline
              />
            </FieldBox>
          </Card>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.72 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.88}
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
                    <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                    <Text style={styles.submitTxt}>Send Request to Admin</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" },
  loaderTxt:  { marginTop: 12, color: "#64748B", fontSize: 14 },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 54 : 20,
    paddingBottom: 34,
    overflow: "hidden",
  },
  dec1: {
    position: "absolute", right: -60, top: -40,
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)",
  },
  dec2: {
    position: "absolute", right: 30, top: 40,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  headerTopRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, marginBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 },

  iconCircleWrap: { alignItems: "center", marginTop: 6 },
  iconCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center", alignItems: "center",
  },

  content: {
    padding: isWeb ? 28 : 16,
    maxWidth: isWeb ? 1400 : undefined,
    alignSelf: "center",
    width: "100%",
    marginBottom: Platform.OS === "web" ? 0 : 50,
  },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#F3E8FF", borderRadius: 14,
    padding: 14, marginBottom: 8,
  },
  infoBannerTxt: { flex: 1, fontSize: 12.5, color: "#5B21B6", lineHeight: 18 },

  secHead: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 22, marginBottom: 10,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  secIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center", alignItems: "center",
  },
  secTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },

  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16,
    marginBottom: 4,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  rowWeb: { flexDirection: "row", gap: 12 },
  rowMob: { flexDirection: "column" },

  fieldBox: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  hint:  { fontSize: 11.5, color: "#94A3B8", marginTop: 5 },

  input: {
    backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0",
    borderRadius: 12, paddingHorizontal: 14, height: 48,
    fontSize: 14, color: "#111",
  },

  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip:    { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
  chipOn:  { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  chipTxt:   { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipTxtOn: { color: "#4F46E5" },

  uploadBox: {
    height: 160, borderRadius: 14, overflow: "hidden",
    backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0",
    borderStyle: "dashed", justifyContent: "center", alignItems: "center",
  },
  uploadEmpty: { alignItems: "center", gap: 6 },
  uploadEmptyTxt: { fontSize: 13, color: "#6366F1", fontWeight: "600" },
  uploadPreview: { width: "100%", height: "100%" },
  uploadOverlay: {
    position: "absolute", bottom: 8, right: 8,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  uploadOverlayTxt: { color: "#fff", fontSize: 11, fontWeight: "600" },

  btnRow: { flexDirection: "row", gap: 12, marginTop: 28 },
  submitBtn: { flex: 2, borderRadius: 16, overflow: "hidden" },
  submitBtnInner: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, paddingVertical: 15,
  },
  submitTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cancelBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    backgroundColor: "#000", borderRadius: 16,
    paddingVertical: 15, borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  cancelTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});