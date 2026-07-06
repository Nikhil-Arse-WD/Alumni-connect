import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from "react-native";


const API = "http://10.232.80.175:2000";

const TABS = [
  "Lecture",
  "Mentorship",
  "Donate",
  "Community",
  "My Contributions"
];
const EXPERTISE_OPTIONS = [
  "Web Dev", "Mobile Dev", "AI/ML", "Data Science",
  "Cloud", "Cybersecurity", "Finance", "Marketing",
  "Design", "Entrepreneurship", "HR", "Operations",
];

const BATCH_OPTIONS = ["2020–2024", "2019–2023", "2018–2022", "2017–2021", "Any Batch"];
const DONATION_AMOUNTS = ["500", "1000", "2500", "5000", "10000"];

export default function ContributionsScreen() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Lecture");
  const [communityData, setCommunityData] = useState<any[]>([]);
  // LECTURE FORM
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [availFrom, setAvailFrom] = useState("");
  const [availTo, setAvailTo] = useState("");
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [mode, setMode] = useState("Both");
  const [myLectures, setMyLectures] = useState<any[]>([]);

  // MENTOR FORM
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [maxMentees, setMaxMentees] = useState("3");
  const [myMentor, setMyMentor] = useState<any>(null);

  // DONATION FORM
  const [donationType, setDonationType] = useState("Money");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [equipmentDesc, setEquipmentDesc] = useState("");
  const [scholarshipDesc, setScholarshipDesc] = useState("");
  const [donationMsg, setDonationMsg] = useState("");
  const [myDonations, setMyDonations] = useState<any[]>([]);

 
  useEffect(() => {
    loadUser();
    fetchCommunityContributions();
  }, []);
  const loadUser = async () => {
    const data = await AsyncStorage.getItem("user");
    if (data) {
      const parsed = JSON.parse(data);
      setUser(parsed);
      fetchMyData(parsed.id);
    }
  };

  const fetchMyData = async (id: number) => {
    try {
      const res = await axios.get(`${API}/contributions/all/${id}`);
      if (res.data.success) {
        setMyLectures(res.data.lectures || []);
        setMyMentor(res.data.mentors?.[0] || null);
        setMyDonations(res.data.donations || []);
      }
    } catch (err) { console.log(err); }
  };

  // ── SUBMIT LECTURE ──
  const submitLecture = async () => {
    if (!topic) { Alert.alert("Validation", "Please enter topic"); return; }
    try {
      const res = await axios.post(`${API}/contributions/lecture`, {
        alumni_id: user.id, topic, description,
        available_from: availFrom, available_to: availTo,
        target_batches: selectedBatches.join(", "), mode,
      });
      Alert.alert("Success ✅", res.data.message);
      setTopic(""); setDescription(""); setAvailFrom(""); setAvailTo("");
      setSelectedBatches([]); fetchMyData(user.id);
    } catch (err) { Alert.alert("Error", "Submission failed"); }
  };

  // ── SUBMIT MENTORSHIP ──
  const submitMentor = async () => {
    if (selectedExpertise.length === 0) { Alert.alert("Validation", "Select at least one expertise"); return; }
    try {
      const res = await axios.post(`${API}/contributions/mentor`, {
        alumni_id: user.id,
        expertise: selectedExpertise.join(", "),
        max_mentees: Number(maxMentees),
      });
      Alert.alert("Success ✅", res.data.message);
      fetchMyData(user.id);
    } catch (err) { Alert.alert("Error", "Submission failed"); }
  };

  // ── SUBMIT DONATION ──
  const submitDonation = async () => {
    const finalAmount = customAmount || selectedAmount;
    if (donationType === "Money" && !finalAmount) { Alert.alert("Validation", "Please enter amount"); return; }
    if (donationType === "Equipment" && !equipmentDesc) { Alert.alert("Validation", "Please describe equipment"); return; }
    if (donationType === "Scholarship" && !scholarshipDesc) { Alert.alert("Validation", "Please describe scholarship"); return; }

    try {
      const res = await axios.post(`${API}/contributions/donate`, {
        alumni_id: user.id, donation_type: donationType,
        amount: donationType === "Money" ? Number(finalAmount) : null,
        equipment_description: equipmentDesc,
        scholarship_description: scholarshipDesc,
        message: donationMsg,
      });
      Alert.alert("Success ✅", `${res.data.message}${res.data.receipt_number ? "\nReceipt: " + res.data.receipt_number : ""}`);
      setSelectedAmount(""); setCustomAmount(""); setEquipmentDesc("");
      setScholarshipDesc(""); setDonationMsg(""); fetchMyData(user.id);
    } catch (err) { Alert.alert("Error", "Donation failed"); }
  };

  const toggleChip = (val: string, list: string[], setList: any) => {
    setList((prev: string[]) =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const statusColor = (s: string) => {
    if (s === "Approved") return { bg: "#DCFCE7", text: "#16A34A" };
    if (s === "Rejected") return { bg: "#FEE2E2", text: "#DC2626" };
    return { bg: "#FEF3C7", text: "#D97706" };
  };
  const fetchCommunityContributions = async () => {
    try {
      const res = await axios.get(`${API}/contributions/community`);
  
      if (res.data.success) {
        setCommunityData(res.data.data || []);
      }
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <View style={styles.container}>
     
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.hero}>
          <Text style={styles.heroTitle}>Giving Back 💛</Text>
          <Text style={styles.heroSub}>Lecture • Mentor • Donate — contribute to your alma mater</Text>
        </LinearGradient>

        {/* TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
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
                  <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}>
                    <Text style={{ fontSize: 22 }}>🎤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Offer a Guest Lecture</Text>
                    <Text style={styles.cardSub}>Share your knowledge with current students</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Topic / Subject *</Text>
                <TextInput style={styles.input} placeholder="e.g. Introduction to Cloud Computing" value={topic} onChangeText={setTopic} />

                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput style={[styles.input, { height: 90 }]} placeholder="What will you cover?" multiline value={description} onChangeText={setDescription} />

                <Text style={styles.fieldLabel}>Available Dates</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {Platform.OS === "web" ? (
                    <>
                      <input type="date" value={availFrom} onChange={e => setAvailFrom(e.target.value)}
                        style={{ flex: 1, height: 48, borderRadius: 12, border: "1px solid #e2e8f0", paddingLeft: 12, background: "#f8fafc" }} />
                      <input type="date" value={availTo} onChange={e => setAvailTo(e.target.value)}
                        style={{ flex: 1, height: 48, borderRadius: 12, border: "1px solid #e2e8f0", paddingLeft: 12, background: "#f8fafc" }} />
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
                    <TouchableOpacity key={b}
                      style={[styles.chip, selectedBatches.includes(b) && styles.chipActive]}
                      onPress={() => toggleChip(b, selectedBatches, setSelectedBatches)}
                    >
                      <Text style={[styles.chipText, selectedBatches.includes(b) && styles.chipActiveText]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Mode</Text>
                <View style={styles.chipRow}>
                  {["Online", "Offline", "Both"].map(m => (
                    <TouchableOpacity key={m}
                      style={[styles.chip, mode === m && styles.chipActive]}
                      onPress={() => setMode(m)}
                    >
                      <Text style={[styles.chipText, mode === m && styles.chipActiveText]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={submitLecture}>
                  <Text style={styles.submitText}>Submit for Review →</Text>
                </TouchableOpacity>
              </View>

              {/* MY LECTURES */}
              {myLectures.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>My Submissions</Text>
                  {myLectures.map(item => (
                    <View key={item.id} style={styles.myCard}>
                      <View style={styles.myCardTop}>
                        <Text style={styles.myCardTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status).bg }]}>
                          <Text style={[styles.statusText, { color: statusColor(item.status).text }]}>{item.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.myCardSub}>🎤 Guest Lecture · {item.created_at?.split("T")[0]}</Text>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          {/* ════════ MENTORSHIP ════════ */}
          {activeTab === "Mentorship" && (
            <>
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
                    <Text style={{ fontSize: 22 }}>🧑‍🏫</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Become a Mentor</Text>
                    <Text style={styles.cardSub}>Mark yourself available for 1:1 mentorship sessions</Text>
                  </View>
                </View>

                {myMentor && (
                  <View style={[styles.statusBanner, { backgroundColor: statusColor(myMentor.status).bg }]}>
                    <Text style={{ color: statusColor(myMentor.status).text, fontWeight: "700" }}>
                      Current Status: {myMentor.status}
                    </Text>
                    <Text style={{ color: statusColor(myMentor.status).text, fontSize: 12, marginTop: 2 }}>
                      Expertise: {myMentor.expertise}
                    </Text>
                  </View>
                )}

                <Text style={styles.fieldLabel}>Areas of Expertise *</Text>
                <View style={styles.chipRow}>
                  {EXPERTISE_OPTIONS.map(e => (
                    <TouchableOpacity key={e}
                      style={[styles.chip, selectedExpertise.includes(e) && styles.chipActive]}
                      onPress={() => toggleChip(e, selectedExpertise, setSelectedExpertise)}
                    >
                      <Text style={[styles.chipText, selectedExpertise.includes(e) && styles.chipActiveText]}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Max Mentees at a time</Text>
                <View style={styles.chipRow}>
                  {["1", "2", "3", "5"].map(n => (
                    <TouchableOpacity key={n}
                      style={[styles.chip, maxMentees === n && styles.chipActive]}
                      onPress={() => setMaxMentees(n)}
                    >
                      <Text style={[styles.chipText, maxMentees === n && styles.chipActiveText]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={submitMentor}>
                  <Text style={styles.submitText}>{myMentor ? "Update Mentorship Profile →" : "Register as Mentor →"}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ════════ DONATE ════════ */}
          {activeTab === "Donate" && (
            <>
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <View style={[styles.iconBox, { backgroundColor: "#DCFCE7" }]}>
                    <Text style={{ fontSize: 22 }}>💛</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Make a Donation</Text>
                    <Text style={styles.cardSub}>Money, equipment, or scholarships</Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Donation Type *</Text>
                <View style={styles.chipRow}>
                  {["Money", "Equipment", "Scholarship"].map(t => (
                    <TouchableOpacity key={t}
                      style={[styles.chip, donationType === t && styles.chipActive]}
                      onPress={() => setDonationType(t)}
                    >
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
                        <TouchableOpacity key={a}
                          style={[styles.chip, selectedAmount === a && styles.chipActive]}
                          onPress={() => { setSelectedAmount(a); setCustomAmount(""); }}
                        >
                          <Text style={[styles.chipText, selectedAmount === a && styles.chipActiveText]}>₹{a}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.input} placeholder="Or enter custom amount"
                      keyboardType="numeric" value={customAmount}
                      onChangeText={t => { setCustomAmount(t); setSelectedAmount(""); }}
                    />
                  </>
                )}

                {donationType === "Equipment" && (
                  <>
                    <Text style={styles.fieldLabel}>Equipment Description *</Text>
                    <TextInput style={[styles.input, { height: 90 }]} placeholder="e.g. 10 laptops, model XYZ..." multiline value={equipmentDesc} onChangeText={setEquipmentDesc} />
                  </>
                )}

                {donationType === "Scholarship" && (
                  <>
                    <Text style={styles.fieldLabel}>Scholarship Details *</Text>
                    <TextInput style={[styles.input, { height: 90 }]} placeholder="e.g. ₹50,000 per year for meritorious students..." multiline value={scholarshipDesc} onChangeText={setScholarshipDesc} />
                  </>
                )}

                <Text style={styles.fieldLabel}>Message (optional)</Text>
                <TextInput style={[styles.input, { height: 70 }]} placeholder="Any message for the institute..." multiline value={donationMsg} onChangeText={setDonationMsg} />

                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: "#16A34A" }]} onPress={submitDonation}>
                  <Text style={styles.submitText}>
                    {donationType === "Money" ? "Proceed to Donate →" : "Submit Donation →"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* MY DONATIONS */}
              {myDonations.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>My Donations</Text>
                  {myDonations.map(item => (
                    <View key={item.id} style={styles.myCard}>
                      <View style={styles.myCardTop}>
                        <Text style={styles.myCardTitle}>{item.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status).bg }]}>
                          <Text style={[styles.statusText, { color: statusColor(item.status).text }]}>{item.status}</Text>
                        </View>
                      </View>
                      {item.amount && <Text style={styles.myCardSub}>💰 ₹{item.amount}</Text>}
                      {item.receipt_number && <Text style={styles.myCardSub}>🧾 {item.receipt_number}</Text>}
                    </View>
                  ))}
                </>
              )}
            </>
          )}
{/* ════════ COMMUNITY ════════ */}
{activeTab === "Community" && (
  <>
    {communityData.map((item) => {

const title =
  item.donation_type === "Money"
    ? "Made a Donation"
    : item.donation_type === "Equipment"
    ? "Donated Equipment"
    : "Sponsored Scholarship";

const desc =
  item.donation_type === "Equipment"
    ? item.equipment_description
    : item.donation_type === "Scholarship"
    ? item.scholarship_description
    : item.message;

return (
  <View key={item.id} style={styles.communityCard}>

    {/* USER */}
    <View style={styles.communityTop}>

    {item.profile_photo ? (
  <Image
    source={{ uri: `${API}/uploads/${item.profile_photo}` }}
    style={styles.avatar}
  />
) : (
  <View style={styles.avatar}>
    <Text style={styles.avatarText}>
      {item.full_name?.charAt(0)}
    </Text>
  </View>
)}

      <View style={{ flex: 1 }}>
        <Text style={styles.communityName}>
          {item.full_name}
        </Text>

        <Text style={styles.communityType}>
          {item.designation}
          {item.organisation
            ? ` • ${item.organisation}`
            : ""}
        </Text>
      </View>

    </View>

    {/* TITLE */}
    <Text style={styles.communityTitle}>
      💛 {title}
    </Text>

    {/* DESCRIPTION */}
    {desc ? (
      <Text style={styles.communityDesc}>
        {desc}
      </Text>
    ) : null}

    {/* MONEY */}
    {item.amount ? (
      <Text style={styles.communityAmount}>
        ₹{item.amount}
      </Text>
    ) : null}

    {/* DATE */}
    <Text style={styles.communityDate}>
      {item.created_at?.split("T")[0]}
    </Text>

  </View>
);
})}
  </>
)}
          {/* ════════ MY CONTRIBUTIONS ════════ */}
          {activeTab === "My Contributions" && (
            <>
              {myLectures.length === 0 && !myMentor && myDonations.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={{ fontSize: 48 }}>💛</Text>
                  <Text style={styles.emptyTitle}>No contributions yet</Text>
                  <Text style={styles.emptySub}>Start giving back to your alma mater!</Text>
                </View>
              ) : (
                <>
                  {myLectures.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>🎤 Guest Lectures</Text>
                      {myLectures.map(item => (
                        <View key={item.id} style={styles.myCard}>
                          <View style={styles.myCardTop}>
                            <Text style={styles.myCardTitle} numberOfLines={1}>{item.title}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status).bg }]}>
                              <Text style={[styles.statusText, { color: statusColor(item.status).text }]}>{item.status}</Text>
                            </View>
                          </View>
                          <Text style={styles.myCardSub}>{item.created_at?.split("T")[0]}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {myMentor && (
                    <>
                      <Text style={styles.sectionLabel}>🧑‍🏫 Mentorship</Text>
                      <View style={styles.myCard}>
                        <View style={styles.myCardTop}>
                          <Text style={styles.myCardTitle} numberOfLines={1}>{myMentor.expertise}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: statusColor(myMentor.status).bg }]}>
                            <Text style={[styles.statusText, { color: statusColor(myMentor.status).text }]}>{myMentor.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.myCardSub}>Max {myMentor.max_mentees} mentees</Text>
                      </View>
                    </>
                  )}

                  {myDonations.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>💛 Donations</Text>
                      {myDonations.map(item => (
                        <View key={item.id} style={styles.myCard}>
                          <View style={styles.myCardTop}>
                            <Text style={styles.myCardTitle}>{item.title}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status).bg }]}>
                              <Text style={[styles.statusText, { color: statusColor(item.status).text }]}>{item.status}</Text>
                            </View>
                          </View>
                          {item.amount && <Text style={styles.myCardSub}>₹{item.amount}</Text>}
                          {item.receipt_number && <Text style={styles.myCardSub}>🧾 {item.receipt_number}</Text>}
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  hero: {
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 28,
   
    
  },
  heroTitle: { color: "#fff",   fontSize: Platform.OS === "web" ?35:30, fontWeight: "800" , textAlign: Platform.OS === "web" ?"center":"left",},
  heroSub: { color: "#cbd5e1", fontSize: 14, marginTop: 6 ,textAlign: Platform.OS === "web" ?"center":"left"},
  tabsRow: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4, gap: 10 },
  tabBtn: { backgroundColor: "#E2E8F0", paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14 },
  activeTab: { backgroundColor: "#4F46E5" },
  tabText: { color: "#334155", fontWeight: "700", fontSize: 13 },
  activeTabText: { color: "#fff" },
  content: { padding: 16, paddingBottom: 60 },
  card: {
    backgroundColor: "#fff", borderRadius: 22,
    padding: 18, marginBottom: 14,
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 10,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  cardSub: { fontSize: 13, color: "#64748B", marginTop: 3 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0",
    borderRadius: 14, paddingHorizontal: 14, height: 50,
    fontSize: 14, color: "#111", marginBottom: 12,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  chipActiveText: { color: "#fff" },
  submitBtn: {
    backgroundColor: "#4F46E5", paddingVertical: 15,
    borderRadius: 16, alignItems: "center", marginTop: 6,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#64748B", marginBottom: 10, marginTop: 6 },
  myCard: {
    backgroundColor: "#fff", borderRadius: 16,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#E2E8F0",
  },
  myCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  myCardTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", flex: 1, marginRight: 8 },
  myCardSub: { fontSize: 12, color: "#64748B" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  statusBanner: { borderRadius: 14, padding: 12, marginBottom: 16 },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#64748B", marginTop: 6 },
  communityCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  
  communityTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  
  avatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  
  communityName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  
  communityType: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  
  communityTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  
  communityDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
  },
  
  communityAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#16A34A",
    marginTop: 8,
  },
  
  communityDate: {
    marginTop: 10,
    fontSize: 11,
    color: "#94A3B8",
  },
});