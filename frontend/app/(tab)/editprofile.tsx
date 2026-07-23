import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
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
  View,
} from "react-native";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const isWeb = Platform.OS === "web";

// Inject a global web override style to force the native date picker icon to float right
if (isWeb && typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    /* Reset default webkit picker structure alignment */
    input[type="date"] {
      position: relative;
    }
    
    /* Make the calendar indicator fill the right side and look clickable */
    input[type="date"]::-webkit-calendar-picker-indicator {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      margin: 0;
      padding: 0;
    }
  `;
  document.head.appendChild(style);
}

const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

const isValidMobile = (m: string) => /^\d{7,15}$/.test(m.replace(/[\s\-\+]/g, ""));

// Helper function to format ISO dates cleanly into DD/MM/YYYY for presentation display fields
const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const parts = cleanDate.split("-");
    
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// ── Move Styles definition higher up to avoid compilation reference clashes ──
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { flexGrow: 1 }, 
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderTxt:  { marginTop: 14, color: "#64748B", fontSize: 15, fontWeight: "500" },
  header: { paddingHorizontal: 24, paddingBottom: 36, overflow: "hidden" },
  dec1: { position: "absolute", right: -60, top: -40, width: 220, height: 220, borderRadius: 110, borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" },
  dec2: { position: "absolute", right: 40, top: 50, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)" },
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerSub:   { fontSize: 13.5, color: "rgba(255,255,255,0.8)", marginTop: 4, fontWeight: "500" },
  avatarCenter: { alignItems: "center", paddingBottom: 4 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: "#fff" },
  avatarFallback: { width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 3, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  avatarInitials: { fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: 1 },
  cameraBadge: { position: "absolute", bottom: 6, right: 6, width: 42, height: 42, borderRadius: 21, backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 5, elevation: 4 },
  avatarName:  { fontSize: 22, fontWeight: "900", color: "#fff", textAlign: "center", letterSpacing: -0.5 },
  avatarEmail: { fontSize: 13.5, color: "rgba(255,255,255,0.8)", marginTop: 4, marginBottom: 16, textAlign: "center", fontWeight: "500" },
  changePhotoBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24 },
  changePhotoTxt: { color: "#fff", fontSize: 13, fontWeight: "700" },
  content: { padding: isWeb ? 32 : 16, maxWidth: isWeb ? 850 : undefined, alignSelf: "center", width: "100%", marginTop: -20 },
  secHead: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24, marginBottom: 12, paddingBottom: 8 },
  secIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF2FF", justifyContent: "center", alignItems: "center" },
  secTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 8, shadowColor: "#0F172A", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2, borderWidth: 1, borderColor: "#F1F5F9" },
  rowWeb: { flexDirection: "row", gap: 16 },
  rowMob: { flexDirection: "column", gap: 0 },
  fieldBox: { marginBottom: 16 },
  label: { fontSize: 13.5, fontWeight: "700", color: "#334155" }, 
  errorTxt: { color: "#DC2626", fontSize: 12, fontWeight: "500", marginTop: 6 },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 16, height: 50, fontSize: 14, color: "#0F172A" },
  inputLocked: { backgroundColor: "#F1F5F9", borderColor: "#F1F5F9", color: "#94A3B8" },
  inputError: { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2" },
  pickerBox: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, overflow: "hidden" },
  chipRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  chip:    { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
  chipOn:  { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  chipTxt:   { fontSize: 13.5, fontWeight: "600", color: "#64748B" },
  chipTxtOn: { color: "#4F46E5", fontWeight: "700" },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 32 },
  saveBtn: { flex: 2, borderRadius: 16, overflow: "hidden", shadowColor: "#4F46E5", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  saveBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  saveTxt: { color: "#fff", fontWeight: "800", fontSize: 15.5 },
  cancelBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16, borderWidth: 1.5, borderColor: "#E2E8F0" },
  cancelTxt: { color: "#475569", fontWeight: "700", fontSize: 15 },
  datePickerTriggerButton: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 16, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  datePickerText: { fontSize: 14, color: "#0F172A", fontWeight: "500" },
  errorContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 32, textAlign: "center" as any },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20, maxWidth: 420 },
});

const INDUSTRY_OPTIONS = [
  { label: "Information Technology & Services", value: "Information Technology" },
  { label: "Finance, Banking & Insurance", value: "Finance & Banking" },
  { label: "Healthcare & Pharmaceuticals", value: "Healthcare & Pharmaceuticals" },
  { label: "Education & E-Learning", value: "Education" },
  { label: "Manufacturing & Engineering", value: "Manufacturing & Engineering" },
  { label: "Real Estate & Construction", value: "Real Estate & Construction" },
  { label: "Agriculture & Food Production", value: "Agriculture & Food Production" },
  { label: "Retail & E-Commerce", value: "Retail & E-Commerce" },
  { label: "Transportation & Logistics", value: "Transportation & Logistics" },
  { label: "Energy & Utilities", value: "Energy & Utilities" },
  { label: "Media, Entertainment & Tourism", value: "Media & Entertainment" },
  { label: "Government & Public Administration", value: "Government" },
  { label: "Legal & Professional Services", value: "Legal & Professional" },
];

// ── Reusable sub-view child modules ───────────────────────────────────────────
function TInput({ value, onChange, placeholder, keyboardType = "default", multiline = false, editable = true, error }: any) {
  return (
    <TextInput
      style={[
        styles.input,
        multiline && { height: 100, textAlignVertical: "top", paddingTop: 14 },
        !editable && styles.inputLocked,
        !!error && styles.inputError
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboardType}
      multiline={multiline}
      editable={editable}
      selectTextOnFocus={editable}
    />
  );
}

function DropPicker({ value, onChange, items, placeholder = "Select..." }: {
  value: string; onChange: (v: string) => void;
  items: { label: string; value: string }[];
  placeholder?: string;
}) {
  if (isWeb) {
    return (
      <select
        value={value}
        onChange={e => onChange((e.target as HTMLSelectElement).value)}
        style={{
          height: 50, borderRadius: 14, border: "1.5px solid #E2E8F0",
          paddingLeft: 16, paddingRight: 16, background: "#F8FAFC",
          fontSize: 14, color: value ? "#0F172A" : "#94A3B8",
          width: "100%", outline: "none", cursor: "pointer",
        }}
      >
        <option value="">{placeholder}</option>
        {items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
      </select>
    );
  }
  return (
    <View style={styles.pickerBox}>
      <Picker selectedValue={value} onValueChange={onChange}>
        <Picker.Item label={placeholder} value="" />
        {items.map(i => <Picker.Item key={i.value} label={i.label} value={i.value} />)}
      </Picker>
    </View>
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

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function FieldBox({ label, locked, error, children }: { label: string; locked?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldBox}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Text style={styles.label}>{label}</Text>
        {locked && <Ionicons name="lock-closed" size={12} color="#94A3B8" />}
      </View>
      {children}
      {!!error && <Text style={styles.errorTxt}>{error}</Text>}
    </View>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={isWeb ? styles.rowWeb : styles.rowMob}>
      {items.map((child, i) => (
        <View key={i} style={isWeb ? { flex: 1 } : { width: "100%" }}>{child}</View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setUser } = useUser();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [image,    setImage]    = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const [errors, setErrors]     = useState<{ [key: string]: string }>({});
  const [industrySelection, setIndustrySelection] = useState("");

  const [form, setForm] = useState({
    full_name:           "",
    mobile:              "",
    employment_type:     "",
    organisation:        "",
    designation:         "",
    years_of_experience: "",
    industry:            "",
    married:             "NO",
    spouse_name:         "",
    anniversary_date:    "",
    address:             "",
    city:                "",
    country:             "",
  });

  const set = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: "" }));
  };

  const handleIndustryDropdownChange = (value: string) => {
    setIndustrySelection(value);
    if (value !== "Other") {
      set("industry", value);
    } else {
      set("industry", ""); 
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/member/${email}`);
      const u   = res.data.data;
      if (u.profile_photo) {
        setPhotoUrl(u.profile_photo.startsWith("http") ? u.profile_photo : `${API_BASE}/uploads/${u.profile_photo}`);
      }

      const fetchedIndustry = u.industry || "";
      const isStandardIndustry = INDUSTRY_OPTIONS.some(opt => opt.value === fetchedIndustry);
      setIndustrySelection(isStandardIndustry || !fetchedIndustry ? fetchedIndustry : "Other");

      // ── FIX: Parse the ISO date string locally to respect IST timezone before converting to YYYY-MM-DD ──
      let localAnniversaryDate = "";
      if (u.anniversary_date) {
        const d = new Date(u.anniversary_date);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          localAnniversaryDate = `${yyyy}-${mm}-${dd}`;
        }
      }

      setForm({
        full_name:           u.full_name           || "",
        mobile:              u.mobile              || "",
        employment_type:     u.employment_type     || "",
        organisation:        u.organisation        || "",
        designation:         u.designation         || "",
        years_of_experience: String(u.years_of_experience || ""),
        industry:            fetchedIndustry,
        married:             u.married             || "NO",
        spouse_name:         u.spouse_name         || "",
        anniversary_date:    localAnniversaryDate,
        address:             u.address             || "",
        city:                u.city                || "",
        country:             u.country             || "",
      });
      return u;
    } catch {
      showAlert("Error", "Failed to load profile data.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (email) fetchUser(); }, [email]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, 
      quality: 0.85, 
      aspect: [1, 1],
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const syncAsyncStorageUser = async (updatedUser: any) => {
    try {
      const stored = await AsyncStorage.getItem("user");
      const parsed = stored ? JSON.parse(stored) : {};
      const merged = { ...parsed, ...updatedUser, photo_updated_at: Date.now() };
      await AsyncStorage.setItem("user", JSON.stringify(merged));
      setUser(merged);
    } catch {}
  };

  const validateForm = () => {
    let valid = true;
    let newErrors: { [key: string]: string } = {};

    if (form.mobile && !isValidMobile(form.mobile)) {
      newErrors.mobile = "Please enter a valid mobile number.";
      valid = false;
    }

    if (form.married === "YES" && !form.spouse_name.trim()) {
      newErrors.spouse_name = "Spouse name is required if married.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) {
      showAlert("Validation Error", "Please check the highlighted fields to ensure your data is correct.");
    }
    return valid;
  };

  const handleSave = async () => {
    if (!validateForm()) return; 

    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));

      if (image) {
        if (isWeb) {
          const res  = await fetch(image);
          const blob = await res.blob();
          fd.append("profile_photo", blob, "photo.jpg");
        } else {
          const filename = image.split("/").pop() || "photo.jpg";
          const match    = /\.(\w+)$/.exec(filename);
          fd.append("profile_photo", {
            uri: image, name: filename,
            type: match ? `image/${match[1]}` : "image/jpeg",
          } as any);
        }
      }

      await axios.put(`${API_BASE}/member/update/${email}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = await fetchUser();
      if (updatedUser) await syncAsyncStorageUser(updatedUser);

      if (isWeb) {
        window.alert("Profile updated successfully ✅");
        router.back();
      } else {
        Alert.alert("Success ✅", "Profile updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch {
      showAlert("Error", "Update failed. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const showMobileDatePicker = async () => {
    if (isWeb) return;
    try {
      const DateTimePickerAndroid = require("@react-native-community/datetimepicker").DateTimePickerAndroid;
      
      // ── FIX: Safely parse YYYY-MM-DD manually to avoid standard JS Date offsetting it back 1 day in the mobile picker
      let currentDate = new Date();
      if (form.anniversary_date) {
        const parts = form.anniversary_date.split("-");
        if (parts.length === 3) {
          currentDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
      }
      
      DateTimePickerAndroid.open({
        value: currentDate,
        onChange: (event: any, selectedDate?: Date) => {
          if (event.type === "set" && selectedDate) {
            const yyyy = selectedDate.getFullYear();
            const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
            const dd = String(selectedDate.getDate()).padStart(2, "0");
            set("anniversary_date", `${yyyy}-${mm}-${dd}`);
          }
        },
        mode: "date",
        display: "default",
      });
    } catch {
      showAlert("Notice", "Please type your anniversary date in YYYY-MM-DD format inside the field.");
    }
  };

  if (!API_BASE) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={54} color="#EF4444" />
        <Text style={styles.errorTitle}>Configuration Mismatch</Text>
        <Text style={styles.errorSub}>The backend endpoint variable is undefined. Please ensure EXPO_PUBLIC_API_BASE is properly mapped inside your root environment configuration file.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loaderTxt}>Loading profile...</Text>
      </View>
    );
  }

  const displayPhoto = image || photoUrl;
  const initials     = form.full_name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContainer, { paddingBottom: isWeb ? 40 : 140 }]}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.header, { paddingTop: isWeb ? 20 : 42 }]}
          >
            <View style={styles.dec1} />
            <View style={styles.dec2} />

            <View style={styles.headerTopRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <Text style={styles.headerSub}>Update your personal and professional info</Text>
              </View>
            </View>

            <View style={styles.avatarCenter}>
              <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto} activeOpacity={0.85}>
                {displayPhoto ? (
                  <Image source={{ uri: displayPhoto }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>

              <Text style={styles.avatarName}>{form.full_name || "Your Name"}</Text>
              <Text style={styles.avatarEmail}>{email}</Text>

              <TouchableOpacity style={styles.changePhotoBtn} onPress={pickPhoto} activeOpacity={0.8}>
                <Ionicons name="image-outline" size={14} color="#fff" />
                <Text style={styles.changePhotoTxt}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            {/* Personal */}
            <SectionHead icon="person-outline" title="Personal Identity" />
            <Card>
              <Row2>
                <FieldBox label="Full Name" locked={true}>
                  <TInput value={form.full_name} editable={false} placeholder="Name" />
                </FieldBox>
                <FieldBox label="Account Email" locked={true}>
                  <TInput value={email} editable={false} placeholder="Email" />
                </FieldBox>
              </Row2>
              <FieldBox label="Mobile Number" error={errors.mobile}>
                <TInput value={form.mobile} onChange={(t: string) => set("mobile", t)} placeholder="98765 43210" keyboardType="phone-pad" error={errors.mobile} />
              </FieldBox>
            </Card>

            {/* Work */}
            <SectionHead icon="briefcase-outline" title="Professional Details" />
            <Card>
              <Row2>
                <FieldBox label="Employment Type">
                  <DropPicker
                    value={form.employment_type}
                    onChange={v => set("employment_type", v)}
                    placeholder="Select type"
                    items={[
                      { label: "Private",     value: "Private"    },
                      { label: "Government", value: "Government" },
                      { label: "Business",   value: "Business"   },
                      { label: "Student",    value: "Student"    },
                    ]}
                  />
                </FieldBox>
                <FieldBox label="Organisation">
                  <TInput value={form.organisation} onChange={(t: string) => set("organisation", t)} placeholder="e.g. Infosys Ltd." />
                </FieldBox>
              </Row2>
              <Row2>
                <FieldBox label="Designation">
                  <TInput value={form.designation} onChange={(t: string) => set("designation", t)} placeholder="e.g. Senior Developer" />
                </FieldBox>
                <FieldBox label="Years of Experience">
                  <DropPicker
                    value={form.years_of_experience}
                    onChange={v => set("years_of_experience", v)}
                    placeholder="Select experience"
                    items={[
                      { label: "0–1 year",  value: "1"  },
                      { label: "1–3 years", value: "3"  },
                      { label: "3–5 years", value: "5"  },
                      { label: "5+ years",  value: "10" },
                    ]}
                  />
                </FieldBox>
              </Row2>
              <Row2>
                <FieldBox label="Industry">
                  <DropPicker
                    value={industrySelection}
                    onChange={handleIndustryDropdownChange}
                    placeholder="Select Industry"
                    items={[...INDUSTRY_OPTIONS, { label: "Other / Specify Custom...", value: "Other" }]}
                  />
                </FieldBox>
                {industrySelection === "Other" && (
                  <FieldBox label="Specify Custom Industry">
                    <TInput value={form.industry} onChange={(t: string) => set("industry", t)} placeholder="e.g. Aerospace..." />
                  </FieldBox>
                )}
              </Row2>
            </Card>

            {/* Personal Details */}
            <SectionHead icon="heart-outline" title="Family & Relationships" />
            <Card>
              <FieldBox label="Marital Status">
                <ChipGroup
                  options={[{ label: "Single", value: "NO" }, { label: "Married", value: "YES" }]}
                  value={form.married}
                  onChange={v => {
                    setForm(p => ({
                      ...p,
                      married: v,
                      spouse_name: v === "NO" ? "" : p.spouse_name,
                      anniversary_date: v === "NO" ? "" : p.anniversary_date
                    }));
                    setErrors(p => ({ ...p, married: "", spouse_name: "" }));
                  }}
                />
              </FieldBox>
              
              {form.married === "YES" && (
                <Row2>
                  <FieldBox label="Spouse Name" error={errors.spouse_name}>
                    <TInput value={form.spouse_name} onChange={(t: string) => set("spouse_name", t)} placeholder="Spouse full name" error={errors.spouse_name} />
                  </FieldBox>
                  
                  <FieldBox label="Anniversary Date">
                    {isWeb ? (
                      <input
                        type="date"
                        value={form.anniversary_date || ""}
                        onChange={e => set("anniversary_date", e.target.value)}
                        style={{
                          height: 50, borderRadius: 14, border: "1.5px solid #E2E8F0",
                          paddingLeft: 16, paddingRight: 48, background: "#F8FAFC",
                          fontSize: 14, color: "#0F172A", width: "100%", outline: "none",
                          boxSizing: "border-box", fontFamily: "inherit", display: "flex",
                          alignItems: "center",
                        }}
                      />
                    ) : (
                      <TouchableOpacity onPress={showMobileDatePicker} activeOpacity={0.7} style={styles.datePickerTriggerButton}>
                        <Text style={[styles.datePickerText, !form.anniversary_date && { color: "#94A3B8" }]}>
                          {form.anniversary_date ? formatDisplayDate(form.anniversary_date) : "Select Anniversary Date (DD/MM/YYYY)"}
                        </Text>
                        <Ionicons name="calendar-outline" size={18} color="#4F46E5" />
                      </TouchableOpacity>
                    )}
                  </FieldBox>
                </Row2>
              )}
            </Card>

            {/* Address */}
            <SectionHead icon="location-outline" title="Location" />
            <Card>
              <FieldBox label="Street Address">
                <TInput value={form.address} onChange={(t: string) => set("address", t)} placeholder="123, MG Road, Indore" multiline />
              </FieldBox>
              <Row2>
                <FieldBox label="City">
                  <TInput value={form.city} onChange={(t: string) => set("city", t)} placeholder="Indore" />
                </FieldBox>
                <FieldBox label="Country">
                  <TInput value={form.country} onChange={(t: string) => set("country", t)} placeholder="India" />
                </FieldBox>
              </Row2>
            </Card>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.72 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.saveBtnInner}
                >
                  <Ionicons name={saving ? "hourglass-outline" : "checkmark-circle"} size={18} color="#fff" />
                  <Text style={styles.saveTxt}>{saving ? "Saving Changes..." : "Save Changes"}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}