import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Header from "../components/Header";

export default function Layout() {
  const segments = useSegments();
  const router = useRouter();
  
  // Prevents the screen from flickering while we check credentials
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const enforceSecurity = async () => {
      try {
        // 1. Fetch current user state
        const userData = await AsyncStorage.getItem("user");
        const user = userData ? JSON.parse(userData) : null;

        // 2. Identify exactly where the user is trying to go
        // segments array contains the route parts (e.g., ["(tab)", "alumnidirectory"])
        const currentRoute = segments[segments.length - 1] || "";
        const isPublicRoute = currentRoute === "loginscreen" || currentRoute === "register";

        // 3. THE ROUTE GUARDS
        if (!user && !isPublicRoute) {
          // Guard A: No session data, trying to access private page -> Kick to login
          router.replace("/loginscreen");
        } 
        else if (user && user.is_password_changed === 0 && currentRoute !== "change_password") {
          // Guard B: Logged in, but hasn't changed temp password -> Force to change_password
          router.replace("/change_password");
        } 
        else if (user && user.is_password_changed === 1 && isPublicRoute) {
          // Guard C: Fully authenticated user trying to view login/register -> Redirect to Home
          router.replace("/");
        }
      } catch (error) {
        console.error("Security Guard Error:", error);
        router.replace("/loginscreen"); // Failsafe: Kick to login on any read error
      } finally {
        // Unlocks the UI only after routing decisions are finalized
        setIsAuthChecked(true);
      }
    };

    enforceSecurity();
  }, [segments]); // <-- Re-runs this check every single time the route changes

  // Exact matching using segments is much safer than .includes()
  const currentRoute = segments[segments.length - 1] || "";
  const hideHeader = ["change_password", "loginscreen", "register"].includes(currentRoute);

  // Show a blank screen (or add a loading spinner here) while checking auth to prevent UI flashes
  if (!isAuthChecked) {
    return <View style={{ flex: 1, backgroundColor: "#F8FAFC" }} />;
  }

  return (
    <>
      {!hideHeader && <Header />}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade", // Smoother transition when redirecting
        }}
      />
    </>
  );
}