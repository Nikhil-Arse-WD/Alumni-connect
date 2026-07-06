// ======================================================
// paybanner.tsx
// DEMO payment screen — koi real gateway nahi, sirf
// simulation. Submit karte hi banner auto-approve ho jata hai.
// Route: app/paybanner.tsx
// Navigate with params: { id, amount, title }
// ======================================================

import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const API = "http://10.254.25.118:2000";
const isWeb = Platform.OS === "web";

const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

type Mode = "card" | "upi";

export default function PayBannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; amount: string; title: string }>();

  const [mode, setMode] = useState<Mode>("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatCardNumber = (t: string) => {
    const digits = t.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (t: string) => {
    const digits = t.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const validate = () => {
    if (mode === "upi") {
      if (!upiId.includes("@")) {
        showAlert("Invalid UPI ID", "Please enter a valid UPI ID, e.g. yourname@upi");
        return false;
      }
    } else {
      if (cardNumber.replace(/\s/g, "").length < 16) {
        showAlert("Invalid Card", "Please enter a valid 16-digit card number");
        return false;
      }
      if (!cardName.trim()) {
        showAlert("Missing Name", "Please enter the name on card");
        return false;
      }
      if (expiry.length < 5) {
        showAlert("Invalid Expiry", "Please enter expiry as MM/YY");
        return false;
      }
      if (cvv.length < 3) {
        showAlert("Invalid CVV", "Please enter a valid CVV");
        return false;
      }
    }
    return true;
  };

  const handlePay = async () => {
    if (!validate()) return;
    try {
      setPaying(true);
      // ── DEMO ONLY — koi real gateway call nahi ho raha ──
      await new Promise(r => setTimeout(r, 1400)); // fake "processing" delay
      await axios.put(`${API}/banner-request/demo-pay/${params.id}`);
      setSuccess(true);
    } catch {
      showAlert("Payment Failed", "Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={44} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSub}>
          ₹{params.amount} paid for "{params.title}". Your banner is now approved and live on the Home page.
        </Text>
        <TouchableOpacity style={styles.successBtn} onPress={() => router.replace("/mybanner")} activeOpacity={0.88}>
          <Text style={styles.successBtnTxt}>View My Requests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Complete Payment</Text>
              <Text style={styles.headerSub}>Banner: {params.title}</Text>
            </View>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amountValue}>₹{params.amount}</Text>
          </View>
        </LinearGradient>

        <View style={styles.demoNotice}>
          <Ionicons name="information-circle-outline" size={16} color="#B45309" />
          <Text style={styles.demoNoticeTxt}>
            This is a demo payment screen for testing. No real transaction will occur — any details you enter are not sent anywhere.
          </Text>
        </View>

        <View style={styles.content}>
          {/* Mode switch */}
          <View style={styles.modeRow}>
            <TouchableOpacity style={[styles.modeBtn, mode === "upi" && styles.modeBtnOn]} onPress={() => setMode("upi")}>
              <Ionicons name="phone-portrait-outline" size={16} color={mode === "upi" ? "#4F46E5" : "#64748B"} />
              <Text style={[styles.modeTxt, mode === "upi" && styles.modeTxtOn]}>UPI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, mode === "card" && styles.modeBtnOn]} onPress={() => setMode("card")}>
              <Ionicons name="card-outline" size={16} color={mode === "card" ? "#4F46E5" : "#64748B"} />
              <Text style={[styles.modeTxt, mode === "card" && styles.modeTxtOn]}>Card</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {mode === "upi" ? (
              <View>
                <Text style={styles.label}>UPI ID</Text>
                <TextInput
                  style={styles.input}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="yourname@upi"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={styles.label}>Card Number</Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={t => setCardNumber(formatCardNumber(t))}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                </View>
                <View>
                  <Text style={styles.label}>Name on Card</Text>
                  <TextInput
                    style={styles.input}
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder="John Doe"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Expiry</Text>
                    <TextInput
                      style={styles.input}
                      value={expiry}
                      onChangeText={t => setExpiry(formatExpiry(t))}
                      placeholder="MM/YY"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cvv}
                      onChangeText={t => setCvv(t.replace(/\D/g, "").slice(0, 3))}
                      placeholder="123"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={3}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.payBtn, paying && { opacity: 0.75 }]} onPress={handlePay} disabled={paying} activeOpacity={0.88}>
            <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtnInner}>
              {paying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="lock-closed-outline" size={16} color="#fff" />
                  <Text style={styles.payBtnTxt}>Pay ₹{params.amount}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === "ios" ? 54 : 20, paddingBottom: 24 },
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.72)", marginTop: 2 },

  amountBox: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  amountLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  amountValue: { fontSize: 30, color: "#fff", fontWeight: "900", marginTop: 4 },

  demoNotice: { flexDirection: "row", gap: 8, backgroundColor: "#FEF3C7", margin: 16, marginBottom: 4, padding: 12, borderRadius: 12, alignItems: "flex-start" },
  demoNoticeTxt: { flex: 1, fontSize: 11.5, color: "#92400E", lineHeight: 16 },

  content: { padding: 16 },

  modeRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", backgroundColor: "#fff" },
  modeBtnOn: { borderColor: "#4F46E5", backgroundColor: "#EEF2FF" },
  modeTxt: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  modeTxtOn: { color: "#4F46E5" },

  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 20 },
  label: { fontSize: 12.5, fontWeight: "700", color: "#475569", marginBottom: 6 },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 14, color: "#111" },

  payBtn: { borderRadius: 16, overflow: "hidden" },
  payBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  payBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },

  successWrap: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", padding: 30 },
  successIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: "#16A34A", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: "900", color: "#0F172A", marginBottom: 8 },
  successSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20, marginBottom: 28 },
  successBtn: { backgroundColor: "#4F46E5", paddingHorizontal: 26, paddingVertical: 14, borderRadius: 14 },
  successBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});