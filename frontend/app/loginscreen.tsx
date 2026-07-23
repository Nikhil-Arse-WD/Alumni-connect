import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Bind to Environment Variables ──
const API_BASE = process.env.EXPO_PUBLIC_API_BASE;
const USER_API = `${API_BASE}/login`;
const ADMIN_API = `${API_BASE}/admin/login`;
const isWeb = Platform.OS === "web";

const showAlert = (title: string, message: string) => {
  if (isWeb) {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

// ── Strict TypeScript Interface for Form Props ──
interface FormContentProps {
  form: { email: string; password: string };
  handleChange: (key: string, value: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  selectedRole: "user" | "admin";
  setSelectedRole: (role: "user" | "admin") => void;
  handleLogin: () => void;
  loading: boolean;
  router: any;
}

function FormContent({
  form,
  handleChange,
  showPassword,
  setShowPassword,
  selectedRole,
  setSelectedRole,
  handleLogin,
  loading,
  router,
}: FormContentProps) {
  return (
    <>
      {/* ── ROLE TOGGLE ── */}
      <View style={styles.toggleWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.roleButton, selectedRole === "user" && styles.activeButton]}
          onPress={() => setSelectedRole("user")}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={selectedRole === "user" ? "#fff" : "#4F46E5"}
          />
          <Text style={[styles.roleText, selectedRole === "user" && styles.activeRoleText]}>
            Alumni
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.roleButton, selectedRole === "admin" && styles.activeButton]}
          onPress={() => setSelectedRole("admin")}
        >
          <MaterialCommunityIcons
            name="shield-crown-outline"
            size={18}
            color={selectedRole === "admin" ? "#fff" : "#4F46E5"}
          />
          <Text style={[styles.roleText, selectedRole === "admin" && styles.activeRoleText]}>
            Admin
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── EMAIL ── */}
      <Text style={styles.label}>Email Address</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#94A3B8" />
        <TextInput
          placeholder="you@example.com"
          placeholderTextColor="#94A3B8"
          value={form.email}
          onChangeText={(t) => handleChange("email", t)}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* ── PASSWORD ── */}
      <Text style={[styles.label, { marginTop: 18 }]}>Password</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
        <TextInput
          placeholder="Enter your password"
          placeholderTextColor="#94A3B8"
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={(t) => handleChange("password", t)}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </View>

      {/* ── LOGIN BUTTON ── */}
      <TouchableOpacity
        style={[styles.loginButton, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.loginText}>
          {loading ? "Authenticating..." : `Sign in as ${selectedRole === 'user' ? 'Alumni' : 'Admin'}`}
        </Text>
      </TouchableOpacity>

      {/* ── REGISTER HINT ── */}
      {selectedRole === "user" && (
        <TouchableOpacity style={styles.registerBtn} onPress={() => router.push("/register")} activeOpacity={0.7}>
          <Text style={styles.registerHint}>
            Don't have an account? <Text style={styles.registerText}>Register Here</Text>
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWebLayout = width >= 850;

  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const { setUser } = useUser();

  const handleChange = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      showAlert("Missing Information", "Please enter both your email and password.");
      return;
    }

    try {
      setLoading(true);
      const API = selectedRole === "admin" ? ADMIN_API : USER_API;
      const res = await axios.post(API, { email: form.email.trim(), password: form.password });

      if (!res.data.success) {
        showAlert("Access Denied", res.data.message);
        return;
      }

      const data = selectedRole === "admin" ? res.data.admin : res.data.user;

      // Ensure proper role segregation in memory
      if (selectedRole === "admin") {
        await AsyncStorage.setItem("admin", JSON.stringify(data));
      } else {
        await AsyncStorage.setItem("user", JSON.stringify(data));
        setUser(data);
      }

      await AsyncStorage.setItem("token", res.data.token || "dummy-token");
      await AsyncStorage.setItem("userEmail", data.email);

      // ───────────────────────────────────────────────────────────────
      // First-login password change check (user role only)
      // ───────────────────────────────────────────────────────────────
      if (selectedRole === "user" && data.is_password_changed === 0) {
        router.replace("/change_password");
      } else {
        router.replace(selectedRole === "admin" ? "/admin/dashboard" : "/(tab)");
      }
    } catch (error: any) {
      showAlert("Login Failed", error?.response?.data?.message || "Unable to connect to the server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Missing System Error Screen ──
  if (!API_BASE) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={54} color="#EF4444" />
        <Text style={styles.errorTitle}>Configuration Mismatch</Text>
        <Text style={styles.errorSub}>The backend endpoint variable is undefined. Please ensure EXPO_PUBLIC_API_BASE is properly mapped inside your root environment configuration file.</Text>
      </View>
    );
  }

  // ================= WEB LAYOUT =================
  if (isWebLayout) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.webScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.webCard}>
            {/* LEFT SIDE (Branding) */}
            <View style={styles.leftSide}>
              <View style={styles.leftIconBg}>
                <Image source={require("../assets/Alumni_Pics/logo.png")} style={styles.logoImg} resizeMode="contain" />
              </View>
              <Text style={styles.webTitle}>SVIMAA Connect</Text>
              <Text style={styles.webSub}>
                Bridging the gap between students,{'\n'}alumni, and administration in one unified platform.
              </Text>
            </View>

            {/* RIGHT SIDE (Form) */}
            <View style={styles.rightSide}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={44} color="#4F46E5" />
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to your account to continue</Text>

              <FormContent
                form={form} handleChange={handleChange}
                showPassword={showPassword} setShowPassword={setShowPassword}
                selectedRole={selectedRole} setSelectedRole={setSelectedRole}
                handleLogin={handleLogin} loading={loading} router={router}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ================= MOBILE LAYOUT =================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.mobileScroll}
        >
          <View style={styles.mobileHero}>
            <View style={styles.mobileAvatar}>
              <Image source={require("../assets/Alumni_Pics/logo.png")} style={styles.logoImg} resizeMode="contain" />
            </View>
            <Text style={styles.mobileTitle}>SVIMSAA Connect</Text>
            <Text style={styles.mobileSub}>Welcome back to your network</Text>
          </View>

          <View style={styles.mobileCard}>
            <FormContent
              form={form} handleChange={handleChange}
              showPassword={showPassword} setShowPassword={setShowPassword}
              selectedRole={selectedRole} setSelectedRole={setSelectedRole}
              handleLogin={handleLogin} loading={loading} router={router}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // System Level Error Interfaces
  errorContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center", padding: 32, textAlign: "center" as any },
  errorTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  errorSub: { fontSize: 13.5, color: "#64748B", textAlign: "center", lineHeight: 20, maxWidth: 420 },

  // ================= WEB STYLES =================
  webScroll: {
    flexGrow: 1, justifyContent: "center", alignItems: "center",
    paddingVertical: 40, paddingHorizontal: 20,
  },
  webCard: {
    backgroundColor: "#fff", borderRadius: 28, overflow: "hidden",
    flexDirection: "row", width: "100%", maxWidth: 1000, minHeight: 640,
    shadowColor: "#4F46E5", shadowOpacity: 0.1, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  leftSide: {
    flex: 1, backgroundColor: "#4F46E5",
    justifyContent: "center", alignItems: "center", padding: 48,
  },
  leftIconBg: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center", marginBottom: 32,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 15, elevation: 5,
  },
  logoImg: { width: "70%", height: "70%" },
  webTitle: { color: "#fff", fontSize: 34, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 },
  webSub: { color: "#E0E7FF", textAlign: "center", marginTop: 14, fontSize: 15, lineHeight: 26, fontWeight: "500" },
  
  rightSide: { flex: 1.1, paddingHorizontal: 60, justifyContent: "center" },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#EEF2FF",
    justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", textAlign: "center", letterSpacing: -0.5 },
  subtitle: { textAlign: "center", color: "#64748B", marginTop: 6, marginBottom: 32, fontSize: 14, fontWeight: "500" },

  // ================= MOBILE STYLES =================
  mobileScroll: { flexGrow: 1, paddingBottom: 40 },
  mobileHero: { alignItems: "center", paddingTop: 40, paddingBottom: 10 },
  mobileAvatar: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  mobileTitle: { fontSize: 26, fontWeight: "900", color: "#0F172A", marginTop: 20, letterSpacing: -0.5 },
  mobileSub: { color: "#64748B", marginTop: 6, fontSize: 14, fontWeight: "500" },
  mobileCard: {
    backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 24, padding: 24, marginTop: 24,
    shadowColor: "#0F172A", shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },

  // ================= FORM SHARED STYLES =================
  toggleWrapper: {
    flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 16, padding: 6, marginBottom: 28,
  },
  roleButton: {
    flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center",
    paddingVertical: 12, borderRadius: 12, gap: 6,
  },
  activeButton: { backgroundColor: "#4F46E5", shadowColor: "#4F46E5", shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  roleText: { color: "#4F46E5", fontWeight: "700", fontSize: 14 },
  activeRoleText: { color: "#fff" },

  label: { fontSize: 13, fontWeight: "700", marginBottom: 8, color: "#475569" },
  inputContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC",
    borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 16, height: 54,
  },
  input: {
    flex: 1, marginLeft: 12, fontSize: 14, color: "#0F172A",
    ...Platform.select({ web: { outlineStyle: "none" } as any }) // Safe TypeScript bypass for Web outline
  },

  loginButton: {
    backgroundColor: "#4F46E5", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 28,
    shadowColor: "#4F46E5", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  loginText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  registerBtn: { alignItems: "center", marginTop: 20, paddingBottom: 4 },
  registerHint: { color: "#64748B", fontSize: 14, fontWeight: "500" },
  registerText: { color: "#4F46E5", fontWeight: "800" },
});