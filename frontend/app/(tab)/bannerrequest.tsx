// ======================================================
// bannerrequest.tsx
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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
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
        multiline && { height: 110, textAlignVertical: "top", paddingTop: 16 },
        error && styles.inputError
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboardType}
      multiline={multiline}
      {...(Platform.OS === "web" ? { outlineStyle: "none" } : {})}
    />
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

// ─────────────────────────────────────────────────────────────────
export default function BannerRequestScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktopLayout = width >= 850;

  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  
  // Dynamic Weeks Tracker
  const [weeks, setWeeks] = useState(1);

  const [form, setForm] = useState({
    full_name:          "",
    email:              "",
    mobile:             "",
    organisation_name:  "",
    banner_title:       "",
    banner_description: "",
    website_link:       "",
    additional_notes:   "",
  });

  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  // ── DYNAMIC PRICE CALCULATOR ──
  // Base 500 for first week, 450 for each additional week.
  const amountToPay = 500 + (weeks - 1) * 450;

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
      mediaTypes: ['images'], 
      allowsEditing: false, // <-- Changed to false to stop permanent cropping
      quality: 0.85, 
    });
    
    if (!result.canceled) {
      const asset = result.assets[0];
      
      // Client-side 2MB file size validation
      if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
        showAlert("File Too Large", "Please select an image smaller than 2MB.");
        return;
      }

      setBannerImage(asset.uri);
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
    
    setErrors(e);
    if (Object.keys(e).length > 0) {
      showAlert("Missing Information", "Please fill in all required fields highlighted in red.");
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

      // Append Dynamic Logic Data
      fd.append("preferred_duration", `${weeks}_weeks`);
      fd.append("amount_to_pay", amountToPay.toString());

      if (bannerImage) {
        if (isWeb) {
          const res  = await fetch(bannerImage);
          const blob = await res.blob();
          fd.append("banner_image", blob, "banner.jpg");
        } else {
          const filename = bannerImage.split("/").pop() || "banner.jpg";
          const match    = /\.(\w+)$/.exec(filename);
          
          // STRICT MIME TYPE ENFORCEMENT
          let ext = match ? match[1].toLowerCase() : "jpeg";
          if (ext === "jpg") ext = "jpeg";

          fd.append("banner_image", {
            uri: bannerImage, name: filename,
            type: `image/${ext}`,
          } as any);
        }
      }

      // NO EXPLICIT HEADERS — Let Axios configure the multipart boundary
      const response = await axios.post(API_URL, fd);

      if (amountToPay > 0 && response.data.id) {
        router.push({
          pathname: "/Paybanner" as any, 
          params: { id: response.data.id, amount: amountToPay, title: form.banner_title }
        });
      }

    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to send the request. Please check your connection and try again.";
      showAlert("Upload Error", errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!API_BASE) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={54} color="#EF4444" />
        <Text style={styles.errorTitle}>Configuration Mismatch</Text>
        <Text style={styles.errorSub}>The backend endpoint variable is undefined.</Text>
      </View>
    );
  }

  if (loadingUser) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loaderTxt}>Initializing secure application...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

          {/* ══ HERO HEADER ══ */}
          <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
            <View style={styles.dec1} />
            <View style={styles.dec2} />
            <View style={styles.headerTopRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Advertisement Request</Text>
                <Text style={styles.headerSub}>Submit a promotional banner for placement on the SVIMSAA dashboard.</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ══ FORM CONTENT ══ */}
          <View style={[styles.content, isDesktopLayout && styles.contentDesktop]}>
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color="#4F46E5" style={{ marginTop: 2 }} />
              <Text style={styles.infoBannerTxt}>
                Submit your banner asset below. Based on your selected duration, completing the secure payment will instantly push your banner live!
              </Text>
            </View>

            {/* Requester Info */}
            <SectionHead icon="person-outline" title="Applicant Credentials" />
            <View style={styles.card}>
              <View style={isDesktopLayout ? styles.rowDesktop : styles.rowMobile}>
                <View style={styles.flexItem}>
                  <FieldBox label="Full Name *" error={errors.full_name}>
                    <TInput value={form.full_name} onChange={(t: string) => set("full_name", t)} placeholder="Rahul Sharma" error={errors.full_name} />
                  </FieldBox>
                </View>
                <View style={styles.flexItem}>
                  <FieldBox label="Mobile Number *" error={errors.mobile}>
                    <TInput value={form.mobile} onChange={(t: string) => set("mobile", t)} placeholder="98765 43210" keyboardType="phone-pad" error={errors.mobile} />
                  </FieldBox>
                </View>
              </View>

              <View style={isDesktopLayout ? styles.rowDesktop : styles.rowMobile}>
                <View style={styles.flexItem}>
                  <FieldBox label="Email Address *" error={errors.email}>
                    <TInput value={form.email} onChange={(t: string) => set("email", t)} placeholder="you@example.com" keyboardType="email-address" error={errors.email} />
                  </FieldBox>
                </View>
                <View style={styles.flexItem}>
                  <FieldBox label="Organisation / Business Name" hint="Optional">
                    <TInput value={form.organisation_name} onChange={(t: string) => set("organisation_name", t)} placeholder="e.g. Infosys Ltd." />
                  </FieldBox>
                </View>
              </View>
            </View>

            {/* Banner details */}
            <SectionHead icon="image-outline" title="Promotional Artwork" />
            <View style={styles.card}>
              <FieldBox label="Banner Reference Title *" error={errors.banner_title}>
                <TInput value={form.banner_title} onChange={(t: string) => set("banner_title", t)} placeholder="e.g. Winter Recruitment Drive 2026" error={errors.banner_title} />
              </FieldBox>
              
              <FieldBox label="Asset Description *" error={errors.banner_description}>
                <TInput value={form.banner_description} onChange={(t: string) => set("banner_description", t)} placeholder="We are actively hiring..." multiline error={errors.banner_description} />
              </FieldBox>

              <FieldBox label="Target Domain / URL" hint="Optional — Link when a user clicks the banner.">
                <TInput value={form.website_link} onChange={(t: string) => set("website_link", t)} placeholder="https://yourwebsite.com/apply" keyboardType="url" />
              </FieldBox>

              <FieldBox label="Artwork Image Asset *" hint="Max 2MB. Dimensions: 16:9 Aspect Ratio." error={errors.banner_image}>
                <TouchableOpacity style={[styles.uploadBox, !!errors.banner_image && styles.uploadBoxError]} onPress={pickBannerImage} activeOpacity={0.85}>
                  {bannerImage ? <Image source={{ uri: bannerImage }} style={styles.uploadPreview} /> : (
                    <View style={styles.uploadEmpty}>
                      <View style={styles.uploadIconWrap}><Ionicons name="cloud-upload-outline" size={32} color="#4F46E5" /></View>
                      <Text style={styles.uploadEmptyTxt}>Tap to select an image from your device</Text>
                      <Text style={styles.uploadEmptySub}>JPG, PNG files accepted</Text>
                    </View>
                  )}
                  {bannerImage && <View style={styles.uploadOverlay}><Ionicons name="sync-outline" size={14} color="#fff" /><Text style={styles.uploadOverlayTxt}>Replace</Text></View>}
                </TouchableOpacity>
              </FieldBox>
            </View>

            {/* Duration Selector */}
            <SectionHead icon="calendar-outline" title="Allocation Scheduling" />
            <View style={styles.card}>
              <FieldBox label="Requested Display Duration">
                <View style={styles.weekSelector}>
                  <TouchableOpacity 
                    style={styles.weekBtn} 
                    onPress={() => setWeeks(prev => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove" size={24} color="#4F46E5" />
                  </TouchableOpacity>
                  
                  <View style={styles.weekDisplay}>
                    <Text style={styles.weekTxt}>{weeks} Week{weeks > 1 ? "s" : ""}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.weekBtn} 
                    onPress={() => setWeeks(prev => prev + 1)}
                  >
                    <Ionicons name="add" size={24} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
                
                {/* Visual Price Calculator Indicator */}
                <View style={styles.priceCalcBox}>
                  <Text style={styles.priceCalcTxt}>Total Calculated Fee: ₹{amountToPay}</Text>
                </View>
              </FieldBox>
            </View>

            <SectionHead icon="chatbox-ellipses-outline" title="Supplementary Information" />
            <View style={styles.card}>
              <FieldBox label="Direct Message for the Admin" hint="Optional">
                <TInput value={form.additional_notes} onChange={(t: string) => set("additional_notes", t)} placeholder="Any specific placement instructions..." multiline />
              </FieldBox>
            </View>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtnInner}>
                  {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
                    <><Ionicons name="wallet-outline" size={18} color="#fff" /><Text style={styles.submitTxt}>Complete Payment</Text></>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}><Text style={styles.cancelTxt}>Cancel</Text></TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { flexGrow: 1, paddingBottom: 130 },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderTxt:  { marginTop: 14, color: "#64748B", fontSize: 15, fontWeight: "600" },
  errorContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 32 },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 44, overflow: "hidden" },
  dec1: { position: "absolute", right: -60, top: -40, width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" },
  dec2: { position: "absolute", right: 40, top: 50, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)" },
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  headerSub:   { fontSize: 13.5, color: "rgba(255,255,255,0.85)", marginTop: 4, fontWeight: "500", lineHeight: 18 },
  content: { padding: 16, width: "100%", alignSelf: "center", marginTop: -20 },
  contentDesktop: { maxWidth: 900, padding: 32 },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#EEF2FF", borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: "#E0E7FF" },
  infoBannerTxt: { flex: 1, fontSize: 13.5, color: "#4338CA", lineHeight: 22, fontWeight: "600" },
  secHead: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24, marginBottom: 12, paddingBottom: 8 },
  secIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  secTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, shadowColor: "#0F172A", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: "#F1F5F9" },
  rowDesktop: { flexDirection: "row", gap: 16 },
  rowMobile:  { flexDirection: "column", gap: 0 },
  flexItem:   { flex: 1 },
  fieldBox: { marginBottom: 18 },
  label: { fontSize: 13.5, fontWeight: "700", color: "#334155", marginBottom: 8 },
  hint:  { fontSize: 12.5, color: "#64748B", marginTop: 6, fontWeight: "500" },
  errorTxt: { fontSize: 12, color: "#DC2626", marginTop: 6, fontWeight: "600" },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 16, height: 52, fontSize: 14, color: "#0F172A" },
  inputError: { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
  uploadBox: { height: 200, borderRadius: 18, overflow: "hidden", backgroundColor: "#F8FAFC", borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed", justifyContent: "center", alignItems: "center", marginTop: 6 },
  uploadBoxError: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  uploadEmpty: { alignItems: "center", gap: 10 },
  uploadIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  uploadEmptyTxt: { fontSize: 14.5, color: "#4F46E5", fontWeight: "700", marginTop: 4 },
  uploadEmptySub: { fontSize: 12.5, color: "#94A3B8", fontWeight: "600" },
  uploadPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadOverlay: { position: "absolute", bottom: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(15, 23, 42, 0.85)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24 },
  uploadOverlayTxt: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  btnRow: { flexDirection: "row", gap: 14, marginTop: 32 },
  submitBtn: { flex: 2.5, borderRadius: 16, overflow: "hidden", shadowColor: "#4F46E5", shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
  submitBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18 },
  submitTxt: { color: "#fff", fontWeight: "800", fontSize: 15.5 },
  cancelBtn: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: 16, paddingVertical: 18, borderWidth: 1.5, borderColor: "#E2E8F0" },
  cancelTxt: { color: "#475569", fontWeight: "700", fontSize: 15 },
  
  // New Stepper UI Styles
  weekSelector: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  weekBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  weekDisplay: { flex: 1, height: 48, backgroundColor: '#F8FAFC', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  weekTxt: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  priceCalcBox: { marginTop: 14, padding: 14, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  priceCalcTxt: { fontSize: 14, fontWeight: '700', color: '#166534', textAlign: 'center' }
});