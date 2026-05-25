import React from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";


import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function ContactScreen() {
  return (
    <ScrollView style={styles.container}>
     <Header />
    
      {/* ===== HERO SECTION ===== */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Get In Touch</Text>
        <Text style={styles.heroText}>
          We'd love to hear from you. Reach out anytime!
        </Text>
      </View>

      {/* ===== INTRO ===== */}
      <Text style={styles.intro}>
        If you have any questions or suggestions, feel free to contact us.
      </Text>

      {/* ===== CONTACT CARD 1 ===== */}
      <View style={styles.card}>
        <Text style={styles.name}>Mr. Sujeet Singhal</Text>
        <Text style={styles.label}>Contact Person</Text>

        <TouchableOpacity onPress={() => Linking.openURL("tel:+919753545667")}>
          <Text style={styles.link}>📞 +91 9753545667</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Linking.openURL("https://wa.me/919753545667")}>
          <Text style={styles.link}>💬 WhatsApp</Text>
        </TouchableOpacity>

        <Text style={styles.location}>📍 Indore, MP</Text>
      </View>

      {/* ===== CONTACT CARD 2 ===== */}
      <View style={styles.card}>
        <Text style={styles.name}>Mr. Upendra Jain</Text>
        <Text style={styles.label}>Contact Person</Text>

        <TouchableOpacity onPress={() => Linking.openURL("tel:+919827044277")}>
          <Text style={styles.link}>📞 +91 9827044277</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Linking.openURL("https://wa.me/919827044277")}>
          <Text style={styles.link}>💬 WhatsApp</Text>
        </TouchableOpacity>

        <Text style={styles.location}>📍 Indore, MP</Text>
      </View>

      {/* ===== EMAIL ===== */}
      <View style={styles.cardCenter}>
        <Text style={styles.sectionTitle}>Email Us</Text>
        <TouchableOpacity onPress={() => Linking.openURL("mailto:svimaa@svimi.org")}>
          <Text style={styles.email}>svimaa@svimi.org</Text>
        </TouchableOpacity>
      </View>

      {/* ===== OFFICE HOURS ===== */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Office Hours</Text>
        <Text>Mon - Fri: 9:00 AM - 6:00 PM</Text>
        <Text>Saturday: 10:00 AM - 4:00 PM</Text>
        <Text style={{ color: "red" }}>Sunday: Closed</Text>
      </View>

      {/* ===== LOCATION ===== */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Visit Us</Text>
        <Text>SVIM Alumni Association</Text>
        <Text>Indore, MP - 452001</Text>

        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() =>
            Linking.openURL("https://maps.app.goo.gl/Yqb2H7aY2mKhzf5r8")
          }
        >
          <Text style={styles.mapText}>Get Directions</Text>
        </TouchableOpacity>
      </View>

      {/* ===== CTA ===== */}
      <View style={styles.cta}>
        <Text style={styles.ctaText}>
          Join Our Alumni Community
        </Text>

        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>Register Now</Text>
        </TouchableOpacity>
        
      </View>
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f7fb",
  },

  hero: {
    backgroundColor: "#0d6efd",
    padding: 30,
    alignItems: "center",
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },

  heroText: {
    color: "#fff",
    marginTop: 5,
  },

  intro: {
    textAlign: "center",
    padding: 20,
    color: "#555",
  },

  card: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
  },

  cardCenter: {
    backgroundColor: "#fff",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  label: {
    color: "#777",
    marginBottom: 10,
  },

  link: {
    color: "#0d6efd",
    marginVertical: 3,
  },

  location: {
    marginTop: 5,
  },

  email: {
    color: "#0d6efd",
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  mapBtn: {
    marginTop: 10,
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 8,
  },

  mapText: {
    color: "#fff",
    textAlign: "center",
  },

  cta: {
    backgroundColor: "#0d6efd",
    padding: 25,
    alignItems: "center",
    marginTop: 20,
  },

  ctaText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },

  btn: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
  },

  btnText: {
    color: "#0d6efd",
    fontWeight: "bold",
  },
});