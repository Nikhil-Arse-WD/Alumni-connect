
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
const isWeb = Platform.OS === "web";
const tabs = [
  { name: "Home", icon: "home", route: "/" },

  {
    name: "Alumni",
    icon: "people",
    route: "/alumnidirectory",
  },

  {
    name: "Events",
    icon: "calendar-outline",
    route: "/event_detail",
  },

  {
    name: "Jobs",
    icon: "gift-outline",
    route: "/job",
  },

  {
    name: "More",
    icon: "ellipsis-horizontal-outline",
    route: "/more",
  },
 
 
];

export default function AnimatedTabBar() {
  const router = useRouter();

  const pathname = usePathname();

  const [moreVisible, setMoreVisible] =
    useState(false);

  return (
    <>
      <View style={styles.container}>
        {tabs.map((tab, index) => {
          const isActive =
            pathname === tab.route;

          const scale = useSharedValue(
            isActive ? 1.2 : 1,
          );

          React.useEffect(() => {
            scale.value = withTiming(
              isActive ? 1.2 : 1,
              {
                duration: 200,
              },
            );
          }, [pathname]);

          const animatedStyle =
            useAnimatedStyle(() => ({
              transform: [
                { scale: scale.value },
              ],
            }));

          return (
            <TouchableOpacity
              key={index}
              style={styles.tab}
              onPress={() => {
                if (tab.name === "More") {
                  setMoreVisible(true);
                } else {
                  router.push(tab.route);
                }
              }}
            >
              <Animated.View
                style={animatedStyle}
              >
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={
                    isActive
                      ? "#f52e65"
                      : "#888"
                  }
                />
              </Animated.View>

              <Text
                style={[
                  styles.label,
                  isActive &&
                    styles.activeText,
                ]}
              >
                {tab.name}
              </Text>

              {isActive && (
                <View
                  style={styles.activeDot}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

    
{/* More Modal */}
{/* More Modal */}
<Modal
  visible={moreVisible}
  transparent
  animationType="fade"
>
  <TouchableOpacity
    activeOpacity={1}
    style={styles.overlay}
    onPress={() => setMoreVisible(false)}
  >
    <View style={styles.drawerContainer}>

      {/* TOP HEADER */}
      <LinearGradient
        colors={["#5B5FEF", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileSection}
      >
        <View style={styles.profileCircle}>
          <Ionicons
            name="school-outline"
            size={42}
            color="#fff"
          />
        </View>

        <Text style={styles.profileName}>
          Alumni Connect
        </Text>

        <Text style={styles.profileMail}>
          Connect • Network • Grow
        </Text>
      </LinearGradient>

      {/* MENU LIST */}
      <View style={styles.menuContainer}>

        {/* About */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => {
            setMoreVisible(false);
            router.push("/about");
          }}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: "#EEF2FF" },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#4F46E5"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>
              About Us
            </Text>

            <Text style={styles.menuSub}>
              Know more about alumni network
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#999"
          />
        </TouchableOpacity>

        {/* Contact */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => {
            setMoreVisible(false);
            router.push("/contact");
          }}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: "#DCFCE7" },
            ]}
          >
            <Ionicons
              name="call-outline"
              size={22}
              color="#16A34A"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>
              Contact Us
            </Text>

            <Text style={styles.menuSub}>
              Get in touch with our team
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#999"
          />
        </TouchableOpacity>

        {/* Giving Back */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => {
            setMoreVisible(false);
            router.push("/donation");
          }}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: "#FEE2E2" },
            ]}
          >
            <Ionicons
              name="heart-outline"
              size={22}
              color="#DC2626"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>
              Giving Back
            </Text>

            <Text style={styles.menuSub}>
              Support alumni initiatives
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#999"
          />
        </TouchableOpacity>

        {/* Office Bearers */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => {
            setMoreVisible(false);
            router.push("/office");
          }}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: "#FEF3C7" },
            ]}
          >
            <Ionicons
              name="people-outline"
              size={22}
              color="#D97706"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>
              Office Bearers
            </Text>

            <Text style={styles.menuSub}>
              Meet the leadership team
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#999"
          />
        </TouchableOpacity>

      </View>

      {/* CLOSE BUTTON */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => setMoreVisible(false)}
      >
        
        <Text style={styles.closeText}>
          Close Menu
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingBottom: 40,
  },

  tab: {
    alignItems: "center",
  },

  label: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  activeText: {
    color: "#f52e65",
    fontWeight: "bold",
  },

  activeDot: {
    width: 6,
    height: 6,
    backgroundColor: "#f52e65",
    borderRadius: 3,
    marginTop: 4,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },

  moreContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  moreTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },

  optionText: {
    marginLeft: 14,
    fontSize: 16,
    color: "#333",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  
  drawerContainer: {
    width: isWeb
    ? Platform.OS === "web" 
      ? "32%"
      : window.innerWidth > 768
      ? "45%"
      : "65%"
    : "82%",
    height: "100%",
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    overflow: "hidden",
  
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {
      width: -4,
      height: 0,
    },
  
    elevation: 12,
  },
  
  profileSection: {
    paddingTop: 70,
    paddingBottom: 38,
    alignItems: "center",
  },
  
  profileCircle: {
    width: 95,
    height: 95,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  
  profileName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 18,
  },
  
  profileMail: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginTop: 6,
  },
  
  menuContainer: {
    padding: 18,
  },
  
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  
    elevation: 2,
  },
  
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  
  menuTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginLeft:10,
  },
  
  menuSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    marginLeft:10,
  },
  
  closeBtn: {
    marginHorizontal: 18,
    marginTop: "auto",
    marginBottom: 35,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EF4444",
  
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  
  closeText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  }, 

});

