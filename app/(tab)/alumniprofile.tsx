import axios from "axios";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import Header from "../components/Header";

const API_URL = "http://192.168.29.217:2000/alumni/profile";

export default function AlumniProfileScreen() {

  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  ////////////////////////////////////////////////////////
  // FETCH PROFILE
  ////////////////////////////////////////////////////////

  const fetchProfile = async () => {

    try {

      const res = await axios.get(`${API_URL}/${id}`);

      setUser(res.data.data);

    } catch (err) {

      console.log(err);

      Alert.alert(
        "Error",
        "Failed to load profile"
      );

    } finally {

      setLoading(false);

    }
  };

  ////////////////////////////////////////////////////////
  // INITIAL LOAD
  ////////////////////////////////////////////////////////

  useEffect(() => {

    if (id) {
      fetchProfile();
    }

  }, [id]);

  ////////////////////////////////////////////////////////
  // LOADING
  ////////////////////////////////////////////////////////

  if (loading) {

    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#ff416c"
        />
      </View>
    );
  }

  ////////////////////////////////////////////////////////
  // NO USER
  ////////////////////////////////////////////////////////

  if (!user) {

    return (
      <View style={styles.loader}>
        <Text>User not found</Text>
      </View>
    );
  }

  ////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////

  return (

    <View style={styles.container}>

      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >

        {/* PROFILE CARD */}
        <View style={styles.card}>

          {/* IMAGE */}
          <View style={styles.avatarBox}>

            {user.profile_photo ? (

              <Image
                source={{
                  uri: `http://192.168.29.217:2000/uploads/${user.profile_photo}`,
                }}
                style={styles.profileImage}
                contentFit="cover"
              />

            ) : (

              <Text style={styles.avatarText}>
                {user.full_name?.charAt(0)}
              </Text>

            )}

          </View>

          {/* NAME */}
          <Text style={styles.name}>
            {user.full_name}
          </Text>

          {/* ROLE */}
          <Text style={styles.role}>
            {user.designation || "Alumni"}
          </Text>

          {/* ORG */}
          {user.organisation && (

            <Text style={styles.org}>
              {user.organisation}
            </Text>

          )}

        </View>

        {/* INFO SECTION */}
        <View style={styles.infoCard}>

          {/* PROGRAMME */}
          <View style={styles.infoBox}>
            <Text style={styles.label}>
              🎓 Programme
            </Text>

            <Text style={styles.value}>
              {user.programme}
            </Text>
          </View>

          {/* BATCH */}
          <View style={styles.infoBox}>
            <Text style={styles.label}>
              📅 Batch Year
            </Text>

            <Text style={styles.value}>
              {user.batch_year}
            </Text>
          </View>

          {/* CITY */}
          <View style={styles.infoBox}>
            <Text style={styles.label}>
              📍 Location
            </Text>

            <Text style={styles.value}>
              {user.city}, {user.country}
            </Text>
          </View>

          {/* INDUSTRY */}
          {user.industry && (

            <View style={styles.infoBox}>
              <Text style={styles.label}>
                💼 Industry
              </Text>

              <Text style={styles.value}>
                {user.industry}
              </Text>
            </View>

          )}

          {/* EMAIL */}
          {user.email && (

            <TouchableOpacity
              style={styles.infoBox}
              onPress={() =>
                Linking.openURL(
                  `mailto:${user.email}`
                )
              }
            >

              <Text style={styles.label}>
                📧 Email
              </Text>

              <Text style={styles.link}>
                {user.email}
              </Text>

            </TouchableOpacity>

          )}

          {/* MOBILE */}
          {user.mobile && (

            <TouchableOpacity
              style={styles.infoBox}
              onPress={() =>
                Linking.openURL(
                  `tel:${user.mobile}`
                )
              }
            >

              <Text style={styles.label}>
                📱 Mobile
              </Text>

              <Text style={styles.link}>
                {user.mobile}
              </Text>

            </TouchableOpacity>

          )}

        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >

          <Text style={styles.backText}>
            Back
          </Text>

        </TouchableOpacity>

      </ScrollView>

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

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  scrollContainer: {
    padding: 18,
    paddingBottom: 100,
  },

  ////////////////////////////////////////////////////////
  // CARD
  ////////////////////////////////////////////////////////

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 5,
    marginBottom: 18,
  },

  avatarBox: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#ff416c",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 14,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "700",
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },

  role: {
    fontSize: 16,
    color: "#ff416c",
    fontWeight: "600",
    marginBottom: 4,
  },

  org: {
    fontSize: 14,
    color: "#666",
  },

  ////////////////////////////////////////////////////////
  // INFO
  ////////////////////////////////////////////////////////

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    elevation: 4,
  },

  infoBox: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: "#888",
    marginBottom: 6,
  },

  value: {
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
  },

  link: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
  },

  ////////////////////////////////////////////////////////
  // BUTTON
  ////////////////////////////////////////////////////////

  backBtn: {
    backgroundColor: "#ff416c",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 24,
  },

  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

});