// app/admin/event.tsx

import {
    Feather,
    Ionicons,
} from "@expo/vector-icons";
  
  import * as DocumentPicker from "expo-document-picker";
  
  import DateTimePicker from "@react-native-community/datetimepicker";
  
  import axios from "axios";
  
  import React, {
    useEffect,
    useState,
} from "react";
  
  import {
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
  
  import { SafeAreaView } from "react-native-safe-area-context";
  
  const API =
    "http://192.168.29.217:2000";
  
  // ======================
  // TYPES
  // ======================
  
  interface EventType {
    event_id: number;
  
    title: string;
  
    description: string;
  
    venue: string;
  
    event_date: string;
  
    event_time: string;
  
    capacity: number;
  
    cover_photo: string;
  }
  
  export default function EventScreen() {
    // ======================
    // STATES
    // ======================
  
    const [events, setEvents] =
      useState<EventType[]>([]);
  
    const [loading, setLoading] =
      useState(false);
  
    const [modalVisible, setModalVisible] =
      useState(false);
  
    const [showDate, setShowDate] =
      useState(false);
  
    const [showTime, setShowTime] =
      useState(false);
  
    const [form, setForm] = useState({
      title: "",
      description: "",
      venue: "",
      event_date: "",
      event_time: "",
      capacity: "",
      cover_photo: "",
    });
  
    // ======================
    // FETCH EVENTS
    // ======================
  
    const fetchEvents = async () => {
      try {
        setLoading(true);
  
        const res =
          await axios.get(
            `${API}/events`
          );
  
        setEvents(res.data.events || []);
      } catch (err) {
        console.log(err);
  
        if (Platform.OS === "web") {
          alert("Failed to load events");
        } else {
          Alert.alert(
            "Error",
            "Failed to load events"
          );
        }
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchEvents();
    }, []);
  
    // ======================
    // HANDLE CHANGE
    // ======================
  
    const handleChange = (
      key: string,
      value: string
    ) => {
      setForm({
        ...form,
        [key]: value,
      });
    };
  
    // ======================
    // PICK IMAGE
    // ======================
  
    const pickImage = async () => {
      try {
        const result =
          await DocumentPicker.getDocumentAsync(
            {
              type: "image/*",
              copyToCacheDirectory: true,
            }
          );
  
        if (
          result.canceled === false
        ) {
          handleChange(
            "cover_photo",
            result.assets[0].uri
          );
        }
      } catch (err) {
        console.log(err);
      }
    };
  
    // ======================
    // CREATE EVENT
    // ======================
  
    const createEvent = async () => {
      if (
        !form.title ||
        !form.description ||
        !form.venue ||
        !form.event_date ||
        !form.event_time
      ) {
        if (Platform.OS === "web") {
          alert("Fill all fields");
        } else {
          Alert.alert(
            "Error",
            "Fill all fields"
          );
        }
  
        return;
      }
  
      try {
        const res = await axios.post(
          `${API}/admin/create-event`,
          {
            title: form.title,
            description:
              form.description,
            venue: form.venue,
            event_date:
              form.event_date,
            event_time:
              form.event_time,
            capacity: form.capacity,
            cover_photo:
              form.cover_photo,
          }
        );
  
        console.log(res.data);
  
        if (Platform.OS === "web") {
          alert(
            "Event Created Successfully"
          );
        } else {
          Alert.alert(
            "Success",
            "Event Created Successfully"
          );
        }
  
        setModalVisible(false);
  
        setForm({
          title: "",
          description: "",
          venue: "",
          event_date: "",
          event_time: "",
          capacity: "",
          cover_photo: "",
        });
  
        fetchEvents();
      } catch (err: any) {
        console.log(
          err?.response?.data || err
        );
  
        if (Platform.OS === "web") {
          alert(
            err?.response?.data
              ?.message ||
              "Failed to create event"
          );
        } else {
          Alert.alert(
            "Error",
            err?.response?.data
              ?.message ||
              "Failed to create event"
          );
        }
      }
    };
  
    // ======================
    // DATE FORMAT
    // ======================
  
    const formatDate = (
      date: any
    ) => {
      const d = new Date(date);
  
      return `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    };
  
    // ======================
    // TIME FORMAT
    // ======================
  
    const formatTime = (
      date: any
    ) => {
      const d = new Date(date);
  
      return `${String(
        d.getHours()
      ).padStart(2, "0")}:${String(
        d.getMinutes()
      ).padStart(2, "0")}:00`;
    };
  
    // ======================
    // UI
    // ======================
  
    return (
      <SafeAreaView
        style={styles.container}
      >
        {/* HEADER */}
  
        <View style={styles.header}>
          <Text
            style={styles.headerTitle}
          >
            Events
          </Text>
  
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() =>
              setModalVisible(true)
            }
          >
            <Feather
              name="plus"
              size={20}
              color="#fff"
            />
  
            <Text style={styles.addText}>
              Add Event
            </Text>
          </TouchableOpacity>
        </View>
  
        {/* EVENTS */}
  
        <FlatList
          data={events}
          keyExtractor={(item) =>
            item.event_id.toString()
          }
          contentContainerStyle={{
            padding: 18,
          }}
          refreshing={loading}
          onRefresh={fetchEvents}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.cover_photo ? (
                <Image
                  source={{
                    uri:`http://192.168.29.217:2000${item.cover_photo}`,
                  }}
                  style={styles.image}
                />
              ) : null}
  
              <Text
                style={
                  styles.eventTitle
                }
              >
                {item.title}
              </Text>
  
              <Text style={styles.desc}>
                {item.description}
              </Text>
  
              <View style={styles.row}>
                <Ionicons
                  name="location-outline"
                  size={17}
                  color="#666"
                />
  
                <Text style={styles.info}>
                  {item.venue}
                </Text>
              </View>
  
              <View style={styles.row}>
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color="#666"
                />
  
                <Text style={styles.info}>
                  {item.event_date}
                </Text>
              </View>
  
              <View style={styles.row}>
                <Ionicons
                  name="time-outline"
                  size={17}
                  color="#666"
                />
  
                <Text style={styles.info}>
                  {item.event_time}
                </Text>
              </View>
  
              <View style={styles.row}>
                <Ionicons
                  name="people-outline"
                  size={17}
                  color="#666"
                />
  
                <Text style={styles.info}>
                  Capacity:
                  {" "}
                  {item.capacity}
                </Text>
              </View>
            </View>
          )}
        />
  
        {/* MODAL */}
  
        <Modal
          visible={modalVisible}
          animationType="slide"
        >
          <ScrollView
            style={
              styles.modalContainer
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            <Text
              style={styles.modalTitle}
            >
              Create Event
            </Text>
  
            {/* TITLE */}
  
            <TextInput
              placeholder="Event Title"
              style={styles.input}
              value={form.title}
              onChangeText={(t) =>
                handleChange(
                  "title",
                  t
                )
              }
            />
  
            {/* DESCRIPTION */}
  
            <TextInput
              placeholder="Description"
              style={[
                styles.input,
                {
                  height: 120,
                },
              ]}
              multiline
              textAlignVertical="top"
              value={form.description}
              onChangeText={(t) =>
                handleChange(
                  "description",
                  t
                )
              }
            />
  
            {/* VENUE */}
  
            <TextInput
              placeholder="Venue"
              style={styles.input}
              value={form.venue}
              onChangeText={(t) =>
                handleChange(
                  "venue",
                  t
                )
              }
            />
  
            {/* DATE */}
  
            {Platform.OS === "web" ? (
  <input
    type="date"
    value={form.event_date}
    onChange={(e) =>
      handleChange(
        "event_date",
        e.target.value
      )
    }
    style={{
      height: 58,
      borderRadius: 16,
      border: "1px solid #E5E7FF",
      paddingLeft: 15,
      marginBottom: 18,
      backgroundColor: "#F8F9FF",
      fontSize: 16,
      outline: "none",
    }}
  />
) : (
  <>
    <TouchableOpacity
   
      style={styles.input}
      onPress={() =>
        setShowDate(true)
      }
    >
      <Text>
        {form.event_date ||
          "Select Date"}
      </Text>
    </TouchableOpacity>

    {showDate && (
      <DateTimePicker
        value={new Date()}
        mode="date"
        display="default"
        onChange={(
          event,
          selectedDate
        ) => {
          setShowDate(false);

          if (selectedDate) {
            handleChange(
              "event_date",
              formatDate(
                selectedDate
              )
            );
          }
        }}
      />
    )}
  </>
)}
  
            {/* TIME */}
  
            {Platform.OS === "web" ? (
  <input
    type="time"
    value={form.event_time}
    onChange={(e) =>
      handleChange(
        "event_time",
        `${e.target.value}:00`
      )
    }
    style={{
      height: 58,
      borderRadius: 16,
      border: "1px solid #E5E7FF",
      paddingLeft: 15,
      marginBottom: 18,
      backgroundColor: "#F8F9FF",
      fontSize: 16,
      outline: "none",
    }}
  />
) : (
  <>
    <TouchableOpacity
      style={styles.input}
      onPress={() =>
        setShowTime(true)
      }
    >
      <Text>
        {form.event_time ||
          "Select Time"}
      </Text>
    </TouchableOpacity>

    {showTime && (
      <DateTimePicker
        value={new Date()}
        mode="time"
        is24Hour={true}
        display="default"
        onChange={(
          event,
          selectedTime
        ) => {
          setShowTime(false);

          if (selectedTime) {
            handleChange(
              "event_time",
              formatTime(
                selectedTime
              )
            );
          }
        }}
      />
    )}
  </>
)}
            {/* CAPACITY */}
  
            <TextInput
              placeholder="Capacity"
              keyboardType="numeric"
              style={styles.input}
              value={form.capacity}
              onChangeText={(t) =>
                handleChange(
                  "capacity",
                  t
                )
              }
            />
  
            {/* PHOTO */}
  
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={pickImage}
            >
              <Ionicons
                name="image-outline"
                size={22}
                color="#4C6FFF"
              />
  
              <Text
                style={styles.uploadText}
              >
                {form.cover_photo
                  ? "Photo Selected"
                  : "Select Cover Photo"}
              </Text>
            </TouchableOpacity>
  
            {form.cover_photo ? (
              <Image
                source={{
                  uri: form.cover_photo,
                }}
                style={
                  styles.previewImage
                }
              />
            ) : null}
  
            {/* CREATE */}
  
            <TouchableOpacity
              style={styles.createBtn}
              onPress={createEvent}
            >
              <Text
                style={styles.createText}
              >
                Create Event
              </Text>
            </TouchableOpacity>
  
            {/* CANCEL */}
  
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() =>
                setModalVisible(false)
              }
            >
              <Text
                style={styles.cancelText}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Modal>
      </SafeAreaView>
    );
  }
  
  // ======================
  // STYLES
  // ======================
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F5F7FF",
    },
  
    header: {
      flexDirection: "row",
      justifyContent:
        "space-between",
  
      alignItems: "center",
  
      paddingHorizontal: 18,
  
      paddingVertical: 16,
  
      backgroundColor: "#fff",
  
      elevation: 3,
    },
  
    headerTitle: {
      fontSize: 22,
  
      fontWeight: "700",
    },
  
    addBtn: {
      flexDirection: "row",
  
      alignItems: "center",
  
      backgroundColor: "#4C6FFF",
  
      paddingHorizontal: 14,
  
      paddingVertical: 10,
  
      borderRadius: 12,
    },
  
    addText: {
      color: "#fff",
  
      marginLeft: 6,
  
      fontWeight: "700",
    },
  
    card: {
      backgroundColor: "#fff",
  
      borderRadius: 20,
  
      padding: 18,
  
      marginBottom: 18,
  
      elevation: 3,
    },
  
    image: {
      width: "100%",
  
      height: 180,
  
      borderRadius: 16,
  
      marginBottom: 14,
    },
  
    previewImage: {
      width: "100%",
      height: 180,
      borderRadius: 16,
      marginTop: 15,
    },
  
    eventTitle: {
      fontSize: 19,
  
      fontWeight: "700",
  
      color: "#222",
    },
  
    desc: {
      color: "#666",
  
      marginTop: 8,
  
      lineHeight: 22,
    },
  
    row: {
      flexDirection: "row",
  
      alignItems: "center",
  
      marginTop: 12,
    },
  
    info: {
      marginLeft: 8,
  
      color: "#444",
    },
  
    modalContainer: {
      flex: 1,
  
      backgroundColor: "#fff",
  
      padding: 20,
    },
  
    modalTitle: {
      fontSize: 28,
  
      fontWeight: "700",
  
      marginBottom: 25,
  
      marginTop: 20,
    },
  
    input: {
      backgroundColor: "#F8F9FF",
  
      borderWidth: 1,
  
      borderColor: "#E5E7FF",
  
      borderRadius: 16,
  
      paddingHorizontal: 15,
  
      justifyContent: "center",
  
      height: 58,
  
      marginBottom: 18,
    },
  
    uploadBtn: {
      height: 58,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5E7FF",
      backgroundColor: "#F8F9FF",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
    },
  
    uploadText: {
      marginLeft: 10,
      color: "#4C6FFF",
      fontWeight: "600",
    },
  
    createBtn: {
      backgroundColor: "#4C6FFF",
  
      paddingVertical: 16,
  
      borderRadius: 16,
  
      alignItems: "center",
  
      marginTop: 25,
    },
  
    createText: {
      color: "#fff",
  
      fontWeight: "700",
  
      fontSize: 16,
    },
  
    cancelBtn: {
      alignItems: "center",
  
      marginTop: 20,
  
      marginBottom: 40,
    },
  
    cancelText: {
      color: "red",
  
      fontWeight: "700",
    },
  });