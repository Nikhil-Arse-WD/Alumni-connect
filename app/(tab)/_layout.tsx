import { Stack, usePathname } from "expo-router";
import Header from "../components/Header";

export default function Layout() {
  const pathname = usePathname();

  // Yeh check karo console mein — exact pathname print hoga
  // Remove karo production mein
  console.log("Current pathname:", pathname);

  // pathname.includes() use karo exact match ki jagah
  // taaki /change_password, change_password dono handle ho
  const hideHeader =
    pathname.includes("change_password") ||
    pathname.includes("loginscreen") ||
    pathname.includes("register");

  return (
    <>
      {!hideHeader && <Header />}

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}