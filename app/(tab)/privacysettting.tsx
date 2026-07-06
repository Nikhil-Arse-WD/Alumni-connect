import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";


export const showAlert = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

import { LinearGradient } from "expo-linear-gradient";

const API_URL = "http://10.254.25.118:2000/privacy";

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
          user.show_email === 1 || user.show_email === true
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
      // Yeh naya code axios.put ke baad add kiya
const userData = await AsyncStorage.getItem("user");
if (userData) {
  const user = JSON.parse(userData);
  await AsyncStorage.setItem("user", JSON.stringify({
    ...user,
    show_email:        showEmail        ? 1 : 0,
    show_mobile:       showMobile       ? 1 : 0,
    show_organisation: showOrganisation ? 1 : 0,
  }));
}
      console.log(res.data);
      showAlert("Success ✅", "Privacy settings updated");
      router.back();
    } catch (err) {

      console.log(err);

      showAlert("Error", "Update failed");

    }
  };

  ////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////

  return (

    <View style={styles.container}>

<LinearGradient
    colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0}}
  style={styles.topSection}
>

      <Text style={styles.heading}>
        Privacy Settings
      </Text>

      <Text style={styles.subHeading}>
        Control what other alumni can see
      </Text>
      </LinearGradient>
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
  topSection: {
    paddingHorizontal: 18,
    
    paddingBottom: 10,
    elevation: 10,
  color:"#fff",
    alignItems: Platform.OS === "web" ?"center":"flex-start",
  },
  heading: {
    
    fontSize: Platform.OS === "web" ?42:30,
    fontWeight: "700",
    color: "#fff",
    marginTop: 20,
    textAlign:"center"
  },

  subHeading: {
    color: "#fff",
    marginTop: 6,
    marginBottom: 25,
    textAlign:"center",
    fontSize: Platform.OS === "web" ?15:15,
  },

  ////////////////////////////////////////////////////////
  // CARD
  ////////////////////////////////////////////////////////

  card: {
    marginTop: 26,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginHorizontal:Platform.OS === "web" ? 46:19,
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
    marginHorizontal: Platform.OS === "web" ? 46:9,
  },
  
  backBtn: {
    backgroundColor: "#444",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: Platform.OS === "web" ? 46:9,
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