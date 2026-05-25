import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  date: string; // "2026-05-18"
  time: string; // "14:30:00"
};

export default function Countdown({ date, time }: Props) {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    if (!date || !time) return;

    // ✅ SAFE PARSE (NO ISO STRING)
    const [year, month, day] = date.split("-").map(Number);

    const timeParts = time.split(":").map(Number);
    const hour = timeParts[0] || 0;
    const minute = timeParts[1] || 0;
    const second = timeParts[2] || 0;

    const target = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      second
    ).getTime();

    if (isNaN(target)) {
      console.log("INVALID DATE:", date, time);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
        return;
      }

      setTimeLeft({
        days: String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0"),
        hours: String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0"),
        minutes: String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0"),
        seconds: String(Math.floor((diff / 1000) % 60)).padStart(2, "0"),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [date, time]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Event Countdown</Text>

      <View style={styles.row}>
        <Box label="Days" value={timeLeft.days} />
        <Box label="Hours" value={timeLeft.hours} />
        <Box label="Minutes" value={timeLeft.minutes} />
        <Box label="Seconds" value={timeLeft.seconds} />
      </View>
    </View>
  );
}

const Box = ({ label, value }: any) => (
  <View style={styles.box}>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  box: {
    width: 70,
    height: 80,
    backgroundColor: "#F5F6FA",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  value: {
    fontSize: 26,
    fontWeight: "800",
  },
  label: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
  },
});