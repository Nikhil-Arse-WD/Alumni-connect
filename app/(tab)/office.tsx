import React, { useEffect, useRef } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";

import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isTabletOrWeb = width >= 768;

const members = [
  { role: "President", name: "Dr. George Thomas", img: require("../../assets/Alumni_Pics/director.jpg") },
  { role: "Chairman", name: "Mr. Sujeet Singhal", img: require("../../assets/Alumni_Pics/Chairman.jpeg") },
  { role: "Secretary", name: "Mr. Upendra Jain", img: require("../../assets/Alumni_Pics/Secretary.jpeg") },
  { role: "Joint Secretary", name: "Mr. Sanjay Agrawal", img: require("../../assets/Alumni_Pics/JointSecretary.jpeg") },
  { role: "Treasurer", name: "Dr. Jitendra Jain", img: require("../../assets/Alumni_Pics/img1.jpg") },
  { role: "Member", name: "Ms. Harsha Deshpande", img: require("../../assets/Alumni_Pics/Member.jpeg") },
  { role: "Member", name: "Dr. Vibhor Airen", img: require("../../assets/Alumni_Pics/img1.jpg") },
];

export default function OfficeBearersScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Header />

      {/* 🔥 Hero Header */}
      <View style={styles.hero}>
        <Text style={styles.heading}>Office Bearers</Text>
        <Text style={styles.subHeading}>
          Meet the leaders of SVIM Alumni Association
        </Text>
      </View>

      {/* 🔥 Cards Grid */}
      <View style={styles.grid}>
        {members.map((item, index) => {
          const slideAnim = new Animated.Value(50);

          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            delay: index * 150,
            useNativeDriver: true,
          }).start();

          return (
            <Animated.View
              key={index}
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Image source={item.img} style={styles.image} />

              <Text style={styles.role}>{item.role}</Text>
              <Text style={styles.name}>{item.name}</Text>
            </Animated.View>
          );
        })}
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f7fb",
  },

  /* 🔥 Hero Section */
  hero: {
    backgroundColor: "#0d6efd",
    padding: 25,
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },

  subHeading: {
    color: "#dbeafe",
    marginTop: 5,
    textAlign: "center",
  },

  /* 🔥 Grid Layout */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 15,
  },

  /* 🔥 Card */
  card: {
    width: isTabletOrWeb ? "30%" : "48%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  /* 🔥 Profile Image */
  image: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#0d6efd",
  },

  role: {
    fontSize: 14,
    color: "#0d6efd",
    fontWeight: "bold",
  },

  name: {
    fontSize: 13,
    color: "#333",
    marginTop: 5,
    textAlign: "center",
  },
});