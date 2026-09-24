import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { UserProvider, useUser } from "../context/UserContext";
import { useEffect } from "react";
import { Platform, View, ActivityIndicator } from "react-native";

const ROUTE_MAP: Record<string, string> = {
  "loginscreen": "Login - SVIMAA",
  "login": "Login - SVIMAA",
  "register": "Register - SVIMAA",
  "change_password": "Change Password - SVIMAA",
  "alumnidirectory": "Alumni Directory - SVIMAA",
  "alumniprofile": "Alumni Profile - SVIMAA",
  "bannerrequest": "Request Banner - SVIMAA",
  "mybanner": "My Banners - SVIMAA",
  "bannerdetail": "Banner Detail - SVIMAA",
  "editprofile": "Edit Profile - SVIMAA",
  "privacysettting": "Privacy Settings - SVIMAA",
  "livead": "Live Ads - SVIMAA",
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdminLoggedIn, loading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const rootSegment = segments[0];
    const isAuthGroup = rootSegment === "loginscreen" || rootSegment === "register";

    if (isAdminLoggedIn) {
      if (rootSegment !== "admin") {
        router.replace("/admin/dashboard");
      }
    } else if (user) {
      if (user.is_password_changed === 0) {
        if (rootSegment !== "change_password") {
          router.replace("/change_password");
        }
      } else {
        if (isAuthGroup || rootSegment === "admin" || !rootSegment || (rootSegment as string) === "index") {
          router.replace("/(tab)");
        }
      }
    } else {
      if (!isAuthGroup) {
        router.replace("/loginscreen");
      }
    }
  }, [user, isAdminLoggedIn, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS === 'web') {
      const path = pathname.toLowerCase();
      let title = "SVIMAA Connect";
      
      if (path.includes("admin")) {
        title = "Admin - SVIMAA";
      } else {
        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || "";
        
        if (lastSegment && lastSegment !== "(tab)") {
          // 1. Look up in our specific overrides dictionary first
          if (ROUTE_MAP[lastSegment]) {
            title = ROUTE_MAP[lastSegment];
          } 
          // 2. Dynamic auto-formatter for any new/unknown routes
          else {
            const formatted = lastSegment
              .replace(/_/g, ' ')
              .replace(/\b\w/g, char => char.toUpperCase());
            title = `${formatted} - SVIMAA`;
          }
        }
      }

      document.title = title;
    }
  }, [pathname]);

  return (
    <View style={{ flex: 1 }}>
      <UserProvider>
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="loginscreen" options={{ title: "Login - SVIMAA" }} />
            <Stack.Screen name="register" options={{ title: "Register - SVIMAA" }} />
            <Stack.Screen name="index" options={{ title: "SVIMAA Connect" }} />
            <Stack.Screen name="change_password" options={{ title: "Change Password - SVIMAA" }} />
            <Stack.Screen name="(tab)" options={{ title: "SVIMAA" }} />
            <Stack.Screen name="admin" options={{ title: "Admin - SVIMAA" }} />
          </Stack>
        </AuthGuard>
      </UserProvider>
    </View>
  );
}
