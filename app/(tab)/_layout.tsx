import { Stack } from "expo-router";
import Header from "../components/Header";

export default function Layout() {
  return (
    <>
      <Header />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}