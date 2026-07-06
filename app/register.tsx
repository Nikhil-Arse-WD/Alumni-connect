import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert, Image, Linking, Platform, ScrollView,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

let RazorpayCheckout: any = null;
if (Platform.OS !== "web") {
  try {
    const mod = require("react-native-razorpay");
    RazorpayCheckout = mod?.default ?? mod;
    if (typeof RazorpayCheckout?.open !== "function") RazorpayCheckout = null;
  } catch (e) {
    console.log("react-native-razorpay not available:", e);
  }
}

const API_URL           = "http://10.232.80.175:2000/register";
const RAZORPAY_KEY      = "rzp_test_SyMiNHvIPkKFhI";
const MEMBERSHIP_AMOUNT = 11000;
const isWeb             = Platform.OS === "web";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const isValidEmail  = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const isValidMobile = (m: string) => /^[6-9]\d{9}$/.test(m.replace(/[\s\-\+]/g, ""));

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise(resolve => {
    if ((window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// ── Programme options — grouped ───────────────────────────────────────────────
const PROGRAMME_GROUPS = [
  {
    group: "Management",
    items: [
      { label: "MBA", value: "MBA" },
      { label: "BBA", value: "BBA" },
    ],
  },
  {
    group: "Sciences",
    items: [
      { label: "MCA",          value: "MCA"      },
      { label: "BCA",          value: "BCA"      },
      { label: "M.Sc",         value: "M.Sc"     },
      { label: "B.Sc (CS)",    value: "B.Sc CS"  },
      { label: "B.Sc (BI)",    value: "B.Sc BI"  },
      { label: "B.Sc (BT)",    value: "B.Sc BT"  },
      { label: "B.Sc (MB)",    value: "B.Sc MB"  },
    ],
  },
];

// ── Flat list for mobile Picker ───────────────────────────────────────────────
const PROGRAMME_FLAT = PROGRAMME_GROUPS.flatMap(g => [
  { label: `── ${g.group} ──`, value: `_header_${g.group}`, disabled: true },
  ...g.items,
]);

// ─── Web pickers ──────────────────────────────────────────────────────────────
function WebDatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const displayVal = value
    ? (() => { const [y,m,d] = value.split("-"); return `${d} ${MONTHS[parseInt(m)-1]?.slice(0,3)} ${y}`; })()
    : null;
  return (
    <View style={{ position: "relative" }}>
      <View style={[styles.dateBtn, !value && styles.dateBtnEmpty]}>
        <Text style={value ? styles.dateBtnText : styles.dateBtnPlaceholder}>{displayVal || "Select date"}</Text>
        <Ionicons name="calendar-outline" size={18} color="#64748B" />
      </View>
      {Platform.OS === "web" && (
        <input type="date" value={value || ""} onChange={e => onChange((e.target as HTMLInputElement).value)}
          style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%", height:"100%", border:"none", background:"transparent", zIndex:10, fontSize:16 }} />
      )}
    </View>
  );
}

function WebYearPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ position: "relative" }}>
      <View style={[styles.dateBtn, !value && styles.dateBtnEmpty]}>
        <Text style={value ? styles.dateBtnText : styles.dateBtnPlaceholder}>{value || "Select year"}</Text>
        <Ionicons name="calendar-outline" size={18} color="#64748B" />
      </View>
      {Platform.OS === "web" && (
        <select value={value || ""} onChange={e => onChange((e.target as HTMLSelectElement).value)}
          style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%", height:"100%", border:"none", background:"transparent", zIndex:10, fontSize:16 }}>
          <option value="">Select year</option>
          {Array.from({ length: new Date().getFullYear() - 1989 + 1 }, (_, i) => new Date().getFullYear() - i)
            .map(year => <option key={year} value={String(year)}>{year}</option>)}
        </select>
      )}
    </View>
  );
}

function MobileDateField({ label, value, onChange, mode = "date" }: {
  label: string; value: string; onChange: (v: string) => void; mode?: "date" | "year";
}) {
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
            if (date) onChange(mode === "year" ? String(date.getFullYear()) : date.toISOString().split("T")[0]);
          }} />
      )}
    </Field>
  );
}

function ChipSelect({ options, value, onChange }: {
  options: { label: string; value: string }[]; value: string; onChange: (v: string) => void;
}) {
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
      <TextInput placeholder={placeholder} placeholderTextColor="#94A3B8"
        value={value} onChangeText={onChange}
        keyboardType={keyboardType} secureTextEntry={secure}
        style={[styles.input, !!error && styles.inputError]} />
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

function AppPicker({ label, value, onChange, items }: {
  label: string; value: string; onChange: (v: string) => void;
  items: { label: string; value: string }[];
}) {
  return (
    <Field label={label}>
      {Platform.OS === "web" ? (
        <select value={value} onChange={e => onChange((e.target as HTMLSelectElement).value)}
          style={{ height:48, borderRadius:12, border:"1px solid #E2E8F0", paddingLeft:12, paddingRight:12, background:"#F8FAFC", fontSize:14, color:value?"#111":"#94A3B8", width:"100%", outline:"none" }}>
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

// ── Programme Picker — grouped (web: optgroup, mobile: disabled headers) ──────
function ProgrammePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Show label for selected value
  const selectedLabel = PROGRAMME_FLAT.find(i => i.value === value)?.label ?? "";

  return (
    <Field label="Programme">
      {Platform.OS === "web" ? (
        // Web — native <optgroup> for clean grouping
        <select
          value={value}
          onChange={e => onChange((e.target as HTMLSelectElement).value)}
          style={{ height:48, borderRadius:12, border:"1px solid #E2E8F0", paddingLeft:12, paddingRight:12, background:"#F8FAFC", fontSize:14, color:value?"#111":"#94A3B8", width:"100%", outline:"none" }}
        >
          <option value="">Select Programme</option>
          {PROGRAMME_GROUPS.map(g => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      ) : (
        // Mobile — disabled header items act as visual separators
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={value}
            onValueChange={v => {
              // Prevent selecting header items
              if (!String(v).startsWith("_header_")) onChange(v);
            }}
          >
            <Picker.Item label="Select Programme" value="" />
            {PROGRAMME_FLAT.map(i => (
              <Picker.Item
                key={i.value}
                label={i.label}
                value={i.value}
                enabled={!(i as any).disabled}
                color={(i as any).disabled ? "#94A3B8" : "#111"}
              />
            ))}
          </Picker>
        </View>
      )}
    </Field>
  );
}

function DateField({ label, value, onChange, mode = "date" }: {
  label: string; value: string; onChange: (v: string) => void; mode?: "date" | "year";
}) {
  if (Platform.OS === "web") {
    return (
      <Field label={label}>
        {mode === "year" ? <WebYearPicker value={value} onChange={onChange} /> : <WebDatePicker value={value} onChange={onChange} />}
      </Field>
    );
  }
  return <MobileDateField label={label} value={value} onChange={onChange} mode={mode} />;
}

function Row2({ children }: { children: React.ReactNode }) {
  return (
    <View style={isWeb ? styles.row2Web : styles.row2Mobile}>
      {React.Children.map(children, child => (
        <View style={isWeb ? { flex: 1 } : { width: "100%" }}>{child}</View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const router = useRouter();
  const [image,      setImage]      = useState<string | null>(null);
  const [errors,     setErrors]     = useState<{ email?: string; mobile?: string }>({});
  const [payLoading, setPayLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "", email: "", mobile: "", gender: "",
    dob: "", batch_year: "", programme: "",
    employment_type: "", organisation: "", designation: "",
    years_of_experience: "", industry: "",
    married: "NO", spouse_name: "", anniversary_date: "",
    address: "", city: "", country: "",
    payment_status: "NO",
  });

  const set = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === "email" || key === "mobile")
      setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const validate = (): boolean => {
    const e: { email?: string; mobile?: string } = {};
    if (!form.email.trim())               e.email  = "Email is required";
    else if (!isValidEmail(form.email))   e.email  = "Enter a valid email (e.g. rahul@gmail.com)";
    if (!form.mobile.trim())              e.mobile = "Mobile number is required";
    else if (!isValidMobile(form.mobile)) e.mobile = "Enter valid 10-digit Indian mobile number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePaymentWeb = async () => {
    const loaded = await loadRazorpayScript();
    setPayLoading(false);
    if (!loaded) { window.alert("Razorpay failed to load."); return; }
    const options: any = {
      key: RAZORPAY_KEY, amount: MEMBERSHIP_AMOUNT * 100, currency: "INR",
      name: "SVIMSAA Alumni", description: "Membership Fee ₹" + MEMBERSHIP_AMOUNT,
      image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      prefill: { name: form.full_name, email: form.email, contact: form.mobile },
      theme: { color: "#5B21B6" },
      handler: (response: any) => {
        set("payment_status", "YES");
        window.alert(`✅ Payment Successful!\nPayment ID: ${response.razorpay_payment_id}`);
      },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", (r: any) => window.alert(`❌ Payment Failed!\n${r.error.description}`));
    rzp.open();
  };

  const handlePaymentMobile = () => {
    setPayLoading(false);
    const UPI_ID = "7067236880@ybl";
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=SVIMSAA+Alumni&am=${MEMBERSHIP_AMOUNT}&cu=INR&tn=Membership+Fee`;
    Alert.alert(
      `Membership Fee ₹${MEMBERSHIP_AMOUNT}`,
      "Please complete the payment using any UPI application such as Google Pay, PhonePe, or Paytm.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed to Payment",
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(upiUrl);
              if (supported) {
                await Linking.openURL(upiUrl);
                setTimeout(() => {
                  Alert.alert("Payment Confirmation", `Have you successfully paid ₹${MEMBERSHIP_AMOUNT}?`, [
                    { text: "Not Yet", style: "cancel" },
                    { text: "Payment Completed", onPress: () => {
                      set("payment_status", "YES");
                      Alert.alert("Payment Recorded", "Your payment has been marked successfully.");
                    }},
                  ]);
                }, 3000);
              } else {
                Alert.alert("UPI Application Not Found", "Please install Google Pay, PhonePe, or Paytm.");
              }
            } catch {
              Alert.alert("Error", "Unable to open UPI application.");
            }
          },
        },
      ]
    );
  };

  const handlePayment = async () => {
    if (!form.full_name || !form.email || !form.mobile) {
      if (isWeb) window.alert("Required Fill Full Name, Email and Mobile first")
      else Alert.alert("Required", "Fill Full Name, Email and Mobile first");
      return;
    }
    if (!validate()) return;
    setPayLoading(true);
    if (isWeb) await handlePaymentWeb();
    else handlePaymentMobile();
  };

  const handleSubmit = async () => {
    if (!form.full_name) {
      if (isWeb) window.alert("Please fill Full Name");
      else Alert.alert("Validation", "Please fill Full Name");
      return;
    }
    if (!validate()) return;
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
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
      const res = await axios.post(API_URL, fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (isWeb) {
        window.alert(`Registered Successfully!\n\nYour login password:\n${res.data.login_password}`);
        router.push("/loginscreen");
      } else {
        Alert.alert("Registered! ✅", `Your login password:\n\n${res.data.login_password}\n\nPlease save it safely.`,
          [{ text: "Go to Login", onPress: () => router.push("/loginscreen") }]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Registration failed";
      if (isWeb) window.alert(msg); else Alert.alert("Error", msg);
    }
  };

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
              <Input label="Mobile *" placeholder="98765 43210" value={form.mobile} onChange={(t: string) => set("mobile", t)} keyboardType="phone-pad" error={errors.mobile} />
              <AppPicker label="Gender" value={form.gender} onChange={v => set("gender", v)}
                items={[{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }, { label: "Other", value: "Other" }]} />
            </Row2>
            <Row2>
              <DateField label="Date of Birth" value={form.dob} onChange={v => set("dob", v)} />
              <DateField label="Batch Year" value={form.batch_year} onChange={v => set("batch_year", v)} mode="year" />
            </Row2>

            {/* ── GROUPED PROGRAMME PICKER ── */}
            <ProgrammePicker value={form.programme} onChange={v => set("programme", v)} />
          </View>

          <Section title="Work Information" icon="briefcase-outline" />
          <View style={styles.card}>
            <Row2>
              <AppPicker label="Employment Type" value={form.employment_type} onChange={v => set("employment_type", v)}
                items={[{ label: "Private", value: "Private" }, { label: "Government", value: "Government" }, { label: "Business", value: "Business" }, { label: "Student", value: "Student" }]} />
              <Input label="Organisation" placeholder="Infosys Ltd." value={form.organisation} onChange={(t: string) => set("organisation", t)} />
            </Row2>
            <Row2>
              <Input label="Designation" placeholder="Senior Developer" value={form.designation} onChange={(t: string) => set("designation", t)} />
              <AppPicker label="Experience" value={form.years_of_experience} onChange={v => set("years_of_experience", v)}
                items={[{ label: "0–1 year", value: "1" }, { label: "1–3 years", value: "3" }, { label: "3–5 years", value: "5" }, { label: "5+ years", value: "10" }]} />
            </Row2>
            <Input label="Industry" placeholder="Information Technology" value={form.industry} onChange={(t: string) => set("industry", t)} />
          </View>

          <Section title="Personal Details" icon="heart-outline" />
          <View style={styles.card}>
            <Field label="Marital Status">
              <ChipSelect options={[{ label: "Single", value: "NO" }, { label: "Married", value: "YES" }]} value={form.married} onChange={v => set("married", v)} />
            </Field>
            {form.married === "YES" && (
              <Row2>
                <Input label="Spouse Name" placeholder="Name" value={form.spouse_name} onChange={(t: string) => set("spouse_name", t)} />
                <DateField label="Anniversary" value={form.anniversary_date} onChange={v => set("anniversary_date", v)} />
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

          <Section title="Membership Payment" icon="card-outline" />
          <View style={styles.card}>
            <View style={styles.payInfoRow}>
              <Ionicons name="information-circle-outline" size={16} color="#5B21B6" />
              <Text style={styles.payInfoText}>
                Membership fee: <Text style={{ fontWeight: "800" }}>₹{MEMBERSHIP_AMOUNT}</Text>
              </Text>
            </View>

            {Platform.OS !== "web" && !RazorpayCheckout && form.payment_status !== "YES" && (
              <View style={[styles.payInfoRow, { backgroundColor: "#FEF3C7", marginBottom: 10 }]}>
                <Ionicons name="warning-outline" size={16} color="#D97706" />
                <Text style={[styles.payInfoText, { color: "#92400E", flex: 1 }]}>
                  Razorpay not available in Expo Go. UPI deep link will be used instead.{"\n"}
                  For full support: <Text style={{ fontWeight: "700" }}>npx expo run:android</Text>
                </Text>
              </View>
            )}

            {form.payment_status !== "YES" && (
              <View style={styles.payMethodsRow}>
                {(Platform.OS !== "web" && !RazorpayCheckout
                  ? ["UPI Apps", "Google Pay", "PhonePe", "Paytm"]
                  : ["UPI / QR", "Card", "Net Banking", "Wallet"]
                ).map((m, i) => (
                  <View key={i} style={styles.payMethodChip}>
                    <Text style={styles.payMethodText}>{m}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.payStatusBadge, form.payment_status === "YES" ? styles.payStatusPaid : styles.payStatusUnpaid]}>
              <Ionicons name={form.payment_status === "YES" ? "checkmark-circle" : "time-outline"} size={16}
                color={form.payment_status === "YES" ? "#16A34A" : "#92400E"} />
              <Text style={[styles.payStatusText, { color: form.payment_status === "YES" ? "#16A34A" : "#92400E" }]}>
                {form.payment_status === "YES" ? "Payment Successful ✅" : "Payment Pending"}
              </Text>
            </View>

            {form.payment_status !== "YES" && (
              <TouchableOpacity style={[styles.payBtn, payLoading && styles.payBtnDisabled]}
                onPress={handlePayment} disabled={payLoading} activeOpacity={0.85}>
                <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtnGradient}>
                  {payLoading ? (
                    <Text style={styles.payBtnText}>Opening payment...</Text>
                  ) : (
                    <>
                      <Ionicons name="card-outline" size={20} color="#fff" />
                      <Text style={styles.payBtnText}>
                        {Platform.OS !== "web" && !RazorpayCheckout
                          ? `Pay ₹${MEMBERSHIP_AMOUNT} via UPI`
                          : `Pay ₹${MEMBERSHIP_AMOUNT} via Razorpay`}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.submitText}>Register →</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero:      { paddingHorizontal: 30, paddingTop: 40, paddingBottom: 36, alignItems: "center" },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "800", textAlign: "center" },
  heroSub:   { color: "#cbd5e1", fontSize: 18, marginTop: 6, textAlign: "center" },
  content:   { padding: isWeb ? 24 : 16, maxWidth: isWeb ? 1500 : undefined, alignSelf: "center", width: "100%" },
  avatarWrap:        { alignItems: "center", marginVertical: 20 },
  avatar:            { width: 130, height: 130, borderRadius: 90, borderWidth: 3, borderColor: "#4F46E5" },
  avatarPlaceholder: { width: 130, height: 130, borderRadius: 90, backgroundColor: "#EEF2FF", borderWidth: 2, borderColor: "#4F46E5", borderStyle: "dashed", justifyContent: "center", alignItems: "center" },
  avatarText:        { fontSize: 11, color: "#4F46E5", fontWeight: "600", marginTop: 4 },
  sectionRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  card:         { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 4, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  row2Web:    { flexDirection: "row", gap: 12 },
  row2Mobile: { flexDirection: "column", gap: 0 },
  field:      { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  errorRow:   { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  errorText:  { fontSize: 11, color: "#DC2626", flex: 1 },
  input:      { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, color: "#111" },
  inputError: { borderColor: "#DC2626", backgroundColor: "#FFF5F5" },
  pickerBox:  { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, overflow: "hidden" },
  dateBtn:           { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 14, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateBtnEmpty:      {},
  dateBtnText:       { fontSize: 14, color: "#111" },
  dateBtnPlaceholder:{ fontSize: 14, color: "#94A3B8" },
  chipRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip:        { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
  chipSel:     { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  chipText:    { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipSelText: { color: "#4F46E5" },
  payInfoRow:     { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#EEF2FF", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  payInfoText:    { color: "#3730A3", fontSize: 14 },
  payMethodsRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  payMethodChip:  { backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  payMethodText:  { fontSize: 11, fontWeight: "600", color: "#475569" },
  payStatusBadge: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  payStatusPaid:   { backgroundColor: "#DCFCE7" },
  payStatusUnpaid: { backgroundColor: "#FEF3C7" },
  payStatusText:   { fontSize: 14, fontWeight: "700" },
  payBtn:         { borderRadius: 14, overflow: "hidden", marginBottom: 10 },
  payBtnDisabled: { opacity: 0.7 },
  payBtnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  payBtnText:     { color: "#fff", fontWeight: "800", fontSize: 16 },
  submitBtn:  { backgroundColor: "#4F46E5", paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 16, flexDirection: "row", justifyContent: "center", gap: 10 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});