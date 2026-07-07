// ======================================================
// Paybanner.tsx
// Order Review and Secure Checkout Pipeline for Ad Banners
// Route: app/(tab)/Paybanner.tsx
// Navigate with params: { id, amount, title }
// ======================================================

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import * as ExpoLinking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const isWeb = Platform.OS === "web";

const showAlert = (title: string, msg: string) =>
  isWeb ? window.alert(`${title}\n${msg}`) : Alert.alert(title, msg);

export default function PayBannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; amount: string; title: string }>();
  const { width } = useWindowDimensions();
  const isWebLayout = width >= 768;

  // ── Connection & Setup States ──
  const [envConfigError, setEnvConfigError] = useState(false);
  const [paramError, setParamError] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [paying, setPaying] = useState(false);

  // User details cache needed for Easebuzz validation tokens
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    email: string;
    mobile: string;
  } | null>(null);

  // ── Verify System and Parameters on Mount ──
  useEffect(() => {
    if (!API_BASE) {
      setEnvConfigError(true);
      setIsLoadingUser(false);
      return;
    }

    if (!params.id || !params.amount || !params.title) {
      setParamError(true);
      setIsLoadingUser(false);
      return;
    }

    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUserProfile(JSON.parse(storedUser));
        } else {
          setUserProfile({ full_name: "Alumni Member", email: "alumni@svimsaa.com", mobile: "9999999999" });
        }
      } catch (err) {
        console.error("Session fetch failed:", err);
      } finally {
        setIsLoadingUser(false);
      }
    })();
  }, [params.id, params.amount, params.title]);

  // ── Secure Easebuzz Gateway Transaction Dispatcher ──
  const handleSecurePayment = async () => {
    if (envConfigError || paramError || !userProfile) return;
    
    try {
      setPaying(true);

      const returnUrl = ExpoLinking.createURL("/mybanner");
      const safeName = userProfile.full_name.trim().replace(/[^a-zA-Z\s]/g, "").slice(0, 50) || "Alumni";
      const safePhone = userProfile.mobile.replace(/\D/g, "").slice(-10) || "9999999999";

      const response = await axios.post(`${API_BASE}/pay/initiate`, {
        amount: parseFloat(params.amount),
        firstname: safeName,
        email: userProfile.email.trim(),
        phone: safePhone,
        productinfo: `Ad Slot Placement Fee: ${params.title.slice(0, 30)}`,
        payment_type: "BAN", 
        reference_id: params.id, 
        return_url: returnUrl
      });

      if (response.data && response.data.checkout_url) {
        const checkoutUrl = response.data.checkout_url;

        if (isWeb) {
          // ── WEB: Open Mini Window Popup ──
          const width = 500; const height = 750;
          const left = (window.innerWidth - width) / 2;
          const top = (window.innerHeight - height) / 2;
          const popup = window.open(checkoutUrl, "Payment", `width=${width},height=${height},left=${left},top=${top}`);

          const handleMessage = (event: any) => {
            if (event.data?.type === 'PAYMENT_RETURN') {
              window.removeEventListener('message', handleMessage);
              setPaying(false);
              
              if (event.data.status === 'success') {
                showAlert("Payment Successful! ✅", "Your placement fee has been processed and your banner is now live on the Home page.");
                router.replace("/mybanner");
              } else {
                showAlert("Transaction Failed", "The payment was incomplete. Please retry.");
              }
            }
          };
          window.addEventListener('message', handleMessage);

          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              setPaying(false);
              window.removeEventListener('message', handleMessage);
            }
          }, 1000);

        } else {
          // ── MOBILE: In-App Browser with Deep Link Parsing ──
          const browserResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
          setPaying(false);

          if (browserResult.type === 'success' && browserResult.url) {
            const parsed = ExpoLinking.parse(browserResult.url);
            if (parsed.queryParams?.status === 'success') {
              showAlert("Payment Successful! ✅", "Your placement fee has been processed and your banner is now live on the Home page.");
              router.replace("/mybanner");
            } else {
              showAlert("Transaction Failed", "The payment was incomplete. Please retry.");
            }
          } else {
            showAlert("Payment Cancelled", "You closed the gateway before completing the payment.");
          }
        }
      } else {
        throw new Error("Invalid payload mapping token returned from core api server.");
      }
    } catch (error: any) {
      // ── FIXED CATCH BLOCK ──
      setPaying(false);
      const errMsg = error?.response?.data?.message || error?.message || "Gateway handshake link loss.";
      showAlert("Checkout Routing Error", errMsg);
    }
  };

  if (envConfigError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={54} color="#EF4444" />
        <Text style={styles.errorTitle}>Configuration Mismatch</Text>
        <Text style={styles.errorSub}>The backend endpoint variable is undefined. Please ensure EXPO_PUBLIC_API_BASE is properly mapped inside your root environment configuration file.</Text>
      </View>
    );
  }

  if (paramError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={54} color="#F59E0B" />
        <Text style={styles.errorTitle}>Invoice Record Missing</Text>
        <Text style={styles.errorSub}>Unable to load checkout context. The target invoice unique parameter references are missing or corrupted.</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoadingUser) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loaderTxt}>Generating checkout statement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Billing Summary</Text>
              <Text style={styles.headerSub}>Verify payment requirements before checkout</Text>
            </View>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Placement Fee</Text>
            <Text style={styles.amountValue}>₹{parseFloat(params.amount || "0").toLocaleString("en-IN")}.00</Text>
          </View>
        </LinearGradient>

        <View style={[styles.contentWrapper, isWebLayout && styles.webContentBox]}>
          
          <Text style={styles.sectionTitle}>Asset & Slot Allocation Details</Text>
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Advertisement Reference</Text>
              <Text style={styles.invoiceValue} numberOfLines={1}>{params.title}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Application Registry ID</Text>
              <Text style={[styles.invoiceValue, styles.mono]}>#B-00{params.id}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Billed Recipient</Text>
              <Text style={styles.invoiceValue}>{userProfile?.full_name}</Text>
            </View>
            <View style={[styles.invoiceRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.invoiceLabel}>Secure Gateway Routing</Text>
              <Text style={styles.invoiceValue}>Easebuzz Sandbox Pipeline</Text>
            </View>
          </View>

          <View style={styles.complianceBox}>
            <Ionicons name="shield-checkmark" size={18} color="#16A34A" style={{ marginTop: 2 }} />
            <Text style={styles.complianceTxt}>
              This network link utilizes end-to-end cryptographic SHA-512 authentication signatures. Your standard financial credentials are encrypted safely off-device and are never processed locally.
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.payBtn, paying && styles.payBtnDisabled]} 
            onPress={handleSecurePayment} 
            disabled={paying} 
            activeOpacity={0.85}
          >
            <LinearGradient colors={["#312EBA", "#5B21B6", "#EC1D8F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtnInner}>
              {paying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={18} color="#fff" />
                  <Text style={styles.payBtnTxt}>Proceed to Secure Payment Terminal</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loaderWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" },
  loaderTxt: { marginTop: 14, color: "#64748B", fontSize: 15, fontWeight: "500" },

  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 36 },
  headerTopRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 4, fontWeight: "500" },

  amountBox: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  amountLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  amountValue: { fontSize: 36, color: "#fff", fontWeight: "900", marginTop: 4, letterSpacing: -0.5 },

  contentWrapper: { padding: 16 },
  webContentBox: { maxWidth: 640, alignSelf: "center", width: "100%", paddingVertical: 24 },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, paddingHorizontal: 4 },
  invoiceCard: { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#0F172A", shadowOpacity: 0.03, shadowRadius: 8, elevation: 1, marginBottom: 16 },
  invoiceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", gap: 16 },
  invoiceLabel: { fontSize: 13.5, color: "#64748B", fontWeight: "500" },
  invoiceValue: { fontSize: 14, color: "#0F172A", fontWeight: "700", flex: 1, textAlign: "right" },
  mono: { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontSize: 13, color: "#4F46E5" },

  complianceBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#DCFCE7", padding: 14, borderRadius: 14, marginBottom: 24 },
  complianceTxt: { flex: 1, fontSize: 12, color: "#166534", lineHeight: 18, fontWeight: "500" },

  payBtn: { borderRadius: 16, overflow: "hidden", shadowColor: "#4F46E5", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  payBtnDisabled: { opacity: 0.6 },
  payBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  payBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15.5 },

  errorContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 32, textAlign: "center" as any },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20, maxWidth: 420 },
  errorBtn: { marginTop: 24, backgroundColor: "#0F172A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  errorBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 }
});