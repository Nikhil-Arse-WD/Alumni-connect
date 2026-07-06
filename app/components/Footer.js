import { FontAwesome, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,

  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";

export default function Footer() {
  return (
    <ScrollView style={styles.container}>

      {/* 🔷 FOOTER */}
      <View style={styles.footer}>

        {/* 🔹 ABOUT + ADDRESS */}
        <View style={styles.topSection}>

          <Text style={styles.instituteName}>
            Shri Vaishnav Institute of Management & Sciences
          </Text>

          <Text style={styles.footerText}>
            Autonomous Institute • NAAC 'A' Grade • AICTE Approved
          </Text>

          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>📍 Address</Text>
            <Text style={styles.footerText}>
              Scheme No.71, Gumasta Nagar{"\n"}
              Indore (M.P.) - 452009
            </Text>

            <TouchableOpacity
              style={styles.directionBtn}
              onPress={() =>
                Linking.openURL(
                  "https://www.google.com/maps/dir/?api=1&destination=Shri+Vaishnav+Institute+of+Management+%26+Sciences+Indore"
                )
              }
            >
              <Text style={styles.directionText}>Get Directions</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* 🔹 CONTACT */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionHeading}>GET IN TOUCH</Text>

          <View style={styles.contactRow}>
            <Ionicons name="mail" size={16} color="#facc15" />
            <Text style={styles.footerText}>info@svim.edu.in</Text>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color="#facc15" />
            <Text style={styles.footerText}>+91-731-234-9111</Text>
          </View>

          {/* 🔥 SOCIAL */}
          <View style={styles.socialRow}>
            <FontAwesome name="facebook" size={18} color="#fff" />
            <FontAwesome name="instagram" size={18} color="#fff" />
            <FontAwesome name="linkedin" size={18} color="#fff" />
            <FontAwesome name="twitter" size={18} color="#fff" />
          </View>
        </View>

        {/* 🔹 MAP */}
        <View style={styles.mapSection}>

  {/* 🔥 Open in Maps Button */}
  <TouchableOpacity
    style={styles.mapButton}
    onPress={() =>
      Linking.openURL(
        "https://www.google.com/maps/place/Shri+Vaishnav+Institute+of+Management+%26+Sciences"
      )
    }
  >
    <Text style={styles.mapButtonText}>Open in Maps ↗</Text>
  </TouchableOpacity>

  {/* 🔥 Google Map Embed */}
  {/* 🔥 MAP */}
{Platform.OS === "web" ? (

<iframe
  src="https://maps.google.com/maps?q=Shri%20Vaishnav%20Institute%20of%20Management%20Indore&t=&z=15&ie=UTF8&iwloc=&output=embed"
  width="100%"
  height="290"
  style={{
    border: 0,
    borderRadius: 10,
  }}
  loading="lazy"
/>

) : (

<WebView
  style={styles.map}
  source={{
    html: `
      <iframe
        width="100%"
        height="100%"
        frameborder="0"
        style="border:0"
        src="https://maps.google.com/maps?q=Shri%20Vaishnav%20Institute%20of%20Management%20Indore&t=&z=15&ie=UTF8&iwloc=&output=embed"
        allowfullscreen>
      </iframe>
    `,
  }}
/>

)}

</View>

        {/* 🔹 COPYRIGHT */}
        <Text style={styles.copy}>
          © 2026 SVIMAA - All Rights Reserved | Designed with ❤️ for Alumni
        </Text>

      </View>

    </ScrollView>
  );
}

/* 🔷 STYLES */
const styles = StyleSheet.create({

  container: {
    backgroundColor: "#f5f7fb",
    marginBottom: Platform.OS === "web" ?0:50,
  },

  footer: {
    backgroundColor: "#0f172a",
    padding: 20,
  },

  topSection: {
    marginBottom: 20,
  },

  instituteName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },

  footerText: {
    color: "#cbd5e1",
    fontSize: 13,
    marginTop: 4,
  },

  addressBox: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  addressTitle: {
    color: "#facc15",
    fontWeight: "bold",
    marginBottom: 5,
  },

  directionBtn: {
    borderWidth: 1,
    borderColor: "#ff4d4d",
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
  },

  directionText: {
    color: "#ff4d4d",
    fontWeight: "600",
  },

  contactSection: {
    marginBottom: 20,
  },

  sectionHeading: {
    color: "#facc15",
    fontWeight: "bold",
    marginBottom: 10,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 140,
    marginTop: 10,
  },

  mapSection: {
    marginTop: 10,
  },

  map: {
    width: "100%",
    height: 160,
    borderRadius: 10,
  },

  copy: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 15,
    fontSize: 12,
  }

});