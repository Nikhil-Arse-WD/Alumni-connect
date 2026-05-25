// App.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">("admin");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FF" />

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={60} color="#4C6FFF" />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Alumni Login</Text>
      <Text style={styles.subtitle}>Welcome Back</Text>

      {/* Role Toggle */}
      <View style={styles.toggleWrapper}>
        {/* User */}
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === "user" && styles.activeButton,
          ]}
          onPress={() => setSelectedRole("user")}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={selectedRole === "user" ? "#fff" : "#5B5BFF"}
          />

          <Text
            style={[
              styles.roleText,
              selectedRole === "user" && styles.activeRoleText,
            ]}
          >
            User
          </Text>
        </TouchableOpacity>

        {/* Admin */}
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === "admin" && styles.activeButton,
          ]}
          onPress={() => setSelectedRole("admin")}
        >
          <MaterialCommunityIcons
            name="shield-crown-outline"
            size={18}
            color={selectedRole === "admin" ? "#fff" : "#5B5BFF"}
          />

          <Text
            style={[
              styles.roleText,
              selectedRole === "admin" && styles.activeRoleText,
            ]}
          >
            Admin
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login Card */}
      <View style={styles.card}>
        {/* Email */}
        <Text style={styles.label}>Email Address</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#A0A4B8" />

          <TextInput
            placeholder="Enter Email"
            placeholderTextColor="#B5B5B5"
            style={styles.input}
          />
        </View>

        {/* Password */}
        <Text style={[styles.label, { marginTop: 18 }]}>Password</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#A0A4B8" />

          <TextInput
            placeholder="Enter Password"
            placeholderTextColor="#B5B5B5"
            secureTextEntry
            style={styles.input}
          />

          <Ionicons name="eye-outline" size={20} color="#A0A4B8" />
        </View>

        {/* Forgot */}
        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        {/* Register */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>
            Don't have an account?{" "}
          </Text>

          <TouchableOpacity>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Notice */}
      <View style={styles.noticeBox}>
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={20}
          color="#7B61FF"
        />

        <Text style={styles.noticeText}>
          Admin access is for authorized personnel only.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FF",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  avatarContainer: {
    marginTop: 10,
  },

  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E8F0FF",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 38,
    fontWeight: "700",
    color: "#3E3EB5",
    marginTop: 16,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 6,
    marginBottom: 28,
  },

  toggleWrapper: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 40,
    padding: 4,
    width: "100%",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  roleButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 40,
    gap: 8,
  },

  activeButton: {
    backgroundColor: "#5B5BFF",
  },

  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5B5BFF",
  },

  activeRoleText: {
    color: "#fff",
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
    marginTop: 24,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    marginBottom: 10,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#222",
  },

  forgot: {
    textAlign: "right",
    color: "#5B5BFF",
    fontWeight: "500",
    marginTop: 10,
  },

  loginButton: {
    backgroundColor: "#5B5BFF",
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },

  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },

  registerText: {
    color: "#777",
    fontSize: 14,
  },

  registerLink: {
    color: "#5B5BFF",
    fontWeight: "700",
    fontSize: 14,
  },

  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF0FF",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: 28,
    width: "100%",
  },

  noticeText: {
    marginLeft: 10,
    color: "#555",
    fontSize: 13,
    flex: 1,
  },
});