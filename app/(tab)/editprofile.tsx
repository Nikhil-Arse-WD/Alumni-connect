import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import Header from "../components/Header";

const API_URL = "http://192.168.29.217:2000/member";

export default function EditProfileScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    city: "",
    country: "",
    designation: "",
    organisation: "",
  });

  // Fetch user
  const fetchUser = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_URL}/${email}`);

      const user = res.data.data;

      setFormData({
        full_name: user.full_name || "",
        mobile: user.mobile || "",
        city: user.city || "",
        country: user.country || "",
        designation: user.designation || "",
        organisation: user.organisation || "",
      });
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) {
      fetchUser();
    }
  }, [email]);

  // Update profile
  const handleUpdate = async () => {
    try {
      setSaving(true);

      await axios.put(
        `${API_URL}/update/${email}`,
        formData
      );

      Alert.alert(
        "Success",
        "Profile updated successfully"
      );

      router.back();

    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Update failed");
    } finally {
      setSaving(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ff416c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >

        <Text style={styles.heading}>
          Edit Profile
        </Text>

        {/* Full Name */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Full Name</Text>

          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                full_name: text,
              })
            }
            placeholder="Enter full name"
          />
        </View>

        {/* Mobile */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Mobile</Text>

          <TextInput
            style={styles.input}
            value={formData.mobile}
            keyboardType="phone-pad"
            onChangeText={(text) =>
              setFormData({
                ...formData,
                mobile: text,
              })
            }
            placeholder="Enter mobile"
          />
        </View>

        {/* Designation */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Designation</Text>

          <TextInput
            style={styles.input}
            value={formData.designation}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                designation: text,
              })
            }
            placeholder="Enter designation"
          />
        </View>

        {/* Organisation */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Organisation</Text>

          <TextInput
            style={styles.input}
            value={formData.organisation}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                organisation: text,
              })
            }
            placeholder="Enter organisation"
          />
        </View>

        {/* City */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>City</Text>

          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                city: text,
              })
            }
            placeholder="Enter city"
          />
        </View>

        {/* Country */}
        <View style={styles.inputBox}>
          <Text style={styles.label}>Country</Text>

          <TextInput
            style={styles.input}
            value={formData.country}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                country: text,
              })
            }
            placeholder="Enter country"
          />
        </View>
        <View style={styles.buttonRow}>
        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleUpdate}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? "Saving..." : "Save Changes"}
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
    backgroundColor: "#f4f6fb",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  scrollContainer: {
    padding: 18,
    paddingBottom: 100,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#222",
    marginBottom: 20,
  },

  inputBox: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e4e7ec",
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