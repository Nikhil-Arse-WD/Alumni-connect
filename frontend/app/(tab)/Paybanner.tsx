import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;

export default function PayBannerScreen() {
  const router = useRouter();
  const { id, amount, title } = useLocalSearchParams<{ id: string; amount: string; title: string }>();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // ── FOOLPROOF VERIFICATION LOGIC ──
  const verifyStatusWithServer = async (txnid: string) => {
    setVerifying(true);
    try {
      const res = await axios.get(`${API_BASE}/pay/verify/${txnid}`);
      if (res.data.status === 'Success') {
        const title = "Payment Successful";
        const msg = "Your banner is live!";
        if (Platform.OS === "web") {
          window.alert(`${title}\n${msg}`);
          router.replace("/mybanner" as any);
        } else {
          Alert.alert(title, msg, [
            { text: "OK", onPress: () => router.replace("/mybanner" as any) }
          ]);
        }
      } else {
        Alert.alert("Payment Status", "Payment is still " + res.data.status + ". Please wait a moment.");
      }
    } catch (e) {
      Alert.alert("Verification Error", "Could not verify payment status.");
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const user = await AsyncStorage.getItem("user");
      const uData = user ? JSON.parse(user) : {};

      const safeName = (uData.full_name || "Alumni").trim().replace(/[^a-zA-Z\s]/g, "").slice(0, 50);
      const safePhone = uData.mobile ? uData.mobile.replace(/\D/g, "").slice(-10) : "9999999999";

      const returnUrl = Platform.OS === 'web' ? window.location.href : ExpoLinking.createURL("");

      const res = await axios.post(`${API_BASE}/pay/initiate`, {
        amount,
        firstname: safeName,
        email: uData.email,
        phone: safePhone,
        productinfo: title,
        payment_type: "BAN",
        reference_id: id,
        return_url: returnUrl 
      });

      if (res.data.success) {
        if (Platform.OS === 'web') {
          const handleMessage = (event: any) => {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (data.type === 'PAYMENT_RETURN') {
              window.removeEventListener("message", handleMessage);
              if (data.status === 'success') {
                verifyStatusWithServer(res.data.txnid);
              } else {
                Alert.alert("Payment Failed", "Transaction was cancelled.");
              }
            }
          };
          window.addEventListener("message", handleMessage);
          window.open(res.data.checkout_url, "_blank", "width=600,height=700");
        } else {
          const browserResult = await WebBrowser.openAuthSessionAsync(res.data.checkout_url, returnUrl);
          
          if (browserResult.type === 'success' && browserResult.url) {
            const parsed = ExpoLinking.parse(browserResult.url);
            if (parsed.queryParams?.status === 'success') {
              verifyStatusWithServer(res.data.txnid);
            } else {
              Alert.alert("Payment Failed", "Transaction was cancelled or failed.");
            }
          } else {
            Alert.alert("Payment Cancelled", "You closed the gateway before completing the payment.");
          }
        }
      }
    } catch (err) {
      Alert.alert("Error", "Could not initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.label}>Order Summary</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Banner Title</Text><Text style={styles.summaryValue}>{title}</Text></View>
          <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>Amount Payable</Text><Text style={styles.totalValue}>₹{amount}</Text></View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark" size={20} color="#4F46E5" />
            <Text style={styles.infoText}>Secure payment processing via our gateway.</Text>
          </View>

          <TouchableOpacity 
            style={[styles.payBtn, (loading || verifying) && { opacity: 0.7 }]} 
            onPress={handlePayment}
            disabled={loading || verifying}
          >
            {loading || verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Proceed to Secure Payment</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { padding: 24, paddingTop: 10, paddingBottom: 40, flexDirection: "row", alignItems: "center", gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#fff" },
  scroll: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#F1F5F9" },
  label: { fontSize: 13, fontWeight: "800", color: "#64748B", marginBottom: 20, textTransform: "uppercase" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryLabel: { fontSize: 15, color: "#475569" },
  summaryValue: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  totalValue: { fontSize: 20, fontWeight: "900", color: "#4F46E5" },
  infoBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#EEF2FF", padding: 14, borderRadius: 14, marginVertical: 24 },
  infoText: { fontSize: 13, color: "#4338CA", fontWeight: "600", flex: 1 },
  payBtn: { backgroundColor: "#4F46E5", paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  payBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});