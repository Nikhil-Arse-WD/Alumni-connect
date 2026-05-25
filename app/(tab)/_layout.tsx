
import { Stack } from "expo-router";
import { View } from "react-native";
import AnimatedTabBar from "../components/Animatedtab";

export default function Layout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />

      {/* Bottom Tab */}
      <AnimatedTabBar />
    </View>
  );
}