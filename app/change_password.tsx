// ======================================================
// changepassword.tsx
// First Login — Force Password Change screen
// Route: app/changepassword.tsx
// ======================================================

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = "http://10.254.25.118:2000/change-password";
const isWeb   = Platform.OS === "web";

const showAlert = (title: string, message: string) => {
  if (isWeb) window.alert(`${title}\n${message}`);
  else Alert.alert(title, message);
};

// ── Password strength check ───────────────────────────────────────────────
const getStrength = (pwd: string): { label: string; color: string; score: number } => {
  if (!pwd) return { label: "", color: "#E2E8F0", score: 0 };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { label: "Weak",   color: "#DC2626", score: 1 };
  if (score <= 3) return { label: "Medium", color: "#D97706", score: 2 };
  return            { label: "Strong", color: "#16A34A", score: 3 };
};

// ── Password input with show/hide toggle ──────────────────────────────────
function PasswordField({
  label, value, onChange, placeholder, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, !!error && styles.inputWrapError]}>
        <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShow(!show)}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={12} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function ChangePasswordScreen() {
  const router = useRouter();

  // ── fromProfile=true => user opened this screen voluntarily from
  //    Profile > Privacy. In that case show a back-header.
  //    First-login forced flow won't pass this param, so header stays hidden.
  const { fromProfile } = useLocalSearchParams<{ fromProfile?: string }>();
  const showHeader = fromProfile === "true";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors,  setErrors]  = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);

  const strength = getStrength(newPassword);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!currentPassword.trim()) e.current = "Current password is required";
    if (!newPassword.trim())     e.new = "New password is required";
    else if (newPassword.length < 6) e.new = "Password must be at least 6 characters";
    if (!confirmPassword.trim()) e.confirm = "Please confirm your new password";
    else if (newPassword !== confirmPassword) e.confirm = "Passwords do not match";
    if (newPassword && currentPassword && newPassword === currentPassword) {
      e.new = "New password must be different from current password";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const userData = await AsyncStorage.getItem("user");
      const email = userData ? JSON.parse(userData).email : null;

      if (!email) {
        showAlert("Error", "Session expired. Please login again.");
        router.replace("/loginscreen");
        return;
      }

      const res = await axios.post(API_URL, {
        email,
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.data.success) {
        // Update local user object so app knows password is changed
        if (userData) {
          const user = JSON.parse(userData);
          await AsyncStorage.setItem("user", JSON.stringify({
            ...user,
            is_password_changed: 1,
          }));
        }

        showAlert("Success ✅", "Password changed successfully!");

        // If opened from Profile > Privacy, go back to profile instead of home
        if (showHeader) {
          router.back();
        } else {
          router.replace("/"); // → Home Dashboard (first-login flow)
        }
      } else {
        showAlert("Error", res.data.message || "Failed to change password");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Something went wrong. Please try again.";
      showAlert("Error", msg);

      // Highlight the current password field if backend says it's wrong
      if (msg.toLowerCase().includes("current password")) {
        setErrors(prev => ({ ...prev, current: msg }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      {/* ── HERO ── */}
      <LinearGradient
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.hero}
      >
        {showHeader && (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/(tab)/profile")}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.heroIconCircle}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Secure Your Account</Text>
        <Text style={styles.heroSub}>
          {showHeader
            ? "Update your password anytime to keep your account secure."
            : "For your security, please change the temporary password before continuing."}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.card}>

          <PasswordField
            label="Current Password"
            placeholder="Enter your temporary password"
            value={currentPassword}
            onChange={(t) => { setCurrentPassword(t); setErrors(p => ({ ...p, current: undefined })); }}
            error={errors.current}
          />

          <PasswordField
            label="New Password"
            placeholder="Create a new password"
            value={newPassword}
            onChange={(t) => { setNewPassword(t); setErrors(p => ({ ...p, new: undefined })); }}
            error={errors.new}
          />

          {/* Strength meter */}
          {newPassword.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBarTrack}>
                <View style={[
                  styles.strengthBarFill,
                  { width: `${(strength.score / 3) * 100}%`, backgroundColor: strength.color },
                ]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}

          <PasswordField
            label="Confirm New Password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(t) => { setConfirmPassword(t); setErrors(p => ({ ...p, confirm: undefined })); }}
            error={errors.confirm}
          />

          {/* Tips */}
          <View style={styles.tipsBox}>
            <Ionicons name="information-circle-outline" size={15} color="#5B21B6" />
            <Text style={styles.tipsText}>
              Use at least 6 characters with a mix of letters, numbers & symbols for a strong password.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.submitText}>Update Password</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  hero: {
    paddingTop: 96, paddingBottom: 32, paddingHorizontal: 24,
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 78,
    left: 18,
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  heroIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)",
  },
  heroTitle: { fontSize: 22, fontWeight: "900", color: "#fff", textAlign: "center" },
  heroSub: {
    fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center",
    marginTop: 8, maxWidth: 320, lineHeight: 19,
  },

  content: { flex: 1, paddingHorizontal: 18, marginTop: 20, },
  card: {
    backgroundColor: "#fff", borderRadius: 22, padding: 22,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },

  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 7 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0",
    borderRadius: 14, paddingHorizontal: 14, height: 50,
  },
  inputWrapError: { borderColor: "#DC2626", backgroundColor: "#FFF5F5" },
  input: { flex: 1, fontSize: 14, color: "#111",outlineStyle: "none" }as any,

  errorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  errorText: { fontSize: 11.5, color: "#DC2626" },

  strengthWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, marginTop: -6 },
  strengthBarTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "#E2E8F0", overflow: "hidden" },
  strengthBarFill: { height: 5, borderRadius: 3 },
  strengthLabel: { fontSize: 11.5, fontWeight: "800", minWidth: 50 },

  tipsBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#F3E8FF", borderRadius: 12,
    padding: 12, marginBottom: 20,
  },
  tipsText: { flex: 1, fontSize: 12, color: "#5B21B6", lineHeight: 17 },

  submitBtn: { borderRadius: 16, overflow: "hidden" },
  submitGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});