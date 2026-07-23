import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLinking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Alert, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";

// ── STRICT ENV CHECK ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const isWeb = Platform.OS === "web";

const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

const TABS = ["Lecture", "Mentorship", "Donate", "Community", "My Contributions"];
const EXPERTISE_OPTIONS = [
  "Web Dev", "Mobile Dev", "AI/ML", "Data Science",
  "Cloud", "Cybersecurity", "Finance", "Marketing",
  "Design", "Entrepreneurship", "HR", "Operations",
];
const BATCH_OPTIONS = ["2020–2024", "2019–2023", "2018–2022", "2017–2021", "Any Batch"];
const DONATION_AMOUNTS = ["500", "1000", "2500", "5000", "10000"];

// ── Avatar helper ──
function UserAvatar({ photo, name, size = 64 }: { photo?: string | null; name?: string; size?: number }) {
  const initials = name ? name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : "?";
  const colors = ["#7C3AED", "#4F46E5", "#0891B2", "#059669", "#D97706", "#DC2626", "#DB2777"];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  if (photo) {
    return <Image source={{ uri: `${API_BASE}/uploads/${photo}` }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: "#E2E8F0" }} />;
  }
  return (
    <LinearGradient colors={[colors[colorIndex], colors[(colorIndex + 1) % colors.length]]} style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "900", fontSize: size * 0.32 }}>{initials}</Text>
    </LinearGradient>
  );
}

// ── Community Card ──
function CommunityCard({ item, currentUser }: { item: any, currentUser: any }) {
  const router = useRouter();
  const donationLabel = item.donation_type === "Money" ? "Made a Donation" : item.donation_type === "Equipment" ? "Donated Equipment" : "Sponsored Scholarship";
  const donationIcon = item.donation_type === "Money" ? "💰" : item.donation_type === "Equipment" ? "🖥️" : "🎓";

  return (
    <View style={cStyles.card}>
      <View style={cStyles.cardHeader}>
        <UserAvatar photo={item.profile_photo} name={item.full_name} size={64} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={cStyles.name} numberOfLines={1}>{item.full_name}</Text>
          <Text style={cStyles.designation} numberOfLines={1}>{item.designation || donationLabel}</Text>
        </View>
      </View>

      {(item.programme || item.batch_year) && (
        <View style={cStyles.pillRow}>
          {item.programme && <View style={cStyles.pillCourse}><Text style={cStyles.pillCourseText}>{item.programme}</Text></View>}
          {item.batch_year && <View style={cStyles.pillBatch}><Text style={cStyles.pillBatchText}>{item.batch_year}</Text></View>}
        </View>
      )}

      <View style={cStyles.metaSection}>
        {item.current_city && (
          <View style={cStyles.metaRow}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={cStyles.metaText} numberOfLines={1}>{item.current_city}</Text>
          </View>
        )}
        {item.organisation && (
          <View style={cStyles.metaRow}>
            <Ionicons name="briefcase-outline" size={14} color="#64748B" />
            <Text style={cStyles.metaText} numberOfLines={1}>{item.organisation}</Text>
          </View>
        )}
      </View>

      <View style={cStyles.donationBox}>
        <Text style={cStyles.donationIcon}>{donationIcon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={cStyles.donationLabel}>{donationLabel}</Text>
          {item.amount && <Text style={cStyles.donationAmount}>₹{Number(item.amount).toLocaleString("en-IN")}</Text>}
          {item.equipment_description && <Text style={cStyles.donationDesc} numberOfLines={2}>{item.equipment_description}</Text>}
          {item.scholarship_description && <Text style={cStyles.donationDesc} numberOfLines={2}>{item.scholarship_description}</Text>}
          {item.message && <Text style={cStyles.donationDesc} numberOfLines={2}>"{item.message}"</Text>}
        </View>
        <Text style={cStyles.donationDate}>{item.created_at?.split("T")[0]}</Text>
      </View>

      {(!currentUser || item.alumni_id !== currentUser.id) && (
        <TouchableOpacity 
          style={cStyles.viewBtn} 
          activeOpacity={0.88}
          onPress={() => router.push({ pathname: "/alumniprofile", params: { id: item.alumni_id } })}
        >
          <Ionicons name="person-outline" size={16} color="#fff" />
          <Text style={cStyles.viewBtnText}>View Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── My Contribution Card (Modified for Modal Trigger) ──
function MyContribCard({ item, type, onPress }: { item: any; type: "lecture" | "mentor" | "donation", onPress?: () => void }) {
  const statusColor = (s: string) => {
    if (s === "Approved" || s === "Paid") return { bg: "#DCFCE7", text: "#16A34A" };
    if (s === "Rejected" || s === "Failed") return { bg: "#FEE2E2", text: "#DC2626" };
    return { bg: "#FEF3C7", text: "#D97706" };
  };

  const icon = type === "lecture" ? "🎤" : type === "mentor" ? "🧑‍🏫" : "💛";
  const title = type === "lecture" ? item.topic || item.title : type === "mentor" ? item.expertise : item.donation_type === "Money" ? `₹${item.amount} Donation` : item.donation_type || "Donation";
  const sub = type === "lecture" ? `Mode: ${item.mode || "—"} · ${item.created_at?.split("T")[0]}` : type === "mentor" ? `Max ${item.max_mentees} mentees` : item.receipt_number ? `🧾 ${item.receipt_number}` : item.created_at?.split("T")[0];

  const CardBody = (
    <View style={mcStyles.card}>
      <View style={mcStyles.left}>
        <View style={mcStyles.iconBox}><Text style={{ fontSize: 20 }}>{icon}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={mcStyles.title} numberOfLines={1}>{title}</Text>
          <Text style={mcStyles.sub} numberOfLines={1}>{sub}</Text>
        </View>
      </View>
      <View style={[mcStyles.badge, { backgroundColor: statusColor(item.status).bg }]}>
        <Text style={[mcStyles.badgeText, { color: statusColor(item.status).text }]}>{item.status}</Text>
      </View>
    </View>
  );

  return onPress ? (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      {CardBody}
    </TouchableOpacity>
  ) : CardBody;
}

// ─── Main Screen ───
export default function ContributionsScreen() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Donate");
  const [communityData, setCommunityData] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lecture States
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [availFrom, setAvailFrom] = useState("");
  const [availTo, setAvailTo] = useState("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [mode, setMode] = useState("Both");
  const [myLectures, setMyLectures] = useState<any[]>([]);

  // Mentorship States
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [maxMentees, setMaxMentees] = useState("3");
  const [myMentor, setMyMentor] = useState<any>(null);

  // Donation States
  const [donationType, setDonationType] = useState("Money");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [equipmentDesc, setEquipmentDesc] = useState("");
  const [scholarshipDesc, setScholarshipDesc] = useState("");
  const [donationMsg, setDonationMsg] = useState("");
  const [myDonations, setMyDonations] = useState<any[]>([]);
  
  // Modal States
  const [selectedDonation, setSelectedDonation] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { loadUser(); fetchCommunityContributions(); }, []);

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (data) { const parsed = JSON.parse(data); setUser(parsed); fetchMyData(parsed.id); }
    } catch (err) {
      console.log("Error loading user:", err);
    }
  };

  const fetchMyData = async (id: number) => {
    try {
      const res = await axios.get(`${API_BASE}/contributions/all/${id}`);
      if (res.data.success) {
        setMyLectures(res.data.lectures || []);
        setMyMentor(res.data.mentors?.[0] || null);
        setMyDonations(res.data.donations || []);
      }
    } catch {}
  };

  const fetchCommunityContributions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/contributions/community`);
      if (res.data.success) setCommunityData(res.data.data || []);
    } catch {}
  };

  const submitLecture = async () => {
    if (!topic) { showAlert("Validation Error", "Please enter a topic"); return; }
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/contributions/lecture`, {
        alumni_id: user.id, topic, description,
        available_from: availFrom, available_to: availTo,
        target_batches: selectedBatches.join(", "), mode,
      });
      showAlert("Success ✅", res.data.message);
      setTopic(""); setDescription(""); setAvailFrom(""); setAvailTo(""); setSelectedBatches([]);
      fetchMyData(user.id);
    } catch { 
      showAlert("Error", "Submission failed"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMentor = async () => {
    if (selectedExpertise.length === 0) { showAlert("Validation Error", "Select at least one expertise"); return; }
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_BASE}/contributions/mentor`, {
        alumni_id: user.id, expertise: selectedExpertise.join(", "), max_mentees: Number(maxMentees),
      });
      showAlert("Success ✅", res.data.message);
      fetchMyData(user.id);
    } catch { 
      showAlert("Error", "Submission failed"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── INTEGRATED PAYMENT GATEWAY FLOW (Easebuzz Popup / Mobile DeepLink) ──
  const submitDonation = async () => {
    const finalAmount = customAmount || selectedAmount;
    if (donationType === "Money" && !finalAmount) { showAlert("Validation Error", "Please enter or select a donation amount"); return; }
    if (donationType === "Equipment" && !equipmentDesc) { showAlert("Validation Error", "Please describe the equipment"); return; }
    if (donationType === "Scholarship" && !scholarshipDesc) { showAlert("Validation Error", "Please describe the scholarship"); return; }
    
    setIsSubmitting(true);
    
    try {
      const res = await axios.post(`${API_BASE}/contributions/donate`, {
        alumni_id: user.id, donation_type: donationType,
        amount: donationType === "Money" ? Number(finalAmount) : null,
        equipment_description: equipmentDesc, scholarship_description: scholarshipDesc, message: donationMsg,
      });

      if (donationType === "Money" && res.data.donation_id) {
        const returnUrl = ExpoLinking.createURL(""); 
        const safeName = (user.full_name || "Alumni").trim().replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
        const safePhone = user.mobile ? user.mobile.replace(/\D/g, "").slice(-10) : "9999999999";

        const initRes = await axios.post(`${API_BASE}/pay/initiate`, {
          amount: Number(finalAmount),
          firstname: safeName,
          email: user.email.trim(),
          phone: safePhone, 
          productinfo: "Alumni Donation",
          payment_type: "DON",
          reference_id: res.data.donation_id.toString(),
          return_url: returnUrl 
        });

        if (initRes.data && initRes.data.checkout_url) {
          const checkoutUrl = initRes.data.checkout_url;

          if (isWeb) {
            const width = 500; const height = 750;
            const left = (window.innerWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;
            const popup = window.open(checkoutUrl, "Payment", `width=${width},height=${height},left=${left},top=${top}`);

            const handleMessage = (event: any) => {
              if (event.data?.type === 'PAYMENT_RETURN') {
                window.removeEventListener('message', handleMessage);
                setIsSubmitting(false);
                
                if (event.data.status === 'success') {
                  showAlert("Donation Successful! 💛", "Thank you for your generous contribution to your alma mater.");
                  setSelectedAmount(""); setCustomAmount(""); setDonationMsg("");
                  fetchMyData(user.id);
                } else {
                  showAlert("Payment Failed", "The transaction was cancelled or failed. Please try again.");
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
            const browserResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
            setIsSubmitting(false);

            if (browserResult.type === 'success' && browserResult.url) {
              const parsed = ExpoLinking.parse(browserResult.url);
              if (parsed.queryParams?.status === 'success') {
                showAlert("Donation Successful! 💛", "Thank you for your generous contribution to your alma mater.");
                setSelectedAmount(""); setCustomAmount(""); setDonationMsg("");
                fetchMyData(user.id);
              } else {
                showAlert("Payment Failed", "The transaction was cancelled or failed. Please try again.");
              }
            } else {
              showAlert("Payment Cancelled", "You closed the gateway before completing the payment.");
            }
          }
          return;
        }
      }

      setIsSubmitting(false);
      showAlert("Success ✅", `${res.data.message}${res.data.receipt_number ? "\nReceipt: " + res.data.receipt_number : ""}`);
      setSelectedAmount(""); setCustomAmount(""); setEquipmentDesc(""); setScholarshipDesc(""); setDonationMsg("");
      fetchMyData(user.id);

    } catch (err: any) { 
      setIsSubmitting(false);
      showAlert("Error", err?.response?.data?.message || "Donation process failed. Please check connection."); 
    }
  };

  const toggleChip = (val: string, list: string[], setList: any) => {
    setList((prev: string[]) => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const openDonationModal = (donation: any) => {
    setSelectedDonation(donation);
    setModalVisible(true);
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
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

        {/* HERO */}
        <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hero}>
          <View style={styles.webContainer}>
            <Text style={styles.heroTitle}>Giving Back 💛</Text>
            <Text style={styles.heroSub}>Lecture • Mentor • Donate — contribute to your alma mater</Text>
          </View>
        </LinearGradient>

        <View style={styles.webContainer}>
          {/* TABS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {TABS.map(tab => (
              <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.content}>
            {/* ════════ GUEST LECTURE ════════ */}
            {activeTab === "Lecture" && (
              <>
                <View style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}><Text style={{ fontSize: 22 }}>🎤</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>Offer a Guest Lecture</Text>
                      <Text style={styles.cardSub}>Share your knowledge with current students</Text>
                    </View>
                  </View>
                  <Text style={styles.fieldLabel}>Topic / Subject *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Introduction to Cloud Computing" value={topic} onChangeText={setTopic} />
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput style={[styles.input, { height: 90, textAlignVertical: "top", paddingTop: 14 }]} placeholder="What will you cover?" multiline value={description} onChangeText={setDescription} />
                  
                  <Text style={styles.fieldLabel}>Available Dates</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {Platform.OS === "web" ? (
                      <>
                        <input type="date" value={availFrom} onChange={e => setAvailFrom((e.target as HTMLInputElement).value)} style={{ flex: 1, height: 48, borderRadius: 12, border: "1px solid #e2e8f0", paddingLeft: 12, background: "#f8fafc", fontFamily: "sans-serif" }} />
                        <input type="date" value={availTo} onChange={e => setAvailTo((e.target as HTMLInputElement).value)} style={{ flex: 1, height: 48, borderRadius: 12, border: "1px solid #e2e8f0", paddingLeft: 12, background: "#f8fafc", fontFamily: "sans-serif" }} />
                      </>
                    ) : (
                      <>
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="From (YYYY-MM-DD)" value={availFrom} onChangeText={setAvailFrom} />
                        <TextInput style={[styles.input, { flex: 1 }]} placeholder="To (YYYY-MM-DD)" value={availTo} onChangeText={setAvailTo} />
                      </>
                    )}
                  </View>
                  
                  <Text style={styles.fieldLabel}>Target Batches</Text>
                  <View style={styles.chipRow}>
                    {BATCH_OPTIONS.map(b => (
                      <TouchableOpacity key={b} style={[styles.chip, selectedBatches.includes(b) && styles.chipActive]} onPress={() => toggleChip(b, selectedBatches, setSelectedBatches)} activeOpacity={0.7}>
                        <Text style={[styles.chipText, selectedBatches.includes(b) && styles.chipActiveText]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <Text style={styles.fieldLabel}>Mode</Text>
                  <View style={styles.chipRow}>
                    {["Online", "Offline", "Both"].map(m => (
                      <TouchableOpacity key={m} style={[styles.chip, mode === m && styles.chipActive]} onPress={() => setMode(m)} activeOpacity={0.7}>
                        <Text style={[styles.chipText, mode === m && styles.chipActiveText]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} onPress={submitLecture} disabled={isSubmitting} activeOpacity={0.85}>
                    <Text style={styles.submitText}>{isSubmitting ? "Submitting..." : "Submit for Review →"}</Text>
                  </TouchableOpacity>
                </View>
                
                {myLectures.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>My Submissions</Text>
                    {myLectures.map(item => <MyContribCard key={item.id} item={item} type="lecture" />)}
                  </>
                )}
              </>
            )}

            {/* ════════ MENTORSHIP ════════ */}
            {activeTab === "Mentorship" && (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}><Text style={{ fontSize: 22 }}>🧑‍🏫</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Become a Mentor</Text>
                    <Text style={styles.cardSub}>Mark yourself available for 1:1 mentorship sessions</Text>
                  </View>
                </View>
                {myMentor && (
                  <View style={[styles.statusBanner, { backgroundColor: myMentor.status === "Approved" ? "#DCFCE7" : myMentor.status === "Rejected" ? "#FEE2E2" : "#FEF3C7" }]}>
                    <Text style={{ color: myMentor.status === "Approved" ? "#16A34A" : myMentor.status === "Rejected" ? "#DC2626" : "#D97706", fontWeight: "700" }}>Current Status: {myMentor.status}</Text>
                    <Text style={{ color: myMentor.status === "Approved" ? "#16A34A" : myMentor.status === "Rejected" ? "#DC2626" : "#D97706", fontSize: 12, marginTop: 2 }}>Expertise: {myMentor.expertise}</Text>
                  </View>
                )}
                <Text style={styles.fieldLabel}>Areas of Expertise *</Text>
                <View style={styles.chipRow}>
                  {EXPERTISE_OPTIONS.map(e => (
                    <TouchableOpacity key={e} style={[styles.chip, selectedExpertise.includes(e) && styles.chipActive]} onPress={() => toggleChip(e, selectedExpertise, setSelectedExpertise)} activeOpacity={0.7}>
                      <Text style={[styles.chipText, selectedExpertise.includes(e) && styles.chipActiveText]}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.fieldLabel}>Max Mentees at a time</Text>
                <View style={styles.chipRow}>
                  {["1", "2", "3", "5"].map(n => (
                    <TouchableOpacity key={n} style={[styles.chip, maxMentees === n && styles.chipActive]} onPress={() => setMaxMentees(n)} activeOpacity={0.7}>
                      <Text style={[styles.chipText, maxMentees === n && styles.chipActiveText]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} onPress={submitMentor} disabled={isSubmitting} activeOpacity={0.85}>
                  <Text style={styles.submitText}>{isSubmitting ? "Updating..." : myMentor ? "Update Mentorship Profile →" : "Register as Mentor →"}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ════════ DONATE ════════ */}
            {activeTab === "Donate" && (
              <>
                <View style={styles.card}>
                  <View style={styles.cardHead}>
                    <View style={[styles.iconBox, { backgroundColor: "#DCFCE7" }]}><Text style={{ fontSize: 22 }}>💛</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>Make a Donation</Text>
                      <Text style={styles.cardSub}>Money, equipment, or scholarships</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.fieldLabel}>Donation Type *</Text>
                  <View style={styles.chipRow}>
                    {["Money", "Equipment", "Scholarship"].map(t => (
                      <TouchableOpacity key={t} style={[styles.chip, donationType === t && styles.chipActive]} onPress={() => setDonationType(t)} activeOpacity={0.7}>
                        <Text style={[styles.chipText, donationType === t && styles.chipActiveText]}>
                          {t === "Money" ? "💰 Money" : t === "Equipment" ? "🖥️ Equipment" : "🎓 Scholarship"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {donationType === "Money" && (
                    <>
                      <Text style={styles.fieldLabel}>Select Amount (₹)</Text>
                      <View style={styles.chipRow}>
                        {DONATION_AMOUNTS.map(a => (
                          <TouchableOpacity key={a} style={[styles.chip, selectedAmount === a && styles.chipActive]} onPress={() => { setSelectedAmount(a); setCustomAmount(""); }} activeOpacity={0.7}>
                            <Text style={[styles.chipText, selectedAmount === a && styles.chipActiveText]}>₹{a}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput style={styles.input} placeholder="Or enter custom amount" keyboardType="numeric" value={customAmount} onChangeText={t => { setCustomAmount(t); setSelectedAmount(""); }} />
                    </>
                  )}
                  
                  {donationType === "Equipment" && (
                    <>
                      <Text style={styles.fieldLabel}>Equipment Description *</Text>
                      <TextInput style={[styles.input, { height: 90, textAlignVertical: "top", paddingTop: 14 }]} placeholder="e.g. 10 laptops, model XYZ..." multiline value={equipmentDesc} onChangeText={setEquipmentDesc} />
                    </>
                  )}
                  
                  {donationType === "Scholarship" && (
                    <>
                      <Text style={styles.fieldLabel}>Scholarship Details *</Text>
                      <TextInput style={[styles.input, { height: 90, textAlignVertical: "top", paddingTop: 14 }]} placeholder="e.g. ₹50,000 per year for meritorious students..." multiline value={scholarshipDesc} onChangeText={setScholarshipDesc} />
                    </>
                  )}
                  
                  <Text style={styles.fieldLabel}>Message (optional)</Text>
                  <TextInput style={[styles.input, { height: 70, textAlignVertical: "top", paddingTop: 14 }]} placeholder="Any message for the institute..." multiline value={donationMsg} onChangeText={setDonationMsg} />
                  
                  <TouchableOpacity 
                    style={[styles.submitBtn, { backgroundColor: "#16A34A" }, isSubmitting && styles.submitBtnDisabled]} 
                    onPress={submitDonation}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitText}>{isSubmitting ? "Processing..." : donationType === "Money" ? "Proceed to Donate Securely →" : "Submit Donation →"}</Text>
                  </TouchableOpacity>
                </View>
                
                {myDonations.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>My Donations</Text>
                    {myDonations.map(item => (
                      <MyContribCard 
                        key={item.id} 
                        item={item} 
                        type="donation" 
                        onPress={() => openDonationModal(item)}
                      />
                    ))}
                  </>
                )}
              </>
            )}

            {/* ════════ COMMUNITY ════════ */}
            {activeTab === "Community" && (
              <>
                <View style={cStyles.sectionHeader}>
                  <Text style={cStyles.sectionTitle}>Alumni Contributions</Text>
                  <Text style={cStyles.sectionSub}>{communityData.length} alumni giving back</Text>
                </View>

                {communityData.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={{ fontSize: 48 }}>💛</Text>
                    <Text style={styles.emptyTitle}>No contributions yet</Text>
                    <Text style={styles.emptySub}>Be the first to give back!</Text>
                  </View>
                ) : (
                  <View style={cStyles.grid}>
                    {communityData.map(item => (
                      <View key={item.id} style={cStyles.gridItem}>
                        <CommunityCard item={item} currentUser={user} />
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* ════════ MY CONTRIBUTIONS ════════ */}
            {activeTab === "My Contributions" && (
              <>
                <View style={cStyles.sectionHeader}>
                  <Text style={cStyles.sectionTitle}>My Contributions</Text>
                  <Text style={cStyles.sectionSub}>
                    {myLectures.length + (myMentor ? 1 : 0) + myDonations.length} Contributions
                  </Text>
                </View>

                {myLectures.length === 0 && !myMentor && myDonations.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={{ fontSize: 48 }}>💛</Text>
                    <Text style={styles.emptyTitle}>No contributions yet</Text>
                    <Text style={styles.emptySub}>Start giving back to your alma mater!</Text>
                  </View>
                ) : (
                  <View style={cStyles.grid}>
                    {myLectures.map(item => <View key={item.id} style={cStyles.gridItem}><MyContribCard item={item} type="lecture" /></View>)}
                    {myMentor && <View style={cStyles.gridItem}><MyContribCard item={myMentor} type="mentor" /></View>}
                    {myDonations.map(item => (
                      <View key={item.id} style={cStyles.gridItem}>
                        <MyContribCard 
                          item={item} 
                          type="donation" 
                          onPress={() => openDonationModal(item)}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── DONATION DETAILS MODAL ── */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Donation Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedDonation && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedDonation.title}</Text>
                </View>
                
                {selectedDonation.title === "Money" && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>₹{Number(selectedDonation.amount).toLocaleString('en-IN')}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[mcStyles.badge, { backgroundColor: selectedDonation.status === 'Paid' || selectedDonation.status === 'Approved' ? '#DCFCE7' : selectedDonation.status === 'Failed' ? '#FEE2E2' : '#FEF3C7', alignSelf: 'flex-start' }]}>
                    <Text style={[mcStyles.badgeText, { color: selectedDonation.status === 'Paid' || selectedDonation.status === 'Approved' ? '#16A34A' : selectedDonation.status === 'Failed' ? '#DC2626' : '#D97706' }]}>{selectedDonation.status}</Text>
                  </View>
                </View>

                {selectedDonation.receipt_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Receipt / Txn ID:</Text>
                    <Text style={styles.detailValue} selectable={true}>{selectedDonation.receipt_number}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{new Date(selectedDonation.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Community card styles ───
const cStyles = StyleSheet.create({
  sectionHeader: { marginBottom: 18 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  sectionSub: { fontSize: 13, color: "#64748B", marginTop: 3 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  gridItem: { flex: 1, minWidth: 280 }, 
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#4F46E5", shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  name: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  designation: { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "500" },
  pillRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  pillCourse: { backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillCourseText: { fontSize: 12, fontWeight: "700", color: "#4F46E5" },
  pillBatch: { backgroundColor: "#E0F2FE", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillBatchText: { fontSize: 12, fontWeight: "700", color: "#0284C7" },
  metaSection: { gap: 6, marginBottom: 14 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#475569", flex: 1 },
  donationBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#F0FDF4", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#DCFCE7" },
  donationIcon: { fontSize: 20 },
  donationLabel: { fontSize: 13, fontWeight: "700", color: "#166534", marginBottom: 3 },
  donationAmount: { fontSize: 16, fontWeight: "900", color: "#15803D", marginBottom: 2 },
  donationDesc: { fontSize: 12, color: "#166534", lineHeight: 17 },
  donationDate: { fontSize: 10, color: "#16A34A", fontWeight: "600", marginTop: 2 },
  viewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#4F46E5", paddingVertical: 13, borderRadius: 14, shadowColor: "#4F46E5", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  viewBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});

// ─── My Contribution card styles ───
const mcStyles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E2E8F0" },
  title: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  sub: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
});

// ─── Shared styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  webContainer: { maxWidth: 900, alignSelf: "center", width: "100%" }, 
  hero: { width: "100%", paddingHorizontal: 24, paddingTop: 30, paddingBottom: 32 },
  heroTitle: { color: "#fff", fontSize: Platform.OS === "web" ? 32 : 28, fontWeight: "800", textAlign: Platform.OS === "web" ? "center" : "left", letterSpacing: -0.5 },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 6, textAlign: Platform.OS === "web" ? "center" : "left", fontWeight: "500" },
  tabsRow: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10, gap: 10 },
  tabBtn: { backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  activeTab: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  tabText: { color: "#64748B", fontWeight: "700", fontSize: 13.5 },
  activeTabText: { color: "#fff" },
  content: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2, shadowColor: "#0F172A", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, borderWidth: 1, borderColor: "#F1F5F9" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  cardSub: { fontSize: 13.5, color: "#64748B", marginTop: 3 },
  fieldLabel: { fontSize: 13.5, fontWeight: "700", color: "#334155", marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 16, height: 50, fontSize: 14, color: "#0F172A", marginBottom: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0" },
  chipActive: { backgroundColor: "#EEF2FF", borderColor: "#4F46E5" },
  chipText: { fontSize: 13.5, fontWeight: "600", color: "#64748B" },
  chipActiveText: { color: "#4F46E5", fontWeight: "700" },
  submitBtn: { backgroundColor: "#4F46E5", paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 8},
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#64748B", marginBottom: 15, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  statusBanner: { borderRadius: 14, padding: 14, marginBottom: 16 },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#64748B", marginTop: 6, fontWeight: "500" },
  errorContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 32, textAlign: "center" as any },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20, maxWidth: 420 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, padding: 24, width: "100%", maxWidth: 450, alignSelf: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  modalBody: { gap: 16, marginBottom: 24 },
  detailRow: { flexDirection: "column", gap: 4 },
  detailLabel: { fontSize: 12, color: "#64748B", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 15, color: "#0F172A", fontWeight: "600" },
  modalCloseBtn: { backgroundColor: "#F1F5F9", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  modalCloseBtnText: { color: "#475569", fontWeight: "800", fontSize: 14 }
});