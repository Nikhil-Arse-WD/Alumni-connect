import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import Footer from "../components/Footer";

export default function ContactScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const isWeb = width >= 768;

  const CONTACTS = [
    {
      name: "Mr. Sujeet Singhal",
      role: "Contact Person",
      phone: "+91 9753545667",
      whatsapp: "919753545667",
      location: "Indore, MP",
      color: ["#4F46E5", "#7C3AED"],
    },
    {
      name: "Mr. Upendra Jain",
      role: "Contact Person",
      phone: "+91 9827044274",
      whatsapp: "919827044274",
      location: "Indore, MP",
      color: ["#EC4899", "#DB2777"],
    },
  ];

  const REASONS = [
    "General Inquiry",
    "Alumni Event",
    "Membership",
    "Career / Job Help",
    "Other",
  ];

  // ---- FORM MODAL STATE ----
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [reason, setReason] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [focusedField, setFocusedField] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const MAX_MESSAGE_LEN = 300;

  const requiredFilled =
    userName.trim().length > 0 &&
    userLocation.trim().length > 0 &&
    reason.length > 0 &&
    userQuery.trim().length > 0;

  const completedCount = [
    userName.trim().length > 0,
    userLocation.trim().length > 0,
    reason.length > 0,
    userQuery.trim().length > 0,
  ].filter(Boolean).length;

  const openWhatsappForm = (contact: any) => {
    setSelectedContact(contact);
    setUserName("");
    setBatchYear("");
    setContactInfo("");
    setUserLocation("");
    setReason("");
    setUserQuery("");
    setErrorMsg("");
    setFocusedField("");
    setSending(false);
    setSent(false);
    successAnim.setValue(0);
    setModalVisible(true);

    scaleAnim.setValue(0.9);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => setModalVisible(false));
  };

  const handleSendWhatsapp = () => {
    if (!requiredFilled) {
      setErrorMsg("Please fill all required fields marked with *");
      return;
    }
    setErrorMsg("");
    setSending(true);

    const message =
      `Hello ${selectedContact.name},\n\n` +
      `*New Inquiry via Alumni Portal*\n` +
      `Name: ${userName}\n` +
      (batchYear.trim() ? `Batch Year: ${batchYear}\n` : "") +
      (contactInfo.trim() ? `Contact: ${contactInfo}\n` : "") +
      `Location: ${userLocation}\n` +
      `Reason: ${reason}\n\n` +
      `Message:\n${userQuery}`;

    const url = `https://wa.me/${selectedContact.whatsapp}?text=${encodeURIComponent(
      message
    )}`;

    // brief interactive feedback before handing off to WhatsApp
    setTimeout(() => {
      setSending(false);
      setSent(true);
      Animated.spring(successAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Linking.openURL(url);
        closeModal();
      }, 700);
    }, 500);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO */}
      <LinearGradient
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.hero,
          isWeb && styles.heroWeb,
        ]}
      >
        <View style={styles.heroBadge}>
          <Ionicons
            name="mail-open-outline"
            size={20}
            color="#fff"
          />
          <Text style={styles.heroBadgeText}>
            CONTACT SUPPORT
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          Get In Touch
        </Text>

        <Text style={styles.heroText}>
          We’d love to hear from you. Reach out anytime for
          alumni support, events, guidance, or collaboration.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Support</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2+</Text>
            <Text style={styles.statLabel}>Contacts</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>
      </LinearGradient>

      {/* INTRO */}
      <View style={styles.introCard}>
        <Ionicons
          name="information-circle-outline"
          size={24}
          color="#4F46E5"
        />

        <Text style={styles.introText}>
          If you have any questions, suggestions, or need
          assistance regarding the Alumni Portal, feel free
          to contact our support team.
        </Text>
      </View>

      {/* CONTACTS */}
      <View
        style={[
          styles.contactWrapper,
          isWeb && styles.contactWrapperWeb,
        ]}
      >
        {CONTACTS.map((item, index) => (
          <LinearGradient
            key={index}
            colors={item.color as any}
            style={[
              styles.contactCard,
              isWeb && styles.contactCardWeb,
            ]}
          >
            <View style={styles.contactTop}>
              <View style={styles.avatar}>
                <Ionicons
                  name="person"
                  size={28}
                  color="#fff"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>
                  {item.name}
                </Text>

                <Text style={styles.contactRole}>
                  {item.role}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                Linking.openURL(`tel:${item.phone}`)
              }
            >
              <Ionicons
                name="call-outline"
                size={18}
                color="#fff"
              />

              <Text style={styles.actionText}>
                {item.phone}
              </Text>
            </TouchableOpacity>

            {/* WHATSAPP -> OPENS PROFESSIONAL INQUIRY FORM */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openWhatsappForm(item)}
            >
              <Ionicons
                name="logo-whatsapp"
                size={18}
                color="#fff"
              />

              <Text style={styles.actionText}>
                WhatsApp Chat
              </Text>
            </TouchableOpacity>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#fff"
              />

              <Text style={styles.locationText}>
                {item.location}
              </Text>
            </View>
          </LinearGradient>
        ))}
      </View>

      {/* INFO GRID */}
      <View
        style={[
          styles.infoGrid,
          isWeb && styles.infoGridWeb,
        ]}
      >
        {/* EMAIL */}
        <View
          style={[
            styles.infoCard,
            isWeb && styles.infoCardWeb,
          ]}
        >
          <View style={styles.infoIcon}>
            <Ionicons
              name="mail-outline"
              size={26}
              color="#4F46E5"
            />
          </View>

          <Text style={styles.infoTitle}>
            Email Us
          </Text>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                "mailto:svimaa@svimi.org"
              )
            }
          >
            <Text style={styles.infoLink}>
              svimaa@svimi.org
            </Text>
          </TouchableOpacity>
        </View>

        {/* HOURS */}
        <View
          style={[
            styles.infoCard,
            isWeb && styles.infoCardWeb,
          ]}
        >
          <View style={styles.infoIcon}>
            <Ionicons
              name="time-outline"
              size={26}
              color="#EC4899"
            />
          </View>

          <Text style={styles.infoTitle}>
            Office Hours
          </Text>

          <Text style={styles.infoText}>
            Monday - Friday
          </Text>

          <Text style={styles.infoSub}>
            9:00 AM - 6:00 PM
          </Text>

          <Text style={[styles.infoText, { marginTop: 10 }]}>
            Saturday
          </Text>

          <Text style={styles.infoSub}>
            10:00 AM - 4:00 PM
          </Text>

          <Text style={styles.closedText}>
            Sunday Closed
          </Text>
        </View>

        {/* LOCATION */}
        <View
          style={[
            styles.infoCard,
            isWeb && styles.infoCardWeb,
          ]}
        >
          <View style={styles.infoIcon}>
            <Ionicons
              name="location-outline"
              size={26}
              color="#16A34A"
            />
          </View>

          <Text style={styles.infoTitle}>
            Visit Us
          </Text>

          <Text style={styles.infoText}>
            SVIM Alumni Association
          </Text>

          <Text style={styles.infoSub}>
            Indore, MP - 452001
          </Text>

          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() =>
              Linking.openURL(
                "https://www.google.com/maps/dir/?api=1&destination=Shri+Vaishnav+Institute+of+Management+%26+Sciences+Indore"
              )
            }
          >
            <Ionicons
              name="navigate-outline"
              size={18}
              color="#fff"
            />

            <Text style={styles.mapText}>
              Get Directions
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CTA */}
      <LinearGradient
        colors={["#4F46E5", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cta}
      >
        <Text style={styles.ctaTitle}>
          Stay Connected With Alumni Network
        </Text>

        <Text style={styles.ctaText}>
          Join discussions, attend events, and build your
          professional community.
        </Text>

        <TouchableOpacity style={styles.ctaBtn} onPress={()=> router.push("/")}>
          <Text style={styles.ctaBtnText}>
            Explore Community
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <Footer />

      {/* ---- WHATSAPP QUERY FORM MODAL ---- */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollWrap}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalCard}>
              {/* HEADER */}
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalIconCircle}>
                  <Ionicons name="logo-whatsapp" size={22} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    Contact {selectedContact?.name}
                  </Text>
                  <Text style={styles.modalSub}>
                    Fill in your details to send a WhatsApp message
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* FULL NAME */}
              <Text style={styles.fieldLabel}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color="#94A3B8" />
                <TextInput
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={userName}
                  onChangeText={setUserName}
                  style={styles.inputField}
                />
              </View>

              {/* BATCH + CONTACT ROW */}
              <View style={styles.fieldRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Batch Year</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="school-outline" size={18} color="#94A3B8" />
                    <TextInput
                      placeholder="e.g. 2018"
                      placeholderTextColor="#94A3B8"
                      value={batchYear}
                      onChangeText={setBatchYear}
                      keyboardType="numeric"
                      maxLength={4}
                      style={styles.inputField}
                    />
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>Email / Phone</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="at-outline" size={18} color="#94A3B8" />
                    <TextInput
                      placeholder="Optional"
                      placeholderTextColor="#94A3B8"
                      value={contactInfo}
                      onChangeText={setContactInfo}
                      style={styles.inputField}
                    />
                  </View>
                </View>
              </View>

              {/* LOCATION */}
              <Text style={styles.fieldLabel}>
                City / Location <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons name="location-outline" size={18} color="#94A3B8" />
                <TextInput
                  placeholder="e.g. Indore, MP"
                  placeholderTextColor="#94A3B8"
                  value={userLocation}
                  onChangeText={setUserLocation}
                  style={styles.inputField}
                />
              </View>

              {/* REASON CHIPS */}
              <Text style={styles.fieldLabel}>
                Reason for Contact <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.chipWrap}>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setReason(r)}
                    style={[
                      styles.chip,
                      reason === r && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        reason === r && styles.chipTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* MESSAGE */}
              <Text style={styles.fieldLabel}>
                Your Message <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                  placeholder="What would you like to ask or discuss?"
                  placeholderTextColor="#94A3B8"
                  value={userQuery}
                  onChangeText={setUserQuery}
                  multiline
                  numberOfLines={4}
                  style={[styles.inputField, styles.textArea]}
                />
              </View>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* ACTIONS */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSendWhatsapp}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Send Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    marginBottom: Platform.OS === "web" ?0:50
  },

  // HERO
  hero: {
    paddingTop: Platform.OS === "web" ? 20 : 30,
    paddingBottom: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    alignItems: "center",
  },

  heroWeb: {
    minHeight: 420,
    justifyContent: "center",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 22,
  },

  heroBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  heroTitle: {
    fontSize: Platform.OS === "web" ? 54 : 38,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },

  heroText: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 700,
  },

  heroStats: {
    flexDirection: "row",
    gap: 14,
    marginTop: 32,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  statCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 100,
  },

  statNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },

  statLabel: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    fontSize: 12,
  },

  // INTRO
  introCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: -28,
    borderRadius: 22,
    padding: 22,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  introText: {
    flex: 1,
    color: "#475569",
    lineHeight: 24,
    fontSize: 14,
  },

  // CONTACTS
  contactWrapper: {
    paddingHorizontal: 18,
    marginTop: 28,
  },

  contactWrapperWeb: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
  },

  contactCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
  },

  contactCardWeb: {
    flex: 1,
    maxWidth: 500,
  },

  contactTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  contactName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  contactRole: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontSize: 13,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 10,
  },

  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },

  locationText: {
    color: "#fff",
    fontSize: 14,
  },

  // INFO GRID
  infoGrid: {
    paddingHorizontal: 18,
    marginTop: 6,
    marginBottom: 20,
  },

  infoGridWeb: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    justifyContent: "center",
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 24,
    marginBottom: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  infoCardWeb: {
    width: 340,
    marginBottom: 0,
  },

  infoIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  infoTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 14,
  },

  infoText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },

  infoSub: {
    color: "#64748B",
    marginTop: 4,
    fontSize: 14,
  },

  infoLink: {
    color: "#4F46E5",
    fontWeight: "700",
    fontSize: 15,
  },

  closedText: {
    color: "#DC2626",
    marginTop: 10,
    fontWeight: "700",
  },

  mapBtn: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
  },

  mapText: {
    color: "#fff",
    fontWeight: "800",
  },

  // CTA
  cta: {
    marginHorizontal: 18,
    marginBottom: 28,
    borderRadius: 30,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  ctaTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },

  ctaText: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 24,
    maxWidth: 650,
  },

  ctaBtn: {
    backgroundColor: "#fff",
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
  },

  ctaBtnText: {
    color: "#4F46E5",
    fontWeight: "800",
    fontSize: 15,
  },

  // ---- MODAL STYLES ----
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollWrap: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 24,
    width: "100%",
    maxWidth: 460,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  modalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  modalSub: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },
  closeBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  required: {
    color: "#DC2626",
  },
  fieldRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
    backgroundColor: "#F8FAFC",
  },
  inputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
    outlineStyle:"None",
  }as any,
  textAreaWrap: {
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  textArea: {
    textAlignVertical: "top",
    minHeight: 90,
    paddingTop: 10,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 30,
    backgroundColor: "#F8FAFC",
  },
  chipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  chipText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#4F46E5",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 14,
  },
  submitBtn: {
    flex: 1.4,
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});