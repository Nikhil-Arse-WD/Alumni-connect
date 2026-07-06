import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";

import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const USER_API =
  "http://10.232.80.175:2000/login";

const ADMIN_API =
  "http://10.232.80.175:2000/admin/login";

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
}: any) {
  return (
    <>
      {/* ROLE TOGGLE */}
      <View style={styles.toggleWrapper}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === "user" &&
              styles.activeButton,
          ]}
          onPress={() =>
            setSelectedRole("user")
          }
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={
              selectedRole === "user"
                ? "#fff"
                : "#4C6FFF"
            }
          />

          <Text
            style={[
              styles.roleText,
              selectedRole === "user" &&
                styles.activeRoleText,
            ]}
          >
            User
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            selectedRole === "admin" &&
              styles.activeButton,
          ]}
          onPress={() =>
            setSelectedRole("admin")
          }
        >
          <MaterialCommunityIcons
            name="shield-crown-outline"
            size={18}
            color={
              selectedRole === "admin"
                ? "#fff"
                : "#4C6FFF"
            }
          />

          <Text
            style={[
              styles.roleText,
              selectedRole === "admin" &&
                styles.activeRoleText,
            ]}
          >
            Admin
          </Text>
        </TouchableOpacity>
      </View>

      {/* EMAIL */}
      <Text style={styles.label}>
        Email
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={20}
          color="#666"
        />

        <TextInput
          placeholder="Enter Email"
          placeholderTextColor="#999"
          value={form.email}
          onChangeText={(t) =>
            handleChange("email", t)
          }
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* PASSWORD */}
      <Text
        style={[
          styles.label,
          { marginTop: 18 },
        ]}
      >
        Password
      </Text>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#666"
        />

        <TextInput
          placeholder="Enter Password"
          placeholderTextColor="#999"
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={(t) =>
            handleChange("password", t)
          }
          style={styles.input}
          autoCorrect={false}
        />

        <TouchableOpacity
          onPress={() =>
            setShowPassword(!showPassword)
          }
        >
          <Ionicons
            name={
              showPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={22}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {/* LOGIN BUTTON */}
      <TouchableOpacity
        style={[
          styles.loginButton,
          loading && { opacity: 0.7 },
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginText}>
          {loading
            ? "Logging in..."
            : `Login as ${selectedRole}`}
        </Text>
      </TouchableOpacity>

      {/* REGISTER */}
      {selectedRole === "user" && (
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() =>
            router.push("/register")
          }
        >
          <Text style={styles.registerHint}>
            Don't have an account?{" "}
            <Text
              style={styles.registerText}
            >
              Register
            </Text>
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
}

export default function LoginScreen() {
  const router = useRouter();

  const { width } =
    useWindowDimensions();

  const isWeb = width >= 768;

  const [showPassword, setShowPassword] =
    useState(false);

  const [selectedRole, setSelectedRole] =
    useState<"user" | "admin">(
      "user",
    );

  const [loading, setLoading] =
    useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (
    key: string,
    value: string,
  ) =>
    setForm({
      ...form,
      [key]: value,
    });
    const showAlert = (
      title: string,
      message: string
    ) => {
      if (Platform.OS === "web") {
        window.alert(`${title}\n${message}`);
      } else {
        Alert.alert(title, message);
      }
    };
    const handleLogin = async () => {
      if (!form.email || !form.password) {
        showAlert("Error ❌ ", "Enter email & password");
        return;
      }
    
      try {
        setLoading(true);
        const API = selectedRole === "admin" ? ADMIN_API : USER_API;
        const res = await axios.post(API, { email: form.email, password: form.password });
    
        if (!res.data.success) {
          showAlert(
            "Error ❌ ",
            res.data.message
          );
          return;
        }
    
        const data = selectedRole === "admin" ? res.data.admin : res.data.user;
    
        // ✅ Admin aur user ke liye alag keys
        if (selectedRole === "admin") {
          await AsyncStorage.setItem("admin", JSON.stringify(data));
        } else {
          await AsyncStorage.setItem("user", JSON.stringify(data));
        }
    
        await AsyncStorage.setItem("token", res.data.token);
        await AsyncStorage.setItem("userEmail", data.email);
    
        showAlert(
          "Success ✅",
          "Login Successful 🚀"
        );
        router.replace(selectedRole === "admin" ? "/admin/dashboard" : "/(tab)");
    
      } catch (error: any) {
        showAlert(
          "Error ❌ ",
          error?.response?.data?.message ||
            "Login Failed"
        );
      } finally {
        setLoading(false);
      }
    };
  // ================= WEB =================

  if (isWeb) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={
            styles.webScroll
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={[
              styles.webCard,
              {
                width: Math.min(
                  width * 0.85,
                  1100,
                ),
              },
            ]}
          >
            {/* LEFT */}
            <View
              style={styles.leftSide}
            >
              <View
                style={
                  styles.leftIconBg
                }
              >
                 <Image
          source={require("../assets/Alumni_Pics/logo.png")}
          style={
            styles.leftIconBg
          }
        />
              </View>

              <Text
                style={
                  styles.webTitle
                }
              >
               SVIMAA Connect
              </Text>

              <Text
                style={styles.webSub}
              >
                Connect students,
                alumni & admins
                {"\n"}
                together in one
                platform.
              </Text>
            </View>

            {/* RIGHT */}
            <View
              style={styles.rightSide}
            >
              <View
                style={
                  styles.avatarCircle
                }
              >
                <Ionicons
                  name="person"
                  size={54}
                  color="#4C6FFF"
                />
              </View>

              <Text style={styles.title}>
                Welcome Back 
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Sign in to your
                account
              </Text>

              <FormContent
                form={form}
                handleChange={
                  handleChange
                }
                showPassword={
                  showPassword
                }
                setShowPassword={
                  setShowPassword
                }
                selectedRole={
                  selectedRole
                }
                setSelectedRole={
                  setSelectedRole
                }
                handleLogin={
                  handleLogin
                }
                loading={loading}
                router={router}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ================= MOBILE =================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.mobileScroll
        }
      >
        <View style={styles.mobileHero}>
          <View
            style={
              styles.mobileAvatar
            }
          >
            <Image
          source={require("../assets/Alumni_Pics/logo.png")}
          style={
            styles.mobileAvatar
          }
        />
          </View>

          <Text
            style={styles.mobileTitle}
          >
          SVIMAA Connect
          </Text>

          <Text
            style={styles.mobileSub}
          >
            Welcome Back 
          </Text>
        </View>

        <View style={styles.mobileCard}>
          <FormContent
            form={form}
            handleChange={
              handleChange
            }
            showPassword={
              showPassword
            }
            setShowPassword={
              setShowPassword
            }
            selectedRole={
              selectedRole
            }
            setSelectedRole={
              setSelectedRole
            }
            handleLogin={
              handleLogin
            }
            loading={loading}
            router={router}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
  },

  webScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },

  webCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: "row",
    minHeight: 640,
    alignSelf: "center",

    ...(Platform.OS === "web"
      ? ({
          boxShadow:
            "0 8px 40px rgba(76,111,255,0.12)",
        } as any)
      : {
          elevation: 8,
        }),
  },

  leftSide: {
    flex: 1,
    backgroundColor: "#4C6FFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },

  leftIconBg: {
    width: 130,
    height: 130,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  webTitle: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
  },

  webSub: {
    color: "#C7D4FF",
    textAlign: "center",
    marginTop: 12,
    fontSize: 15,
    lineHeight: 26,
  },

  rightSide: {
    flex: 1,
    padding: 44,
    justifyContent: "center",
  },

  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F4F7FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E1B4B",
    textAlign: "center",
    marginTop: 12,
  },

  subtitle: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 6,
    marginBottom: 28,
    fontSize: 14,
  },

  mobileScroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  mobileHero: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 10,
  },

  mobileAvatar: {
    width: 98,
    height: 98,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  mobileTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E1B4B",
    marginTop: 16,
  },

  mobileSub: {
    color: "#64748B",
    marginTop: 6,
    fontSize: 14,
  },

  mobileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    borderRadius: 28,
    padding: 24,
    marginTop: 20,
    elevation: 4,
  },

  toggleWrapper: {
    flexDirection: "row",
    backgroundColor: "#F4F7FF",
    borderRadius: 50,
    padding: 5,
    marginBottom: 24,
  },

  roleButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 50,
    gap: 6,
  },

  activeButton: {
    backgroundColor: "#4C6FFF",
  },

  roleText: {
    color: "#4C6FFF",
    fontWeight: "700",
    fontSize: 14,
  },

  activeRoleText: {
    color: "#fff",
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    color: "#374151",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FF",
    borderWidth: 1.5,
    borderColor: "#E5E7FF",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1E1B4B",
    outlineStyle: "none" 
  }as any,

  loginButton: {
    backgroundColor: "#4C6FFF",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },

  loginText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  registerBtn: {
    alignItems: "center",
    marginTop: 18,
    paddingBottom: 4,
  },

  registerHint: {
    color: "#64748B",
    fontSize: 14,
  },

  registerText: {
    color: "#4C6FFF",
    fontWeight: "700",
  },
});