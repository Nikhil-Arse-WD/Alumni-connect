import { Stack, usePathname } from "expo-router";
import { StyleSheet, View } from "react-native";
import Header from "../components/Header";

export default function Layout() {
  const pathname = usePathname() || ""; // Safety: ensure it's never undefined

  // Using a more precise check: ensure we handle potentially empty strings
  const hideHeader = 
    pathname.includes("change_password") || 
    pathname.includes("loginscreen") || 
    pathname.includes("register");

  return (
    <View style={styles.container}>
      {/* 
        Only render Header if hideHeader is false.
        Adding a check for pathname.length > 0 ensures 
        we don't show the header before the path initializes.
      */}
      {!hideHeader && pathname.length > 0 && <Header />}

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: "Home - SVIMAA" }} />
        <Stack.Screen name="profile" options={{ title: "My Profile - SVIMAA" }} />
        <Stack.Screen name="alumnidirectory" options={{ title: "Alumni Directory - SVIMAA" }} />
        <Stack.Screen name="event_detail" options={{ title: "Events - SVIMAA" }} />
        <Stack.Screen name="job" options={{ title: "Careers - SVIMAA" }} />
        <Stack.Screen name="donation" options={{ title: "Donate - SVIMAA" }} />
        <Stack.Screen name="about" options={{ title: "About Us - SVIMAA" }} />
        <Stack.Screen name="contact" options={{ title: "Contact Us - SVIMAA" }} />
        <Stack.Screen name="bannerrequest" options={{ title: "Request Banner - SVIMAA" }} />
        <Stack.Screen name="mybanner" options={{ title: "My Banners - SVIMAA" }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});