import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API = "http://10.254.25.118:2000/birthdays/today";

export default function BirthdayModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkBirthday();
  }, []);

  const checkBirthday = async () => {
    try {
      const user = JSON.parse(
        (await AsyncStorage.getItem("user")) || "{}"
      );

      if (!user?.id) return;

      const res = await axios.get(API);

      if (!res.data.success) return;

      const birthdays = res.data.birthdays || [];

      // Sirf login user ko check karo
      const myBirthday = birthdays.find(
        (item: any) => Number(item.id) === Number(user.id)
      );

      if (myBirthday) {
        setIsVisible(true);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={isVisible}
      onRequestClose={() => setIsVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.emoji}>🎉</Text>

          <Text style={styles.title}>
            Happy Birthday!
          </Text>

          <Text style={styles.message}>
            Wishing you a fantastic day from the Alumni Association!
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setIsVisible(false)}
          >
            <Text style={styles.buttonText}>
              Thank You!
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    elevation: 5,
  },

  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },

  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  button: {
    backgroundColor: "#4C6FFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});