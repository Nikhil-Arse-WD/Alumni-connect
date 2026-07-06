import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Footer from "../components/Footer";

const isWeb = Platform.OS === "web";
const API_URL =
  "http://10.232.80.175:2000/member";

export default function AlumniProfileScreen() {

  const router = useRouter();

  const [email, setEmail] =
  useState("");

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  ////////////////////////////////////////////////////////
  // FETCH USER
  ////////////////////////////////////////////////////////

  const fetchUser = async () => {

    try {

      setLoading(true);

      const res =
        await axios.get(
          `${API_URL}/${email}`
        );

      setUser(res.data.data);

    } catch (err) {

      console.log(err);

      Alert.alert(
        "Error",
        "User not found"
      );

    } finally {

      setLoading(false);

    }
  };

  ////////////////////////////////////////////////////////
  // LOAD
  ////////////////////////////////////////////////////////

  useEffect(() => {

    const loadUser = async () => {
  
      try {
  
        const data =
          await AsyncStorage.getItem(
            "user"
          );
  
        if (data) {
  
          const parsedUser =
            JSON.parse(data);
  
          console.log(
            "LOGGED USER =",
            parsedUser
          );
  
          setEmail(
            parsedUser.email
          );
  
        }
  
      } catch (err) {
  
        console.log(err);
  
      }
  
    };
  
    loadUser();
  
  }, []);
  useEffect(() => {

    if (email) {
      fetchUser();
    }
  
  }, [email]);

  ////////////////////////////////////////////////////////
  // LOGOUT
  ////////////////////////////////////////////////////////

  const handleLogout = () => {

    

      if (Platform.OS === "web") {
    
        const ok = window.confirm(
          "Are you sure you want to logout?"
        );
    
        if (ok) {
          router.replace("/loginscreen");
        }
    
      } else {
    
        Alert.alert(
          "Logout",
          "Are you sure?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Logout",
              onPress: () =>
                router.replace("/loginscreen"),
            },
          ]
        );
    
      }
    
     
  };

  ////////////////////////////////////////////////////////
  // LOADING
  ////////////////////////////////////////////////////////

  if (loading) {

    return (
      <View style={styles.loader}>

        <ActivityIndicator
          size="large"
          color="#667eea"
        />

      </View>
    );
  }

  ////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////

  return (

    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={
        false
      }
    >

     

      {/* TOP PROFILE SECTION */}

      <LinearGradient
        colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topSection}
      >

        <View style={styles.avatarLarge}>

          {user?.profile_photo ? (

            <Image
              source={{
                uri:
                  `http://10.232.80.175:2000/uploads/${user.profile_photo}`,
              }}
              style={
                styles.largeImage
              }
              contentFit="cover"
            />

          ) : (

            <Text
              style={
                styles.largeAvatarText
              }
            >
              {
                user?.full_name?.charAt(
                  0
                )
              }
            </Text>

          )}

        </View>

        <Text style={styles.bigName}>
          {user.full_name}
        </Text>

        <Text style={styles.bigRole}>
          {
            user.designation ||
            "Alumni"
          }
        </Text>

        <Text style={styles.company}>
          {
            user.organisation ||
            "Organisation"
          }
        </Text>

      </LinearGradient>

      {/* ACTION BUTTONS */}

      <View style={styles.actionRow}>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            router.push({
              pathname:
                "/editprofile",

              params: {
                email:
                  user.email,
              },
            })
          }
        >

          <Ionicons
            name="create-outline"
            size={18}
            color="#fff"
          />

          <Text
            style={styles.actionText}
          >
            Edit Profile
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            router.push(
              "/privacysettting"
            )
          }
        >

          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color="#fff"
          />

          <Text
            style={styles.actionText}
          >
            Privacy
          </Text>

        </TouchableOpacity>

      </View>

      {/* PERSONAL INFO */}

      <View style={styles.card}>

        <Text
          style={styles.sectionTitle}
        >
          Personal Information
        </Text>

        <View style={styles.infoRow}>

          <Ionicons
            name="mail-outline"
            size={20}
            color="#2563eb"
          />

          <Text
            style={styles.infoText}
          >
            {user.email}
          </Text>

        </View>

        <View style={styles.infoRow}>

          <Ionicons
            name="call-outline"
            size={20}
            color="#667eea"
          />

          <Text
            style={styles.infoText}
          >
            {user.mobile}
          </Text>

        </View>

        <View style={styles.infoRow}>

          <Ionicons
            name="location-outline"
            size={20}
            color="#667eea"
          />

          <Text
            style={styles.infoText}
          >
            {user.city},{" "}
            {user.country}
          </Text>

        </View>

      </View>

      {/* EDUCATION */}

      <View style={styles.card}>

        <Text
          style={styles.sectionTitle}
        >
          Education
        </Text>

        <View style={styles.infoRow}>

          <Ionicons
            name="school-outline"
            size={20}
            color="#667eea"
          />

          <Text
            style={styles.infoText}
          >
            {user.programme}
          </Text>

        </View>

        <View style={styles.infoRow}>

          <Ionicons
            name="calendar-outline"
            size={20}
            color="#2563eb"
          />

          <Text
            style={styles.infoText}
          >
            Batch{" "}
            {user.batch_year}
          </Text>

        </View>

      </View>

      {/* PROFESSIONAL */}

      <View style={styles.card}>

        <Text
          style={styles.sectionTitle}
        >
          Professional Details
        </Text>

        <View style={styles.infoRow}>

          <Ionicons
            name="briefcase-outline"
            size={20}
            color="#667eea"
          />

          <Text
            style={styles.infoText}
          >
            {
              user.organisation ||
              "Not Added"
            }
          </Text>

        </View>

        <View style={styles.infoRow}>

          <Ionicons
            name="business-outline"
            size={20}
            color="#667eea"
          />

          <Text
            style={styles.infoText}
          >
            {
              user.industry ||
              "Not Added"
            }
          </Text>

        </View>

        <View style={styles.infoRow}>

          <Ionicons
            name="time-outline"
            size={20}
            color="#667eea"
          />

          <Text
            style={styles.infoText}
          >
            {
              user.years_of_experience ||
              0
            }{" "}
            Years Experience
          </Text>

        </View>

      </View>

      {/* LOGOUT */}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
      >

        <Ionicons
          name="log-out-outline"
          size={20}
          color="#fff"
        />

        <Text
          style={styles.logoutText}
        >
          Logout
        </Text>

      </TouchableOpacity>

    
      <Footer />
    </ScrollView>
    
  );
}

////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#eef2f7",
    marginBottom:Platform.OS === "web" ?0:50
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  ////////////////////////////////////////////////////////
  // TOP SECTION
  ////////////////////////////////////////////////////////

  topSection: {
    alignItems: "center",
    paddingVertical: 35,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
  },

  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 4,
    borderColor: "#fff",
  },

  largeImage: {
    width: 120,
    height: 120,
  },

  largeAvatarText: {
    fontSize: 45,
    fontWeight: "bold",
    color: "#0f172a",
  },

  bigName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },

  bigRole: {
    fontSize: 16,
    color: "#f1f1f1",
    marginTop: 5,
  },

  company: {
    fontSize: 14,
    color: "#e5e5e5",
    marginTop: 4,
  },

  ////////////////////////////////////////////////////////
  // ACTION BUTTONS
  ////////////////////////////////////////////////////////

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: -22,
    marginBottom: 20,
    paddingHorizontal: 14,
  },

  actionBtn: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16,
    elevation: 5,
  },

  actionText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 7,
    fontSize: 14,
  },

  ////////////////////////////////////////////////////////
  // CARD
  ////////////////////////////////////////////////////////

  card: {
    backgroundColor: "#fff",
   // marginHorizontal: 16,
    marginBottom: 18,
    padding: 20,
    borderRadius: 22,
    elevation: 4,
    marginHorizontal:Platform.OS === "web" ? 46:19,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 18,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  infoText: {
    marginLeft: 12,
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },

  ////////////////////////////////////////////////////////
  // LOGOUT
  ////////////////////////////////////////////////////////

  logoutBtn: {
    backgroundColor: "#ff3b30",
   //marginHorizontal: 16,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 18,
    marginHorizontal:Platform.OS === "web" ? 46:19,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },

});