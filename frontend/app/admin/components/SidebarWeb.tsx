import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const menuItems = [
  { title: "Dashboard", route: "dashboard", icon: "home-outline" },
  { title: "Members", route: "members", icon: "people-outline" },
  { title: "Events", route: "event", icon: "calendar-outline" },
  { title: "Discussion Forum", route: "forum", icon: "chatbubbles-outline" },
  { title: "Job Board", route: "jobs", icon: "briefcase-outline" },
  { title: "Giving Back", route: "donation", icon: "heart-outline" },
  { title: "Notifications", route: "notifications", icon: "notifications-outline" },
  { title: "Banner Advertisement", route: "Adbanner", icon: "megaphone-outline" },
  { title: "Admin Management", route: "add_admin", icon: "shield-checkmark-outline" },
  { title: "Logout", route: "logout", icon: "log-out-outline" },
];

export default function SidebarWeb({ handleMenu }: any) {
  const pathname = usePathname();

  const isActive = (route: string) => pathname.includes(route);

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Alumni Admin</Text>
      <Text style={styles.subtitle}>SUPER ADMIN</Text>

      {menuItems.map((item, i) => {
        const active = isActive(item.route);

        return (
          <TouchableOpacity
            key={i}
            onPress={() => handleMenu(item.route)}
            style={[
              styles.item,
              active && styles.activeItem,
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={18}
              color={active ? "#fff" : "#c7d2fe"}
            />

            <Text
              style={[
                styles.text,
                active && styles.activeText,
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: "#3526D9",
    paddingTop: 50,
    paddingHorizontal: 15,
    height: "100%",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: "#D7D7FF",
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
   
  },
  text: {
    color: "#fff",
    marginLeft: 10,
    fontWeight: "600",
  },
  activeItem: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
   
  },
  
  activeText: {
    color: "#fff",
    fontWeight: "900",
  },
});