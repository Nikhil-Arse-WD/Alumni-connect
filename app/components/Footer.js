import { FontAwesome, Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { WebView } from "react-native-webview";

export default function Footer() {
  const { width } = useWindowDimensions();
  const isWebLayout = width >= 768; // Breakpoint for Web/Tablet Grid

  return (
    <View style={styles.footerBackground}>
      {/* ── Responsive Container (Max Width on Web, Full Width on Mobile) ── */}
      <View style={[styles.footerContent, isWebLayout ? styles.webGrid : styles.mobileStack]}>
        
        {/* 🔹 COLUMN 1: ABOUT + ADDRESS */}
        <View style={isWebLayout ? styles.colLarge : styles.colFull}>
          <Text style={styles.instituteName}>
            Shri Vaishnav Institute of Management & Sciences
          </Text>
          <Text style={styles.footerText}>
            Autonomous Institute • NAAC 'A' Grade • AICTE Approved
          </Text>

          <View style={styles.addressBox}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Ionicons name="location" size={16} color="#FACC15" />
              <Text style={styles.addressTitle}>Address</Text>
            </View>
            <Text style={styles.addressText}>
              Scheme No.71, Gumasta Nagar{"\n"}
              Indore (M.P.) - 452009
            </Text>

            <TouchableOpacity
              style={styles.directionBtn}
              onPress={() => Linking.openURL("https://www.google.com/maps/dir/?api=1&destination=Shri+Vaishnav+Institute+of+Management+%26+Sciences+Indore")}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-outline" size={16} color="#F87171" />
              <Text style={styles.directionText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🔹 COLUMN 2: CONTACT */}
        <View style={isWebLayout ? styles.colSmall : styles.colFull}>
          <Text style={styles.sectionHeading}>GET IN TOUCH</Text>

          <View style={styles.contactRow}>
            <Ionicons name="mail" size={16} color="#FACC15" />
            <Text style={styles.contactText}>info@svim.edu.in</Text>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color="#FACC15" />
            <Text style={styles.contactText}>+91-731-234-9111</Text>
          </View>

          {/* 🔥 SOCIAL (Now fully interactive) */}
          <Text style={[styles.sectionHeading, { marginTop: 24 }]}>FOLLOW US</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity activeOpacity={0.7} style={styles.socialBtn}>
              <FontAwesome name="facebook" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.socialBtn}>
              <FontAwesome name="instagram" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.socialBtn}>
              <FontAwesome name="linkedin" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} style={styles.socialBtn}>
              <FontAwesome name="twitter" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 🔹 COLUMN 3: MAP */}
        <View style={isWebLayout ? styles.colLarge : styles.colFull}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={styles.sectionHeading}>LOCATE US</Text>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => Linking.openURL("https://www.google.com/maps/place/Shri+Vaishnav+Institute+of+Management+%26+Sciences")}
              activeOpacity={0.7}
            >
              <Text style={styles.mapButtonText}>Open in Maps</Text>
              <Ionicons name="open-outline" size={14} color="#60A5FA" />
            </TouchableOpacity>
          </View>

          {/* 🔥 MAP EMBED */}
          <View style={styles.mapWrapper}>
            {Platform.OS === "web" ? (
              <iframe
                src="https://maps.google.com/maps?q=Shri%20Vaishnav%20Institute%20of%20Management%20Indore&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: "none" }}
                loading="lazy"
              />
            ) : (
              <WebView
                style={styles.map}
                scrollEnabled={false}
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                        <style>body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }</style>
                      </head>
                      <body>
                        <iframe width="100%" height="100%" frameborder="0" style="border:0" src="https://maps.google.com/maps?q=Shri%20Vaishnav%20Institute%20of%20Management%20Indore&t=&z=15&ie=UTF8&iwloc=&output=embed" allowfullscreen></iframe>
                      </body>
                    </html>
                  `,
                }}
              />
            )}
          </View>
        </View>

      </View>

      {/* 🔹 BOTTOM COPYRIGHT BANNER */}
      <View style={styles.copyrightBanner}>
        <Text style={styles.copyText}>
          © 2026 SVIMAA - All Rights Reserved | Designed with ❤️ for Alumni
        </Text>
      </View>

    </View>
  );
}

/* 🔷 STYLES */
const styles = StyleSheet.create({
  footerBackground: {
    backgroundColor: "#0F172A",
    width: "100%",
    // Safe padding for mobile bottom tabs
    paddingBottom: Platform.OS === "web" ? 0 : 90, 
  },
  footerContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    width: "100%",
    alignSelf: "center",
  },
  
  // ── Grid Layouts ──
  webGrid: {
    maxWidth: 1200,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 40,
  },
  mobileStack: {
    flexDirection: "column",
    gap: 36,
  },
  colLarge: { flex: 1.2 },
  colSmall: { flex: 0.8 },
  colFull: { width: "100%" },

  // ── Typography & Elements ──
  instituteName: { color: "#fff", fontWeight: "800", fontSize: 18, marginBottom: 6, letterSpacing: -0.2 },
  footerText: { color: "#94A3B8", fontSize: 13, lineHeight: 20 },
  
  addressBox: { backgroundColor: "#1E293B", padding: 18, borderRadius: 16, marginTop: 16, borderWidth: 1, borderColor: "#334155" },
  addressTitle: { color: "#FACC15", fontWeight: "800", fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase" },
  addressText: { color: "#CBD5E1", fontSize: 13.5, lineHeight: 22 },

  directionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    borderWidth: 1.5, borderColor: "rgba(248, 113, 113, 0.4)",
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginTop: 14,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
  directionText: { color: "#F87171", fontWeight: "700", fontSize: 13 },

  sectionHeading: { color: "#FACC15", fontWeight: "800", fontSize: 13, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  contactText: { color: "#E2E8F0", fontSize: 14, fontWeight: "500" },

  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#1E293B",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#334155",
  },

  mapButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  mapButtonText: { color: "#60A5FA", fontWeight: "600", fontSize: 13 },

  mapWrapper: {
    width: "100%",
    height: 180, // Fixed height keeps the map looking clean
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1E293B", // Placeholder color while loading
  },
  map: { width: "100%", height: "100%", backgroundColor: "transparent" },

  copyrightBanner: {
    borderTopWidth: 1, borderTopColor: "#1E293B",
    paddingVertical: 20, paddingHorizontal: 24,
    alignItems: "center",
  },
  copyText: { textAlign: "center", color: "#64748B", fontSize: 12.5, fontWeight: "500" }
});