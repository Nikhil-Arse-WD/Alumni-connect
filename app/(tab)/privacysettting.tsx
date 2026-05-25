import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import {
    Alert,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import Header from "../components/Header";

const API_URL = "http://192.168.29.217:2000/privacy";

export default function PrivacySettingsScreen() {
 const router = useRouter();
  const [email, setEmail] = useState("");

  const [showEmail, setShowEmail] =
    useState(true);

  const [showMobile, setShowMobile] =
    useState(true);

  const [showOrganisation, setShowOrganisation] =
    useState(true);

  ////////////////////////////////////////////////////////
  // LOAD USER
  ////////////////////////////////////////////////////////

  useEffect(() => {

    const loadUser = async () => {

      const userData =
        await AsyncStorage.getItem("user");

      if (userData) {

        const user = JSON.parse(userData);

        setEmail(user.email);

        setShowEmail(
          user.show_email === 1
        );

        setShowMobile(
          user.show_mobile === 1
        );

        setShowOrganisation(
          user.show_organisation === 1
        );

      }
    };

    loadUser();

  }, []);

  ////////////////////////////////////////////////////////
  // SAVE SETTINGS
  ////////////////////////////////////////////////////////

  const savePrivacy = async () => {

    try {
        if (!email) {
            Alert.alert("Email not found");
            return;
          }
      
    console.log(`${API_URL}/${email}`);
    const res =await axios.put(
        `${API_URL}/${email}`,
        {
          show_email: showEmail,
          show_mobile: showMobile,
          show_organisation: showOrganisation,
        }
      );
      console.log(res.data);
      Alert.alert(
        "Success",
        "Privacy settings updated"
      );

    } catch (err) {

      console.log(err);

      Alert.alert(
        "Error",
        "Update failed"
      );

    }
  };

  ////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////

  return (

    <View style={styles.container}>

      <Header />

      <Text style={styles.heading}>
        Privacy Settings
      </Text>

      <Text style={styles.subHeading}>
        Control what other alumni can see
      </Text>

      {/* EMAIL */}
      <View style={styles.card}>

        <View>
          <Text style={styles.label}>
            Show Email
          </Text>

          <Text style={styles.desc}>
            Other alumni can see your email
          </Text>
        </View>

        <Switch
          value={showEmail}
          onValueChange={setShowEmail}
        />

      </View>

      {/* MOBILE */}
      <View style={styles.card}>

        <View>
          <Text style={styles.label}>
            Show Mobile
          </Text>

          <Text style={styles.desc}>
            Other alumni can call you
          </Text>
        </View>

        <Switch
          value={showMobile}
          onValueChange={setShowMobile}
        />

      </View>

      {/* ORGANISATION */}
      <View style={styles.card}>

        <View>
          <Text style={styles.label}>
            Show Organisation
          </Text>

          <Text style={styles.desc}>
            Display company name publicly
          </Text>
        </View>

        <Switch
          value={showOrganisation}
          onValueChange={setShowOrganisation}
        />

      </View>
      <View style={styles.buttonRow}>
      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={savePrivacy}
      >

        <Text style={styles.saveText}>
          Save Settings
        </Text>

      </TouchableOpacity>
      <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >

          <Text style={styles.backText}>
            Cancel
          </Text>

        </TouchableOpacity>
        </View>
    </View>
  );
}

////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
   
  },

  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    marginTop: 20,
  },

  subHeading: {
    color: "#777",
    marginTop: 6,
    marginBottom: 25,
  },

  ////////////////////////////////////////////////////////
  // CARD
  ////////////////////////////////////////////////////////

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 16,

    elevation: 2,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  desc: {
    color: "#777",
    marginTop: 4,
    fontSize: 13,
  },

  ////////////////////////////////////////////////////////
  // BUTTON
  ////////////////////////////////////////////////////////

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  
  saveBtn: {
    backgroundColor: "#ff416c",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  
  backBtn: {
    backgroundColor: "#444",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flex: 1,
  },

  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});