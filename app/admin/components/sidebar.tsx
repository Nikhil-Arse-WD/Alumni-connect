
import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Ionicons
} from "@expo/vector-icons";

const SCREEN_WIDTH =
  Dimensions.get("window").width;

interface SidebarProps {
  drawerOpen: boolean;
  translateX: Animated.Value;
  closeDrawer: () => void;
  handleMenu: (route: string) => void;
}

// components/sidebar.tsx mein menu items:
const menuItems = [
  { title: "Dashboard",      route: "dashboard",      icon: "home-outline" },
  { title: "Members",        route: "members",         icon: "people-outline" },
  { title: "Events",         route: "event",           icon: "calendar-outline" },
  { title: "Discussion Forum",          route: "forum",           icon: "chatbubbles-outline" },
  { title: "Job Board",      route: "jobs",            icon: "briefcase-outline" },
  { title: "Contributions",  route: "donation",   icon: "heart-outline" },
  { title: "Notifications",  route: "notifications",   icon: "notifications-outline" },
  { title: "Logout",         route: "logout",          icon: "log-out-outline" },
];
export default function Sidebar({
  drawerOpen,
  translateX,
  closeDrawer,
  handleMenu,
}: SidebarProps) {
  return (
    <>
      {/* OVERLAY */}

      {drawerOpen && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={closeDrawer}
        />
      )}

      {/* DRAWER */}

      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {/* PROFILE */}

        <View style={styles.profile}>
          <Ionicons
            name="school"
            size={50}
            color="#fff"
          />

          <Text style={styles.admin}>
            Alumni Admin
          </Text>

          <Text style={styles.role}>
            SUPER ADMIN
          </Text>
        </View>

        {/* MENU */}

        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() =>
              handleMenu(item.route)
            }
            style={styles.menuItem}
          >
            <Ionicons
              name={item.icon as any}
              size={20}
              color="#fff"
            />

            <Text style={styles.menuText}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: "100%",
    backgroundColor:
      "rgba(0,0,0,0.4)",
  },

  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#3526D9",
    paddingTop: 50,
    paddingHorizontal: 12,
  },

  profile: {
    alignItems: "center",
    marginBottom: 30,
  },

  admin: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
  },

  role: {
    color: "#D7D7FF",
    marginTop: 5,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginBottom: 10,
  },

  menuText: {
    color: "#fff",
    marginLeft: 12,
    fontWeight: "700",
    fontSize: 15,
  },
});
