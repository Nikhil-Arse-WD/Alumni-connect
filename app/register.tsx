import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLinking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Alert, Image, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── STRICT ENV CHECK (No hardcoded fallback IP) ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE; 
const MEMBERSHIP_AMOUNT = 1100;
const isWeb = Platform.OS === "web";

// ── THE MISSING FUNCTION HAS BEEN ADDED HERE ──
const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => String(currentYear - i));

const isValidEmail  = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const isValidMobile = (m: string) => /^\d{7,15}$/.test(m.replace(/[\s\-\+]/g, ""));

const PROGRAMME_GROUPS = [
  { group: "Management", items: [{ label: "MBA", value: "MBA" }, { label: "BBA", value: "BBA" }] },
  { group: "Sciences", items: [
      { label: "MCA", value: "MCA" }, { label: "BCA", value: "BCA" },
      { label: "M.Sc", value: "M.Sc" }, { label: "B.Sc (CS)", value: "B.Sc CS" },
      { label: "B.Sc (BI)", value: "B.Sc BI" }, { label: "B.Sc (BT)", value: "B.Sc BT" },
      { label: "B.Sc (MB)", value: "B.Sc MB" },
    ] 
  },
];

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

const PROGRAMME_FLAT = PROGRAMME_GROUPS.flatMap(g => [
  { label: `── ${g.group} ──`, value: `_header_${g.group}`, disabled: true },
  ...g.items,
]);

// ── Shared UI Components ──
function WebDatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input 
      type="date" value={value || ""} onChange={e => onChange((e.target as HTMLInputElement).value)}
      style={{ height: 48, borderRadius: 12, border: "1px solid #E2E8F0", paddingLeft: 12, paddingRight: 12, backgroundColor: "#F8FAFC", fontSize: 14, color: value ? "#111" : "#94A3B8", width: "100%", outline: "none", boxSizing: "border-box", fontFamily: "sans-serif" }} 
    />
  );
}

function WebYearPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select 
      value={value || ""} onChange={e => onChange((e.target as HTMLSelectElement).value)}
      style={{ height: 48, borderRadius: 12, border: "1px solid #E2E8F0", paddingLeft: 12, paddingRight: 12, backgroundColor: "#F8FAFC", fontSize: 14, color: value ? "#111" : "#94A3B8", width: "100%", outline: "none", boxSizing: "border-box", fontFamily: "sans-serif" }}
    >
      <option value="">Select year</option>
      {YEAR_OPTIONS.map(year => <option key={year} value={year}>{year}</option>)}
    </select>
  );
}

function MobileDateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label}>
      <TouchableOpacity style={[styles.dateBtn, !value && styles.dateBtnEmpty]} onPress={() => setShow(true)}>
        <Text style={value ? styles.dateBtnText : styles.dateBtnPlaceholder}>{value || `Select ${label.toLowerCase()}`}</Text>
        <Ionicons name="calendar-outline" size={18} color="#64748B" />
      </TouchableOpacity>
      {show && (
        <DateTimePicker value={new Date()} mode="date" display="default"
          onChange={(e, date) => {
            setShow(false);
            if (date) onChange(date.toISOString().split("T")[0]);
          }} />
      )}
    </Field>
  );
}

function ChipSelect({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void; }) {
  return (
    <View style={styles.chipRow}>
      {options.map(opt => (
        <TouchableOpacity key={opt.value} style={[styles.chip, value === opt.value && styles.chipSel]} onPress={() => onChange(opt.value)}>
          <Text style={[styles.chipText, value === opt.value && styles.chipSelText]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={13} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

function Input({ label, placeholder, value, onChange, keyboardType = "default", secure = false, error }: any) {
  return (
    <Field label={label} error={error}>
      <TextInput placeholder={placeholder} placeholderTextColor="#94A3B8" value={value} onChangeText={onChange} keyboardType={keyboardType} secureTextEntry={secure} style={[styles.input, !!error && styles.inputError]} />
    </Field>
  );
}

function Section({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionRow}>
      <Ionicons name={icon as any} size={18} color="#4F46E5" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function AppPicker({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: { label: string; value: string }[]; }) {
  return (
    <Field label={label}>
      {Platform.OS === "web" ? (
        <select value={value} onChange={e => onChange((e.target as HTMLSelectElement).value)} style={{ height:48, borderRadius:12, border:"1px solid #E2E8F0", paddingLeft:12, paddingRight:12, background:"#F8FAFC", fontSize:14, color:value?"#111":"#94A3B8", width:"100%", outline:"none" }}>
          <option value="">Select {label}</option>
          {items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
        </select>
      ) : (
        <View style={styles.pickerBox}>
          <Picker selectedValue={value} onValueChange={onChange}>
            <Picker.Item label={`Select ${label}`} value="" />
            {items.map(i => <Picker.Item key={i.value} label={i.label} value={i.value} />)}
          </Picker>
        </View>
      )}
    </Field>
  );
}

function ProgrammePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Programme">
      {Platform.OS === "web" ? (
        <select value={value} onChange={e => onChange((e.target as HTMLSelectElement).value)} style={{ height:48, borderRadius:12, border:"1px solid #E2E8F0", paddingLeft:12, paddingRight:12, background:"#F8FAFC", fontSize:14, color:value?"#111":"#94A3B8", width:"100%", outline:"none" }}>
          <option value="">Select Programme</option>
          {PROGRAMME_GROUPS.map(g => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </optgroup>
          ))}
        </select>
      ) : (
        <View style={styles.pickerBox}>
          <Picker selectedValue={value} onValueChange={v => { if (!String(v).startsWith("_header_")) onChange(v); }}>
            <Picker.Item label="Select Programme" value="" />
            {PROGRAMME_FLAT.map(i => <Picker.Item key={i.value} label={i.label} value={i.value} enabled={!(i as any).disabled} color={(i as any).disabled ? "#94A3B8" : "#111"} />)}
          </Picker>
        </View>
      )}
    </Field>
  );
}

function Row2({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={isWeb ? styles.row2Web : styles.row2Mobile}>
      {items.map((child, i) => <View key={i} style={isWeb ? { flex: 1 } : { width: "100%" }}>{child}</View>)}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; mobile?: string }>({});
  
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [industrySelection, setIndustrySelection] = useState("");

  const [form, setForm] = useState({
    full_name: "", email: "", mobile: "", country_code: "+91", gender: "",
    dob: "", batch_year: "", programme: "", employment_type: "", organisation: "", designation: "",
    years_of_experience: "", industry: "", married: "NO", spouse_name: "", anniversary_date: "",
    address: "", city: "", country: "", payment_status: "NO",
  });

  const set = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === "email" || key === "mobile") setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleIndustryDropdownChange = (value: string) => {
    setIndustrySelection(value);
    if (value !== "Other") set("industry", value);
    else set("industry", ""); 
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const validate = (): boolean => {
    const e: { email?: string; mobile?: string } = {};
    if (!form.full_name.trim()) {
      showAlert("Required", "Full Name is required");
      return false;
    }
    if (!form.email.trim()) e.email = "Email is required";
    else if (!isValidEmail(form.email)) e.email = "Enter a valid email (e.g. rahul@gmail.com)";
    
    if (!form.mobile.trim()) e.mobile = "Mobile number is required";
    else if (!isValidMobile(form.mobile)) e.mobile = "Enter valid mobile number length";
    
    if (!form.industry.trim()) {
      showAlert("Required", "Please specify your industry.");
      return false;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── UNIFIED REGISTER & PAY FUNCTION ──
  const handleRegisterAndPay = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "mobile") fd.append("mobile", `${form.country_code} ${form.mobile}`);
        else if (k !== "country_code") fd.append(k, v);
      });

      if (image) {
        if (isWeb) {
          const res = await fetch(image); const blob = await res.blob();
          fd.append("profile_photo", blob, "photo.jpg");
        } else {
          const filename = image.split("/").pop() || "photo.jpg";
          const match = /\.(\w+)$/.exec(filename);
          fd.append("profile_photo", { uri: image, name: filename, type: match ? `image/${match[1]}` : "image/jpeg" } as any);
        }
      }

      await axios.post(`${API_BASE}/register`, fd, { headers: { "Content-Type": "multipart/form-data" } });

      const returnUrl = ExpoLinking.createURL('/loginscreen');
      const rawPhone = `${form.country_code || "91"}${form.mobile || ""}`;
      const safePhone = rawPhone.replace(/\D/g, "").slice(0, 15) || "9999999999";
      const safeName = (form.full_name || "Alumni").trim().replace(/[^a-zA-Z\s]/g, "").slice(0, 50);

      const initRes = await axios.post(`${API_BASE}/pay/initiate`, {
        amount: typeof MEMBERSHIP_AMOUNT === 'number' ? MEMBERSHIP_AMOUNT : 1100, 
        firstname: safeName,
        email: form.email.trim(),
        phone: safePhone, 
        productinfo: "Alumni Registration",
        payment_type: "REG",           
        reference_id: form.email.trim(),
        return_url: returnUrl 
      });

      if (initRes.data && initRes.data.checkout_url) {
        const checkoutUrl = initRes.data.checkout_url;

        if (isWeb) {
          // ── WEB: Open Mini Window Popup ──
          const width = 500; const height = 750;
          const left = (window.innerWidth - width) / 2;
          const top = (window.innerHeight - height) / 2;
          const popup = window.open(checkoutUrl, "Payment", `width=${width},height=${height},left=${left},top=${top}`);

          const handleMessage = (event: any) => {
            if (event.data?.type === 'PAYMENT_RETURN') {
              window.removeEventListener('message', handleMessage);
              setIsSubmitting(false);
              
              if (event.data.status === 'success') {
                showAlert("Registration Successful! 🎉", "Your payment is complete. Please check your email for your temporary login credentials.");
                router.push("/loginscreen");
              } else {
                showAlert("Payment Failed", "The transaction was cancelled or failed. Please click 'Register & Pay Securely' to retry.");
              }
            }
          };
          window.addEventListener('message', handleMessage);

          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              setIsSubmitting(false);
              window.removeEventListener('message', handleMessage);
            }
          }, 1000);

        } else {
          // ── MOBILE: In-App Browser ──
          const browserResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
          setIsSubmitting(false);

          if (browserResult.type === 'success' && browserResult.url) {
            const parsed = ExpoLinking.parse(browserResult.url);
            if (parsed.queryParams?.status === 'success') {
              showAlert("Registration Successful! 🎉", "Your payment is complete. Please check your email for your temporary login credentials.");
              router.push("/loginscreen");
            } else {
              showAlert("Payment Failed", "The transaction was cancelled or failed. Please tap 'Register & Pay' to retry.");
            }
          } else {
            showAlert("Payment Cancelled", "You closed the gateway before completing the payment.");
          }
        }
      }
    } catch (err: any) {
      // ── SAFE CATCH BLOCK ──
      setIsSubmitting(false);
      const errMsg = err?.response?.data?.message || err?.message || "Registration or Payment Gateway error.";
      showAlert("Error", errMsg);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hero}>
          <Text style={styles.heroTitle}>Alumni Registration</Text>
          <Text style={styles.heroSub}>SVIMAA · Complete your profile</Text>
        </LinearGradient>

        <View style={styles.content}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera-outline" size={30} color="#4F46E5" />
                <Text style={styles.avatarText}>Upload photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <Section title="Personal Information" icon="person-outline" />
          <View style={styles.card}>
            <Row2>
              <Input label="Full Name *" placeholder="Rahul Sharma" value={form.full_name} onChange={(t: string) => set("full_name", t)} />
              <Input label="Email *" placeholder="rahul@gmail.com" value={form.email} onChange={(t: string) => set("email", t)} error={errors.email} />
            </Row2>
            
            <Row2>
              <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
                <View style={{ width: 75 }}>
                  <Input label="Code" value={form.country_code} onChange={(t: string) => set("country_code", t)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Mobile *" placeholder="98765 43210" value={form.mobile} onChange={(t: string) => set("mobile", t)} keyboardType="phone-pad" error={errors.mobile} />
                </View>
              </View>
              <AppPicker label="Gender" value={form.gender} onChange={v => set("gender", v)}
                items={[{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }]} />
            </Row2>

            <Row2>
             {isWeb ? (
                <Field label="Date of Birth">
                 <WebDatePicker value={form.dob} onChange={v => set("dob", v)} />
                </Field>
                 ) : (
                       <MobileDateField label="Date of Birth" value={form.dob} onChange={v => set("dob", v)} />
                   )}
              {isWeb ? (
                <Field label="Batch Year">
                  <WebYearPicker value={form.batch_year} onChange={v => set("batch_year", v)} />
                </Field>
              ) : (
                <Field label="Batch Year">
                  <TouchableOpacity style={[styles.input, { justifyContent: "center" }]} activeOpacity={0.7} onPress={() => setShowYearPicker(true)}>
                    <Text style={{ color: form.batch_year ? "#111" : "#94A3B8", fontSize: 14 }}>{form.batch_year ? form.batch_year : "Select year"}</Text>
                  </TouchableOpacity>
                </Field>
              )}
            </Row2>
            
            <ProgrammePicker value={form.programme} onChange={v => set("programme", v)} />
          </View>

          <Section title="Work Information" icon="briefcase-outline" />
          <View style={styles.card}>
            <Row2>
              <AppPicker label="Employment Type" value={form.employment_type} onChange={v => set("employment_type", v)} items={[{ label: "Private", value: "Private" }, { label: "Government", value: "Government" }, { label: "Business", value: "Business" }, { label: "Student", value: "Student" }]} />
              <Input label="Organisation" placeholder="Infosys Ltd." value={form.organisation} onChange={(t: string) => set("organisation", t)} />
            </Row2>
            <Row2>
              <Input label="Designation" placeholder="Senior Developer" value={form.designation} onChange={(t: string) => set("designation", t)} />
              <AppPicker label="Experience" value={form.years_of_experience} onChange={v => set("years_of_experience", v)} items={[{ label: "0–1 year", value: "1" }, { label: "1–3 years", value: "3" }, { label: "3–5 years", value: "5" }, { label: "5+ years", value: "10" }]} />
            </Row2>
            <Row2>
              <AppPicker label="Industry *" value={industrySelection} onChange={handleIndustryDropdownChange} items={[...INDUSTRY_OPTIONS, { label: "Other / Specify Custom...", value: "Other" }]} />
              {industrySelection === "Other" && <Input label="Specify Custom Industry *" placeholder="e.g. Aerospace, Renewable Energy" value={form.industry} onChange={(t: string) => set("industry", t)} />}
            </Row2>
          </View>

          <Section title="Personal Details" icon="heart-outline" />
          <View style={styles.card}>
            <Row2>
              <Field label="Marital Status">
                <ChipSelect options={[{ label: "Single", value: "NO" }, { label: "Married", value: "YES" }]} value={form.married} onChange={v => set("married", v)} />
              </Field>
              {form.married === "YES" && <Input label="Spouse Name" placeholder="Name" value={form.spouse_name} onChange={(t: string) => set("spouse_name", t)} />}
            </Row2>
            {form.married === "YES" && (
              <Row2>
                {isWeb ? <WebDatePicker value={form.anniversary_date} onChange={v => set("anniversary_date", v)} /> : <MobileDateField label="Anniversary" value={form.anniversary_date} onChange={v => set("anniversary_date", v)} />}
              </Row2>
            )}
          </View>

          <Section title="Address" icon="location-outline" />
          <View style={styles.card}>
            <Input label="Street Address" placeholder="123, MG Road" value={form.address} onChange={(t: string) => set("address", t)} />
            <Row2>
              <Input label="City" placeholder="Indore" value={form.city} onChange={(t: string) => set("city", t)} />
              <Input label="Country" placeholder="India" value={form.country} onChange={(t: string) => set("country", t)} />
            </Row2>
          </View>

          <View style={{ marginTop: 20 }}>
            <View style={styles.payInfoRow}>
              <Ionicons name="information-circle-outline" size={16} color="#5B21B6" />
              <Text style={styles.payInfoText}>
                One-time Membership Fee: <Text style={{ fontWeight: "800" }}>₹{MEMBERSHIP_AMOUNT}</Text>
              </Text>
            </View>

            <TouchableOpacity style={[styles.payBtn, isSubmitting && styles.payBtnDisabled]} onPress={handleRegisterAndPay} disabled={isSubmitting} activeOpacity={0.85}>
              <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtnGradient}>
                {isSubmitting ? (
                  <Text style={styles.payBtnText}>Processing...</Text>
                ) : (
                  <>
                    <Ionicons name="card-outline" size={22} color="#fff" />
                    <Text style={styles.payBtnText}>Register & Pay Securely</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>

      {!isWeb && (
        <Modal visible={showYearPicker} transparent animationType="slide" onRequestClose={() => setShowYearPicker(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "50%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A" }}>Select Batch Year</Text>
                <TouchableOpacity onPress={() => setShowYearPicker(false)}><Text style={{ fontSize: 14, fontWeight: "700", color: "#DC2626" }}>Cancel</Text></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {YEAR_OPTIONS.map((year) => (
                  <TouchableOpacity key={year} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", alignItems: "center", backgroundColor: form.batch_year === year ? "#EEF2FF" : "#fff" }} onPress={() => { setForm({ ...form, batch_year: year }); setShowYearPicker(false); }}>
                    <Text style={{ fontSize: 16, fontWeight: form.batch_year === year ? "800" : "500", color: form.batch_year === year ? "#4F46E5" : "#334155" }}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 30, paddingTop: 40, paddingBottom: 36, alignItems: "center" },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "800", textAlign: "center" },
  heroSub: { color: "#cbd5e1", fontSize: 18, marginTop: 6, textAlign: "center" },
  content: { padding: isWeb ? 24 : 16, maxWidth: isWeb ? 850 : undefined, alignSelf: "center", width: "100%" },
  avatarWrap: { alignItems: "center", marginVertical: 20 },
  avatar: { width: 130, height: 130, borderRadius: 90, borderWidth: 3, borderColor: "#4F46E5" },
  avatarPlaceholder: { width: 130, height: 130, borderRadius: 90, backgroundColor: "#EEF2FF", borderWidth: 2, borderColor: "#4F46E5", borderStyle: "dashed", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 11, color: "#4F46E5", fontWeight: "600", marginTop: 4 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 4, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  row2Web: { flexDirection: "row", gap: 12 },
  row2Mobile: { flexDirection: "column", gap: 0 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  errorText: { fontSize: 11, color: "#DC2626", flex: 1 },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, color: "#111" },
  inputError: { borderColor: "#DC2626", backgroundColor: "#FFF5F5" },
  pickerBox: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, overflow: "hidden" },
  dateBtn: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 14, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateBtnEmpty: {},
  dateBtnText: { fontSize: 14, color: "#111" },
  dateBtnPlaceholder:{ fontSize: 14, color: "#94A3B8" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
  chipSel: { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipSelText: { color: "#4F46E5" },
  payInfoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#EEF2FF", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  payInfoText: { color: "#3730A3", fontSize: 14 },
  payBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  payBtnDisabled: { opacity: 0.7 },
  payBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  payBtnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  errorContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 32, textAlign: "center" as any },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20, maxWidth: 420 },
});