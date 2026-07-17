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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});