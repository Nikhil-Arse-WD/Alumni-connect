import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const adminStr = await AsyncStorage.getItem("admin");

        if (!token || !adminStr) {
          router.replace("/loginscreen");
          return;
        }

        const admin = JSON.parse(adminStr);
        if (admin.role !== "admin" && admin.role !== "super_admin") {
          router.replace("/loginscreen");
          return;
        }

        setLoading(false);
      } catch (error) {
        router.replace("/loginscreen");
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f1f5f9" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
