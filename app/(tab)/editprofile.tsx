import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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

const API_URL  = "http://10.254.25.118:2000/member";
const BASE_URL = "http://10.254.25.118:2000";
const isWeb    = Platform.OS === "web";

const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

// ── Reusable components ───────────────────────────────────────────
function TInput({ value, onChange, placeholder, keyboardType = "default", multiline = false }: any) {
  return (
    <TextInput
      style={[styles.input, multiline && { height: 90, textAlignVertical: "top", paddingTop: 12 }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboardType}
      multiline={multiline}
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
          height: 48, borderRadius: 12, border: "1.5px solid #E2E8F0",
          paddingLeft: 14, paddingRight: 14, background: "#F8FAFC",
          fontSize: 14, color: value ? "#111" : "#94A3B8",
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

function FieldBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldBox}>
      <Text style={styles.label}>{label}</Text>
      {children}
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

// ─────────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [image,    setImage]    = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

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

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // ── Fetches latest user data from server. Returns the raw user object
  //    so callers (e.g. handleSave) can sync it into AsyncStorage too.
  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/${email}`);
      const u   = res.data.data;
      if (u.profile_photo) setPhotoUrl(`${BASE_URL}/uploads/${u.profile_photo}`);
      setForm({
        full_name:           u.full_name           || "",
        mobile:              u.mobile              || "",
        employment_type:     u.employment_type     || "",
        organisation:        u.organisation        || "",
        designation:         u.designation         || "",
        years_of_experience: String(u.years_of_experience || ""),
        industry:            u.industry            || "",
        married:             u.married             || "NO",
        spouse_name:         u.spouse_name         || "",
        anniversary_date:    u.anniversary_date    || "",
        address:             u.address             || "",
        city:                u.city                || "",
        country:             u.country             || "",
      });
      return u;
    } catch {
      showAlert("Error", "Failed to load profile");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (email) fetchUser(); }, [email]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, quality: 0.85, aspect: [1, 1],
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // ── Sync the freshly fetched user object into AsyncStorage so
  //    Header.tsx (and any other screen reading "user" from storage)
  //    picks up the new profile photo / details immediately,
  //    without requiring a logout + login.
  const syncAsyncStorageUser = async (updatedUser: any) => {
    try {
      const stored = await AsyncStorage.getItem("user");
      const parsed = stored ? JSON.parse(stored) : {};
      const merged = {
        ...parsed,
        ...updatedUser,
        // Bump this every save so Header's cache-busting query param
        // changes even when the uploaded filename stays the same.
        photo_updated_at: Date.now(),
      };
      await AsyncStorage.setItem("user", JSON.stringify(merged));
    } catch {}
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { showAlert("Required", "Full Name is required"); return; }
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

      await axios.put(`${API_URL}/update/${email}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ FIX: refetch latest data, sync into AsyncStorage, then go back
      const updatedUser = await fetchUser();
      if (updatedUser) await syncAsyncStorageUser(updatedUser);

      if (isWeb) {
        window.alert("Success ✅\nProfile updated successfully");
        router.back();
      } else {
        Alert.alert("Success ✅", "Profile updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch {
      showAlert("Error", "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loaderTxt}>Loading profile...</Text>
      </View>
    );
  }

  const displayPhoto = image || photoUrl;
  const initials     = form.full_name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

        {/* ══ HEADER ══ */}
        <LinearGradient
          colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          {/* Decorative circles */}
          <View style={styles.dec1} />
          <View style={styles.dec2} />

          {/* Back + Title row */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <Text style={styles.headerSub}>Update your information</Text>
            </View>
          </View>

          {/* ── Avatar — centered ── */}
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
              <Ionicons name="image-outline" size={13} color="#fff" />
              <Text style={styles.changePhotoTxt}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ══ FORM ══ */}
        <View style={styles.content}>

          {/* Personal */}
          <SectionHead icon="person-outline" title="Personal Information" />
          <Card>
            <Row2>
              <FieldBox label="Full Name *">
                <TInput value={form.full_name} onChange={(t: string) => set("full_name", t)} placeholder="Rahul Sharma" />
              </FieldBox>
              <FieldBox label="Mobile Number">
                <TInput value={form.mobile} onChange={(t: string) => set("mobile", t)} placeholder="98765 43210" keyboardType="phone-pad" />
              </FieldBox>
            </Row2>
          </Card>

          {/* Work */}
          <SectionHead icon="briefcase-outline" title="Work Information" />
          <Card>
            <Row2>
              <FieldBox label="Employment Type">
                <DropPicker
                  value={form.employment_type}
                  onChange={v => set("employment_type", v)}
                  placeholder="Select type"
                  items={[
                    { label: "Private",    value: "Private"    },
                    { label: "Government", value: "Government" },
                    { label: "Business",   value: "Business"   },
                    { label: "Student",    value: "Student"    },
                  ]}
                />
              </FieldBox>
              <FieldBox label="Organisation">
                <TInput value={form.organisation} onChange={(t: string) => set("organisation", t)} placeholder="Infosys Ltd." />
              </FieldBox>
            </Row2>
            <Row2>
              <FieldBox label="Designation">
                <TInput value={form.designation} onChange={(t: string) => set("designation", t)} placeholder="Senior Developer" />
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
            <FieldBox label="Industry">
              <TInput value={form.industry} onChange={(t: string) => set("industry", t)} placeholder="Information Technology" />
            </FieldBox>
          </Card>

          {/* Personal Details */}
          <SectionHead icon="heart-outline" title="Personal Details" />
          <Card>
            <FieldBox label="Marital Status">
              <ChipGroup
                options={[{ label: "Single", value: "NO" }, { label: "Married", value: "YES" }]}
                value={form.married}
                onChange={v => set("married", v)}
              />
            </FieldBox>
            {form.married === "YES" && (
              <Row2>
                <FieldBox label="Spouse Name">
                  <TInput value={form.spouse_name} onChange={(t: string) => set("spouse_name", t)} placeholder="Spouse full name" />
                </FieldBox>
                <FieldBox label="Anniversary Date">
                  <TInput value={form.anniversary_date} onChange={(t: string) => set("anniversary_date", t)} placeholder="YYYY-MM-DD" />
                </FieldBox>
              </Row2>
            )}
          </Card>

          {/* Address */}
          <SectionHead icon="location-outline" title="Address" />
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

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.72 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.saveBtnInner}
              >
                <Ionicons name={saving ? "hourglass-outline" : "checkmark-circle-outline"} size={18} color="#fff" />
                <Text style={styles.saveTxt}>{saving ? "Saving..." : "Save Changes"}</Text>
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
    paddingBottom: 30,
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

  // back + title — horizontal row
  headerTopRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, marginBottom: 24,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 },

  // ── avatar CENTERED ──
  avatarCenter: {
    alignItems: "center",   // ← centered
    paddingBottom: 4,
  },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 136, height: 136, borderRadius: 100,
    borderWidth: 3, borderColor: "#fff",
  },
  avatarFallback: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 3, borderColor: "#fff",
    justifyContent: "center", alignItems: "center",
  },
  avatarInitials: { fontSize: 32, fontWeight: "900", color: "#fff" },
  cameraBadge: {
    position: "absolute", bottom: 4, right: 5,
    width: 38, height: 38, borderRadius: 54,
    backgroundColor: "#4F46E5",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2.5, borderColor: "#fff",
  },
  avatarName:  { fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center" },
  avatarEmail: { fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 3, marginBottom: 12, textAlign: "center" },
  changePhotoBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20,
  },
  changePhotoTxt: { color: "#fff", fontSize: 12, fontWeight: "600" },

  content: {
    padding: isWeb ? 28 : 16,
    maxWidth: isWeb ? 1400 : undefined,
    alignSelf: "center",
    width: "100%",
    marginBottom: Platform.OS === "web" ? 0 : 50 
  },

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

  input: {
    backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0",
    borderRadius: 12, paddingHorizontal: 14, height: 48,
    fontSize: 14, color: "#111",
  },
  pickerBox: {
    backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0",
    borderRadius: 12, overflow: "hidden",
  },

  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip:    { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
  chipOn:  { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  chipTxt:   { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipTxtOn: { color: "#4F46E5" },

  btnRow: { flexDirection: "row", gap: 12, marginTop: 28 },
  saveBtn: { flex: 2, borderRadius: 16, overflow: "hidden" },
  saveBtnInner: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, paddingVertical: 15,
  },
  saveTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cancelBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    backgroundColor: "#000", borderRadius: 16,
    paddingVertical: 15, borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  cancelTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});