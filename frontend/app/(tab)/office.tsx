import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import Footer from "../components/Footer";

import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const isMobile = width < 768;

const members = [
  {
    role: "President",
    name: "Dr. George Thomas",
    desc: "Leading with vision and dedication",
    img: require("../../assets/Alumni_Pics/director.jpg"),
  },
  {
    role: "Chairman",
    name: "Mr. Sujeet Singhal",
    desc: "Guiding organizational strategy",
    img: require("../../assets/Alumni_Pics/Chairman.jpeg"),
  },
  {
    role: "Secretary",
    name: "Mr. Upendra Jain",
    desc: "Managing operations efficiently",
    img: require("../../assets/Alumni_Pics/Secretary.jpeg"),
  },
  {
    role: "Joint Secretary",
    name: "Mr. Sanjay Agrawal",
    desc: "Supporting administration",
    img: require("../../assets/Alumni_Pics/JointSecretary.jpeg"),
  },
  {
    role: "Treasurer",
    name: "Dr. Jitendra Jain",
    desc: "Handling financial activities",
    img: require("../../assets/Alumni_Pics/drjitendra.jpeg"),
  },
  {
    role: "Member",
    name: "Ms. Harsha Deshpande",
    desc: "Contributing to alumni growth",
    img: require("../../assets/Alumni_Pics/Member.jpeg"),
  },
  {
    role: "Member",
    name: "Dr. Vibhor Airen",
    desc: "Supporting alumni initiatives",
    img: require("../../assets/Alumni_Pics/drvibhor.jpeg"),
  },
];

export default function OfficeBearersScreen() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO SECTION */}
      <LinearGradient
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.hero}
      >
        <Text style={styles.heading}>Office Bearers</Text>
        <Text style={styles.subHeading}>
          Meet the dedicated leaders of the SVIMS Alumni Association
        </Text>
      </LinearGradient>

      {/* PRESIDENT CARD */}
      <View style={styles.presidentWrapper}>
        <View style={styles.presidentCard}>
          {/* Wrapper controls the box size, image fills from top */}
          <View style={styles.presidentImageWrapper}>
            <Image
              source={members[0].img}
              style={styles.presidentImage}
            />
          </View>

          <View style={styles.presidentContent}>
            <Text style={styles.roleTop}>{members[0].role}</Text>
            <Text style={styles.bigName}>{members[0].name}</Text>
            <Text style={styles.desc}>{members[0].desc}</Text>
          </View>
        </View>
      </View>

      {/* OTHER MEMBERS */}
      <View style={styles.grid}>
        {members.slice(1).map((item, index) => (
          <View key={index} style={styles.card}>
            {/* Wrapper controls box, image fills from top */}
            <View style={styles.cardImageWrapper}>
              <Image
                source={item.img}
                style={styles.cardImage}
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.roleTop}>{item.role}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f7",
    marginBottom:60
  },

  /* HERO */
  hero: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 40,
  },

  heading: {
    fontSize: isMobile ? 34 : 40,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },

  subHeading: {
    marginTop: 14,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    maxWidth: 700,
    lineHeight: 28,
  },

  /* PRESIDENT */
  presidentWrapper: {
    alignItems: "center",
    paddingHorizontal: 20,
  },

  presidentCard: {
    backgroundColor: "#fff",
    width: isMobile ? "100%" : "50%",
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: isMobile ? "column" : "row",
    marginBottom: 35,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },

  /*
   * KEY FIX:
   * Wrapper has fixed height + overflow:hidden — yeh "crop box" hai
   * Image ke andar position:"absolute", top:0 force karta hai
   * ki image hamesha TOP se start ho — face kabhi cut nahi hoga
   */
  presidentImageWrapper: {
    width: isMobile ? "100%" : 340,
    height: isMobile ? 440 : 380,
    overflow: "hidden",
    position: "relative",
  },

  presidentImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  presidentContent: {
    flex: 1,
    padding: isMobile ? 24 : 30,
    justifyContent: "center",
  },

  /* GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },

  /* MEMBER CARD */
  card: {
    width: isMobile ? "100%" : "46%",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    flexDirection: isMobile ? "column" : "row",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  /* Same fix for member cards */
  cardImageWrapper: {
    width: isMobile ? "100%" : 250,
    height: isMobile ? 430 : 300,
    overflow: "hidden",
    position: "relative",
  },

  cardImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  cardContent: {
    flex: 1,
    padding: isMobile ? 22 : 28,
    justifyContent: "center",
  },

  /* TEXT */
  roleTop: {
    color: "#8b5cf6",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: "uppercase",
  },

  bigName: {
    fontSize: isMobile ? 28 : 30,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
  },

  name: {
    fontSize: isMobile ? 22 : 25,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  desc: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 25,
  },
});