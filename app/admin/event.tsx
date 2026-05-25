// app/admin/event.tsx
import {
  MaterialIcons,
} from "@expo/vector-icons";
import axios from "axios";
import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

  
  import {
  Feather,
  Ionicons,
} from "@expo/vector-icons";
  
  import { useRouter } from "expo-router";
  
  import * as DocumentPicker from "expo-document-picker";
  
  import DateTimePicker from "@react-native-community/datetimepicker";
  
  import Sidebar from "./components/sidebar";
  
  const API = "http://192.168.29.217:2000";
  
  const PRIMARY = "#5B5FEF";
  
  interface EventType {
    event_id: number;
    title: string;
    description: string;
    venue: string;
    event_date: string;
    event_time: string;
    capacity: number;
    cover_photo: string;
    status: string;
  }
  
  export default function App() {
    const { width } =
      useWindowDimensions();
      const [rsvp, setRsvp] = useState({
        going: 0,
        maybe: 0,
        notGoing: 0,
        total: 0,
      });
    const isMobile = width < 768;
  
    const router = useRouter();
  
    // =========================
    // DRAWER
    // =========================

    const [drawerOpen, setDrawerOpen] =
      useState(false);
  
    const translateX = useRef(
      new Animated.Value(-300)
    ).current;
  
    const openDrawer = () => {
      setDrawerOpen(true);
  
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    };
  
    const closeDrawer = () => {
      Animated.timing(translateX, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }).start(() =>
        setDrawerOpen(false)
      );
    };
    const handleMenu = (route: string) => {
      closeDrawer();
      if (route === "logout") {
  
        if (Platform.OS === "web") {
      
          const ok = window.confirm(
            "Are you sure you want to logout?"
          );
      
          if (ok) {
            router.replace("/loginscreen");
          }
      
        } else {
      
          Alert.alert(
            "Logout",
            "Are you sure?",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Logout",
                onPress: () =>
                  router.replace("/loginscreen"),
              },
            ]
          );
      
        }
      
        return;
      }
      router.push(`/admin/${route}` as any);
    };
    // =========================
    // STATES
    // =========================
    
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
      const [countdown, setCountdown] = useState({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      });
      const [rsvpSummary, setRsvpSummary] = useState<any>({});
    const [form, setForm] = useState({
      title: "",
      description: "",
      venue: "",
      event_date: "",
      event_time: "",
      capacity: "",
      cover_photo: "",
    });
  
    // =========================
    // FETCH EVENTS
    // =========================
  
    const fetchEvents = async () => {
      try {
        setLoading(true);
  
        const res = await axios.get(
          `${API}/events`
        );
  
        setEvents(res.data.events || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchEvents();
    }, []);
  
    // =========================
    // FORM
    // =========================
  
    const handleChange = (
      key: string,
      value: string
    ) => {
      setForm({
        ...form,
        [key]: value,
      });
    };
  // =========================
// RESET FORM
// =========================

const resetForm = () => {
    setForm({
      title: "",
      description: "",
      venue: "",
      event_date: "",
      event_time: "",
      capacity: "",
      cover_photo: "",
    });
  
    setEditingEventId(null);
  };
    // =========================
    // PICK IMAGE
    // =========================
  
    const pickImage = async () => {
      try {
        const result =
          await DocumentPicker.getDocumentAsync(
            {
              type: "image/*",
              copyToCacheDirectory: true,
            }
          );
  
        if (!result.canceled) {
          handleChange(
            "cover_photo",
            result.assets[0].uri
          );
        }
      } catch (err) {
        console.log(err);
      }
    };
  
    // =========================
    // CREATE EVENT
    // =========================
  
    const createEvent = async () => {
      try {
        const data = new FormData();
  
        data.append(
          "title",
          form.title
        );
  
        data.append(
          "description",
          form.description
        );
  
        data.append(
          "venue",
          form.venue
        );
  
        data.append(
          "event_date",
          form.event_date
        );
  
        data.append(
          "event_time",
          form.event_time
        );
  
        data.append(
          "capacity",
          form.capacity
        );
  // AUTO STATUS

// AUTO STATUS
const eventDate = new Date(
    `${form.event_date}T${form.event_time}`
  ).getTime();
  
  const now = Date.now();
  
  const status =
    now >= eventDate
      ? "Completed"
      : "Upcoming";
  
  data.append(
    "status",
    status
  );
        // IMAGE
  
        if (form.cover_photo) {
          if (
            Platform.OS === "web"
          ) {
            const response =
              await fetch(
                form.cover_photo
              );
  
            const blob =
              await response.blob();
  
            data.append(
              "cover_photo",
              blob,
              "event.jpg"
            );
          } else {
            const filename =
              form.cover_photo
                .split("/")
                .pop();
  
            const match =
              /\.(\w+)$/.exec(
                filename || ""
              );
  
            const type = match
              ? `image/${match[1]}`
              : `image`;
  
            data.append(
              "cover_photo",
              {
                uri: form.cover_photo,
                name:
                  filename ||
                  "photo.jpg",
                type,
              } as any
            );
          }
        }
  
        await axios.post(
          `${API}/admin/create-event`,
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
  
        Alert.alert(
          "Success",
          "Event Created"
        );
  
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
      } catch (err) {
        console.log(err);
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
    };
}
    // =========================
    // DELETE EVENT
    // =========================
  
    const deleteEvent = async (
      id: number
    ) => {
      try {
        await axios.delete(
          `${API}/admin/delete-event/${id}`
        );
  
        fetchEvents();
  
        Alert.alert(
          "Deleted",
          "Event Deleted"
        );
      } catch (err) {
        console.log(err);
      }
    };
  // =========================
// STATES
// =========================

const [editModal, setEditModal] =
useState(false);

const [editingEventId, setEditingEventId] =
useState<number | null>(null);
const [detailsModal, setDetailsModal] =
  useState(false);

const [selectedEvent, setSelectedEvent] =
  useState<EventType | null>(null);

  const [gallery, setGallery] =
  useState<any[]>([]);
// =========================
// OPEN EDIT
// =========================

const openEditModal = (
item: EventType
) => {
setEditingEventId(
  item.event_id
);

setForm({
  title: item.title,
  description:
    item.description,
  venue: item.venue,
  event_date:
    item.event_date,
  event_time:
    item.event_time,
  capacity:
    item.capacity.toString(),
  cover_photo:
    API + item.cover_photo,
});

setEditModal(true);
};

// =========================
// UPDATE EVENT
// =========================

const updateEvent = async () => {
try {
  const data =
    new FormData();

  data.append(
    "title",
    form.title
  );

  data.append(
    "description",
    form.description
  );

  data.append(
    "venue",
    form.venue
  );

  data.append(
    "event_date",
    form.event_date
  );

  data.append(
    "event_time",
    form.event_time
  );

  data.append(
    "capacity",
    form.capacity
  );

  // AUTO STATUS
 
  const eventDate =
    new Date(
      `${form.event_date}T${form.event_time}`
    );

  const status =
    new Date() > eventDate
      ? "Completed"
      : "Upcoming";

  data.append(
    "status",
    status
  );

  // IMAGE

  if (
    form.cover_photo &&
    !form.cover_photo.startsWith(
      "http"
    )
  ) {
    if (
      Platform.OS === "web"
    ) {
      const response =
        await fetch(
          form.cover_photo
        );

      const blob =
        await response.blob();

      data.append(
        "cover_photo",
        blob,
        "event.jpg"
      );
    } else {
      const filename =
        form.cover_photo
          .split("/")
          .pop();

      const match =
        /\.(\w+)$/.exec(
          filename || ""
        );

      const type =
        match
          ? `image/${match[1]}`
          : `image`;

      data.append(
        "cover_photo",
        {
          uri: form.cover_photo,
          name:
            filename ||
            "event.jpg",
          type,
        } as any
      );
    }
  }

  await axios.put(
    `${API}/admin/update-event/${editingEventId}`,
    data,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  Alert.alert(
    "Success",
    "Event Updated"
  );

  setEditModal(false);

  fetchEvents();
} catch (err) {
  console.log(err);

  Alert.alert(
    "Error",
    "Update failed"
  );
}
};
const markEventCompleted =
  async (eventId: number) => {
    try {
      await axios.put(
        `${API}/admin/update-event-status/${eventId}`,
        {
          status: "Completed",
        }
      );

      // LOCAL UPDATE
      setSelectedEvent((prev: any) => ({
        ...prev,
        status: "Completed",
      }));

      fetchEvents();
    } catch (err) {
      console.log(err);
    }
  };
// =========================
// OPEN DETAILS
// =========================
useEffect(() => {
    if (!selectedEvent) return;
  
    const timer = setInterval(() => {
  
      // ONLY DATE
      const d = new Date(
        selectedEvent.event_date
      );
      
      const cleanDate =
        `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
      
      const eventDateTime =
        `${cleanDate}T${selectedEvent.event_time}`;
      
      const eventDate =
        new Date(
          eventDateTime
        ).getTime();
      const now =
        new Date().getTime();
  
      const distance =
        eventDate - now;
  
      console.log(
        "DISTANCE:",
        distance
      );
  
      if (distance <= 0) {
  
        if (
          selectedEvent.status !==
          "Completed"
        ) {
          markEventCompleted(
            selectedEvent.event_id
          );
        }
  
        setCountdown({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
  
        clearInterval(timer);
  
        return;
      }
  
      const days = Math.floor(
        distance /
          (1000 * 60 * 60 * 24)
      );
  
      const hours = Math.floor(
        (distance %
          (1000 * 60 * 60 * 24)) /
          (1000 * 60 * 60)
      );
  
      const minutes = Math.floor(
        (distance %
          (1000 * 60 * 60)) /
          (1000 * 60)
      );
  
      const seconds = Math.floor(
        (distance %
          (1000 * 60)) /
          1000
      );
  
      setCountdown({
        days: String(days).padStart(
          2,
          "0"
        ),
        hours: String(hours).padStart(
          2,
          "0"
        ),
        minutes: String(
          minutes
        ).padStart(2, "0"),
        seconds: String(
          seconds
        ).padStart(2, "0"),
      });
  
    }, 1000);
  
    return () =>
      clearInterval(timer);
  
  }, [selectedEvent]);



  useEffect(() => {
    if (!selectedEvent) return;
  
    fetch(`${API}/rsvp/summary/${selectedEvent.event_id}`)
      .then(res => res.json())
      .then(json => {
        console.log("RSVP JSON:", json); // pehle ye dekho console mein
  
        if (json.success) {
          const data = json.data;
  
          // Agar array format hai: [{response: "GOING", count: 3}, ...]
          if (Array.isArray(data)) {
            let going = 0, maybe = 0, notGoing = 0, total = 0;
  
            data.forEach((item) => {
              if (item.response === "GOING") going = item.count;
              else if (item.response === "MAYBE") maybe = item.count;
              else if (item.response === "NOT_GOING") notGoing = item.count;
              total += item.count;
            });
  
            setRsvp({ going, maybe, notGoing, total });
          } else {
            // Agar object format hai: {going: 3, maybe: 1, ...}
            setRsvp({
              going: data.going || 0,
              maybe: data.maybe || 0,
              notGoing: data.notGoing || data.not_going || 0,
              total: data.total || 0,
            });
          }
        }
      })
      .catch(err => console.log("RSVP Error:", err));
  
  }, [selectedEvent]);

  const fetchRSVPSummary = async (eventId: number) => {
    try {
      const res = await axios.get(
        `${API}/rsvp/summary/${eventId}`
      );
  
      const data = res.data.data;
  
      let summary = {
        GOING: 0,
        MAYBE: 0,
        NOT_GOING: 0,
      };
  
      data.forEach((item: any) => {
        summary[item.response] = item.count;
      });
  
      setRsvpSummary(summary);
    } catch (err) {
      console.log(err);
    }
  };
  
const openDetails = async (
    item: EventType
  ) => {
    console.log(item);
    setSelectedEvent(item);
  
    setDetailsModal(true);
  
    fetchGallery(
      item.event_id
    );
  };

  const fetchGallery =
  async (id: number) => {
    try {
      const res =
        await axios.get(
          `${API}/event-gallery/${id}`
        );

      setGallery([
        ...res.data.gallery,
      ]);
    } catch (err) {
      console.log(err);
    }
  };
  const pickGalleryImages =
  async () => {
    try {
      const result =
        await DocumentPicker.getDocumentAsync(
          {
            type: "image/*",
            multiple: true,
            copyToCacheDirectory: true,
          }
        );

      if (!result.canceled) {
        uploadGalleryImages(
          result.assets
        );
      }
    } catch (err) {
      console.log(err);
    }
  };
  // =========================
// PICK GALLERY IMAGE
// =========================
const DetailRow = ({
    icon,
    label,
    value,
  }: any) => (
    <View
      style={{
        marginBottom: 18,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <Ionicons
          name={icon}
          size={20}
          color={PRIMARY}
        />
  
        <Text
          style={{
            marginLeft: 8,
            fontWeight: "700",
            color: "#333",
          }}
        >
          {label}
        </Text>
      </View>
  
      <Text
        style={{
          color: "#555",
          lineHeight: 24,
        }}
      >
        {value}
      </Text>
    </View>
  );
const uploadGalleryImages =
  async (
    images: any[]
  ) => {
    try {
      console.log(
        "UPLOAD FUNCTION CALLED"
      );

      console.log(images);

      const data =
        new FormData();

      for (
        let i = 0;
        i < images.length;
        i++
      ) {
        const img =
          images[i];

        console.log(
          "IMAGE",
          img
        );

        if (
          Platform.OS ===
          "web"
        ) {
          data.append(
            "gallery_images",
            img.file
          );
        } else {
          data.append(
            "gallery_images",
            {
              uri: img.uri,
              name:
                img.name ||
                `gallery_${i}.jpg`,
              type:
                img.mimeType ||
                "image/jpeg",
            } as any
          );
        }
      }

      console.log(
        "SENDING REQUEST"
      );

      const res =
        await axios.post(
          `${API}/admin/upload-gallery/${selectedEvent?.event_id}`,
          data,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      console.log(
        "UPLOAD SUCCESS",
        res.data
      );

      // REFRESH GALLERY

      await fetchGallery(
        selectedEvent?.event_id as number
      );

      // MESSAGE

      if (
        Platform.OS ===
        "web"
      ) {
        window.alert(
          "Gallery Uploaded Successfully"
        );
      } else {
        Alert.alert(
          "Success",
          "Gallery Uploaded Successfully"
        );
      }
    } catch (err: any) {
      console.log(
        "UPLOAD ERROR",
        err
      );

      console.log(
        err?.response?.data
      );

      if (
        Platform.OS ===
        "web"
      ) {
        window.alert(
          "Upload Failed"
        );
      } else {
        Alert.alert(
          "Error",
          "Upload Failed"
        );
      }
    }
  };
    // =========================
    // DATE FORMAT
    // =========================
  
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
  
    // =========================
    // STATUS
    // =========================
  
    const getEventStatus = (
      date: string,
      time: string
    ) => {
      const eventDate = new Date(
        `${date}T${time}`
      );
  
      return new Date() >
        eventDate
        ? "Completed"
        : "Upcoming";
    };
  
    // =========================
    // STATS
    // =========================
  
    const totalEvents =
  events.length;

const upcomingEvents =
  events.filter(
    (e) => e.status === "Upcoming"
  ).length;

const completedEvents =
  events.filter(
    (e) => e.status === "Completed"
  ).length;

    // =========================
    // UI
    // =========================

        // 🎯 Target event date (change this)
        
    return (
      <SafeAreaView
        style={styles.container}
      >
        {/* TOP BAR */}
  
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={openDrawer}
          >
            <Feather
              name="menu"
              size={24}
              color="#000"
            />
          </TouchableOpacity>
  
          <Text style={styles.topTitle}>
            Alumni Admin
          </Text>
  
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#000"
          />
        </View>
  
        {/* CONTENT */}
  
        <ScrollView
          contentContainerStyle={{
            padding: isMobile
              ? 15
              : 25,
          }}
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* HEADER */}
  
          <View
            style={[
              styles.headerRow,
              isMobile && {
                flexDirection:
                  "column",
                alignItems:
                  "flex-start",
              },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.pageTitle,
                  isMobile && {
                    fontSize: 26,
                  },
                ]}
              >
                Events
              </Text>
  
              <Text
                style={
                  styles.breadcrumb
                }
              >
                Dashboard {">"} Events
              </Text>
            </View>
  
            <TouchableOpacity
              style={[
                styles.addBtn,
                isMobile && {
                  marginTop: 15,
                  width: "100%",
                },
              ]}
              onPress={() => {
                resetForm();
                setModalVisible(true);
              }}
            >
              <Text
                style={styles.addBtnText}
              >
                + Add Event
              </Text>
            </TouchableOpacity>
          </View>
  
          {/* STATS */}
          <View
  style={[
    styles.statsRow,
    isMobile && {
      flexDirection: "row",
      justifyContent:
        "space-between",
      gap: 10,
    },
  ]}
>
            <View
             style={[
                styles.statCard,
                isMobile && {
                  width: "100%",
                  marginRight: 0,
                },
              ]}
            >
              <Text
                style={styles.statNumber}
              >
                {totalEvents}
              </Text>
  
              <Text
                style={styles.statLabel}
              >
                Total Events
              </Text>
            </View>
  
            <View
              style={styles.statCard}
            >
              <Text
                style={styles.statNumber}
              >
                {upcomingEvents}
              </Text>
  
              <Text
                style={styles.statLabel}
              >
                Upcoming
              </Text>
            </View>
  
            <View
              style={styles.statCard}
            >
              <Text
                style={styles.statNumber}
              >
                {completedEvents}
              </Text>
  
              <Text
                style={styles.statLabel}
              >
                Completed
              </Text>
            </View>
          </View>
  
          {/* EVENTS */}
  
          {isMobile ? (
            <FlatList
              scrollEnabled={false}
              data={events}
              keyExtractor={(item) =>
                item.event_id.toString()
              }
              refreshing={loading}
              onRefresh={fetchEvents}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={
                    styles.mobileCard

                  }
                  activeOpacity={0.9}
  onPress={() =>
    openDetails(item)
  }
                >
                  <Image
                    source={{
                      uri:
                        API +
                        item.cover_photo,
                    }}
                    style={
                      styles.mobileImage
                    }
                  />
  
                  <Text
                    style={
                      styles.mobileTitle
                    }
                  >
                    {item.title}
                  </Text>
  
                  <Text
                    style={
                      styles.mobileDesc
                    }
                  >
                    {item.description}
                  </Text>
  
                  <Text
                    style={
                      styles.mobileText
                    }
                  >
                    📍 {item.venue}
                  </Text>
  
                  <Text
                    style={
                      styles.mobileText
                    }
                  >
                    📅{" "}
                    {item.event_date}
                  </Text>
  
                  <Text
                    style={
                      styles.mobileText
                    }
                  >
                    🕒{" "}
                    {item.event_time}
                  </Text>
  
                  <Text
                    style={
                      styles.mobileText
                    }
                  >
                    👥 Capacity :
                    {" "}
                    {
                      item.capacity
                    }
                  </Text>
  
                  <View
                    style={
                      styles.mobileBottom
                    }
                  >
                    <View
  style={[
    styles.statusBadge,
    item.status === "Upcoming"
      ? styles.upcoming
      : styles.completed,
  ]}
>
  <Text style={styles.statusText}>
    {item.status}
  </Text>
</View>
  
                    <View
  style={{
    flexDirection: "row",
    alignItems: "center",
  }}
>
  <TouchableOpacity
    style={styles.editBtn}
    onPress={() =>
      openEditModal(item)
    }
  >
    <Text
      style={{
        color: "#fff",
        fontWeight: "700",
      }}
    >
      Edit
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.deleteBtn,
      {
        marginLeft: 10,
      },
    ]}
    onPress={() =>
      deleteEvent(
        item.event_id
      )
    }
  >
    <Text
      style={{
        color: "#fff",
      }}
    >
      Delete
    </Text>
  </TouchableOpacity>
</View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={{
                width: "100%",
                justifyContent: "center",
              }}
            >
              <View
                style={[
                  styles.tableContainer,
                  {
                       width: "100%", // 90% width
                       minWidth: 1000,
                    
                  },
                ]}
              >
                {/* TABLE HEAD */}
  
                <View
                  style={styles.tableHead}
                >
                  <Text style={[styles.headText, { width: 100 }]}>
  Image
</Text>

<Text style={[styles.headText, { width: 180 ,marginLeft:150 }]}>
  Title
</Text>

<Text style={[styles.headText, { width: 180 }]}>
  Date
</Text>

<Text style={[styles.headText, { width: 180 }]}>
  Venue
</Text>

<Text style={[styles.headText, { width: 200 }]}>
  Capacity
</Text>

<Text style={[styles.headText, { width: 180 }]}>
  Status
</Text>

<Text style={[styles.headText, { width: 100 }]}>
  Action
</Text>
                </View>
  
                {/* ROWS */}
  
                {events.map(
                  (item) => (
                    <TouchableOpacity
  key={item.event_id}
  style={styles.tableRow}
  activeOpacity={0.8}
  onPress={() =>
    openDetails(item)
  }
>
                      <Image
                        source={{
                          uri:
                            API +
                            item.cover_photo,
                        }}
                        style={
                          styles.tableImage
                        }
                      />
  
                      <Text
                        style={[
                          styles.rowText,
                          {
                            width: 180,
                            marginLeft:120 ,
                           
                          },
                        ]}
                       
                      >
                        {item.title}
                      </Text>
  
                      <Text
  style={[
    styles.rowText,
    {
      width: 180,
    },
  ]}
>
  {new Date(
    item.event_date
  ).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  )}
</Text>
  
                      <Text
                        style={[
                          styles.rowText,
                          {
                            width: 180,
                            marginLeft:30 ,
                          },
                        ]}
                      >
                        {item.venue}
                      </Text>
  
                      <Text
                        style={[
                          styles.rowText,
                          {
                            width: 180,
                          },
                        ]}
                      >
                        {
                          item.capacity
                        }
                      </Text>
  
                      <View
                        style={{
                          width: 180,
                         
                    
                        }}
                      >
                        <View
  style={[
    styles.statusBadge,
    item.status === "Upcoming"
      ? styles.upcoming
      : styles.completed,
  ]}
>
  <Text style={styles.statusText}>
    {item.status}
  </Text>
</View>
                      </View>
  
                      <View
  style={{
    flexDirection: "row",
    alignItems: "center",
  }}
>
  <TouchableOpacity
    style={styles.editBtn}
    onPress={() =>
      openEditModal(item)
    }
  >
    <Text
      style={{
        color: "#fff",
        fontWeight: "700",
      }}
    >
      Edit
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.deleteBtn,
      {
        marginLeft: 10,
      },
    ]}
    onPress={() =>
      deleteEvent(
        item.event_id
      )
    }
  >
    <Text
      style={{
        color: "#fff",
      }}
    >
      Delete
    </Text>
  </TouchableOpacity>
</View>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </ScrollView>
          )}
        </ScrollView>
  
        {/* SIDEBAR */}
  
        <Sidebar
          drawerOpen={drawerOpen}
          translateX={translateX}
          closeDrawer={closeDrawer}
          handleMenu={handleMenu}
        />
  {/* =========================
EDIT MODAL
========================= */}

<Modal
  visible={editModal}
  animationType="slide"
>
  <ScrollView
    style={styles.modal}
  >
    <Text
      style={
        styles.modalTitle
      }
    >
      Update Event
    </Text>

    <TextInput
      placeholder="Title"
      style={styles.input}
      value={form.title}
      onChangeText={(t) =>
        handleChange(
          "title",
          t
        )
      }
    />

    <TextInput
      placeholder="Description"
      multiline
      style={[
        styles.input,
        {
          height: 120,
        },
      ]}
      value={
        form.description
      }
      onChangeText={(t) =>
        handleChange(
          "description",
          t
        )
      }
    />

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

    {Platform.OS ===
    "web" ? (
      <input
        type="date"
        value={
          form.event_date
        }
        onChange={(e) =>
          handleChange(
            "event_date",
            e.target.value
          )
        }
        style={{
          height: 58,
          borderRadius: 16,
          border:
            "1px solid #ddd",
          paddingLeft: 15,
          marginBottom: 18,
        }}
      />
    ) : (
      <>
        <TouchableOpacity
          style={
            styles.input
          }
          onPress={() =>
            setShowDate(
              true
            )
          }
        >
          <Text>
            {form.event_date ||
              "Select Date"}
          </Text>
        </TouchableOpacity>

        {showDate && (
          <DateTimePicker
            value={
              new Date()
            }
            mode="date"
            display="default"
            onChange={(
              event,
              selectedDate
            ) => {
              setShowDate(
                false
              );

              if (
                selectedDate
              ) {
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

    {Platform.OS ===
    "web" ? (
      <input
        type="time"
        value={
          form.event_time
        }
        onChange={(e) =>
          handleChange(
            "event_time",
            `${e.target.value}:00`
          )
        }
        style={{
          height: 58,
          borderRadius: 16,
          border:
            "1px solid #ddd",
          paddingLeft: 15,
          marginBottom: 18,
        }}
      />
    ) : (
      <>
        <TouchableOpacity
          style={
            styles.input
          }
          onPress={() =>
            setShowTime(
              true
            )
          }
        >
          <Text>
            {form.event_time ||
              "Select Time"}
          </Text>
        </TouchableOpacity>

        {showTime && (
          <DateTimePicker
            value={
              new Date()
            }
            mode="time"
            is24Hour
            display="default"
            onChange={(
              event,
              selectedTime
            ) => {
              setShowTime(
                false
              );

              if (
                selectedTime
              ) {
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

    <TextInput
      placeholder="Capacity"
      keyboardType="numeric"
      style={styles.input}
      value={
        form.capacity
      }
      onChangeText={(t) =>
        handleChange(
          "capacity",
          t
        )
      }
    />

    {/* IMAGE */}

    <TouchableOpacity
      style={
        styles.selectBtn
      }
      onPress={pickImage}
    >
      <Ionicons
        name="image-outline"
        size={22}
        color="#4C6FFF"
      />

      <Text
        style={
          styles.selectText
        }
      >
        Change Cover Photo
      </Text>
    </TouchableOpacity>

    {form.cover_photo ? (
      <Image
        source={{
          uri:
            form.cover_photo,
        }}
        style={
          styles.preview
        }
      />
    ) : null}

    {/* UPDATE */}

    <TouchableOpacity
      style={
        styles.createBtn
      }
      onPress={updateEvent}
    >
      <Text
        style={
          styles.createText
        }
      >
        Update Event
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={
        styles.cancelBtn
      }
      onPress={() =>
        setEditModal(
          false
        )
      }
    >
      <Text
        style={
          styles.cancelText
        }
      >
        Cancel
      </Text>
    </TouchableOpacity>
  </ScrollView>
</Modal>
        {/* MODAL */}
  
        <Modal
          visible={modalVisible}
          animationType="slide"
        >
          <ScrollView
            style={styles.modal}
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Create Event
            </Text>
  
            <TextInput
              placeholder="Title"
              style={styles.input}
              value={form.title}
              onChangeText={(t) =>
                handleChange(
                  "title",
                  t
                )
              }
            />
  
            <TextInput
              placeholder="Description"
              multiline
              style={[
                styles.input,
                {
                  height: 120,
                },
              ]}
              value={
                form.description
              }
              onChangeText={(t) =>
                handleChange(
                  "description",
                  t
                )
              }
            />
  
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
  
            {Platform.OS ===
            "web" ? (
              <input
                type="date"
                value={
                  form.event_date
                }
                onChange={(e) =>
                  handleChange(
                    "event_date",
                    e.target.value
                  )
                }
                style={{
                  height: 58,
                  borderRadius: 16,
                  border:
                    "1px solid #ddd",
                  paddingLeft: 15,
                  marginBottom: 18,
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={
                    styles.input
                  }
                  onPress={() =>
                    setShowDate(
                      true
                    )
                  }
                >
                  <Text>
                    {form.event_date ||
                      "Select Date"}
                  </Text>
                </TouchableOpacity>
  
                {showDate && (
                  <DateTimePicker
                    value={
                      new Date()
                    }
                    mode="date"
                    display="default"
                    onChange={(
                      event,
                      selectedDate
                    ) => {
                      setShowDate(
                        false
                      );
  
                      if (
                        selectedDate
                      ) {
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
  
            {Platform.OS ===
            "web" ? (
              <input
                type="time"
                value={
                  form.event_time
                }
                onChange={(e) =>
                  handleChange(
                    "event_time",
                    `${e.target.value}:00`
                  )
                }
                style={{
                  height: 58,
                  borderRadius: 16,
                  border:
                    "1px solid #ddd",
                  paddingLeft: 15,
                  marginBottom: 18,
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={
                    styles.input
                  }
                  onPress={() =>
                    setShowTime(
                      true
                    )
                  }
                >
                  <Text>
                    {form.event_time ||
                      "Select Time"}
                  </Text>
                </TouchableOpacity>
  
                {showTime && (
                  <DateTimePicker
                    value={
                      new Date()
                    }
                    mode="time"
                    is24Hour={
                      true
                    }
                    display="default"
                    onChange={(
                      event,
                      selectedTime
                    ) => {
                      setShowTime(
                        false
                      );
  
                      if (
                        selectedTime
                      ) {
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
  
            <TextInput
              placeholder="Capacity"
              keyboardType="numeric"
              style={styles.input}
              value={
                form.capacity
              }
              onChangeText={(t) =>
                handleChange(
                  "capacity",
                  t
                )
              }
            />
  
            {/* IMAGE */}
  
            <TouchableOpacity
              style={
                styles.selectBtn
              }
              onPress={pickImage}
            >
              <Ionicons
                name="image-outline"
                size={22}
                color="#4C6FFF"
              />
  
              <Text
                style={
                  styles.selectText
                }
              >
                Select Cover
                Photo
              </Text>
            </TouchableOpacity>
  
            {form.cover_photo ? (
              <Image
                source={{
                  uri:
                    form.cover_photo,
                }}
                style={
                  styles.preview
                }
              />
            ) : null}
  
            {/* BUTTONS */}
  
            <TouchableOpacity
              style={
                styles.createBtn
              }
              onPress={createEvent}
            >
              <Text
                style={
                  styles.createText
                }
              >
                Create Event
              </Text>
            </TouchableOpacity>
  
            <TouchableOpacity
              style={
                styles.cancelBtn
              }
              onPress={() =>
                setModalVisible(
                  false
                )
              }
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Modal>
        {/* =========================
EVENT DETAILS MODAL
========================= */}

{/* =========================
EVENT DETAILS MODAL
========================= */}

<Modal
  visible={detailsModal}
  animationType="slide"
>
  <SafeAreaView
    style={{
      flex: 1,
      backgroundColor: "#F5F6FA",
    }}
  >
    <ScrollView
      showsVerticalScrollIndicator={false}
    >
      {selectedEvent && (
        <>
          {/* HEADER */}

          <View
            style={styles.detailsHeader}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() =>
                setDetailsModal(false)
              }
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#000"
              />

              <Text
                style={styles.backText}
              >
                Back to Events
              </Text>
            </TouchableOpacity>

            <View
              style={styles.actionRow}
            >
              <TouchableOpacity
                style={
                  styles.detailsEditBtn
                }
                onPress={() => {
                  setDetailsModal(
                    false
                  );

                  openEditModal(
                    selectedEvent
                  );
                }}
              >
                <Feather
                  name="edit"
                  size={18}
                  color={PRIMARY}
                />

                <Text
                  
                >
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.detailsDeleteBtn
                }
                onPress={() => {
                  deleteEvent(
                    selectedEvent.event_id
                  );

                  setDetailsModal(
                    false
                  );
                }}
              >
                <Feather
                  name="trash-2"
                  size={18}
                  color="#EF4444"
                />

                <Text
                  
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TITLE */}

          <View
            style={styles.titleRow}
          >
            <Text
              style={styles.title}
            >
              {selectedEvent.title}
            </Text>

            <View
              style={[
                styles.statusBadge,
                selectedEvent.status ===
                "Upcoming"
                  ? styles.upcoming
                  : styles.completed,
              ]}
            >
              <Text
                style={
                  styles.statusText
                }
              >
                {
                  selectedEvent.status
                }
              </Text>
            </View>
          </View>

          {/* INFO */}

          <View
            style={
              styles.infoContainer
            }
          >
            <View
              style={
                styles.infoItem
              }
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color="#555"
              />

<Text
  style={styles.infoText}
>
  {new Date(
    selectedEvent.event_date
  ).toLocaleDateString()}
</Text>
            </View>

            <View
              style={
                styles.infoItem
              }
            >
              <Ionicons
                name="time-outline"
                size={22}
                color="#555"
              />

              <Text
                style={
                  styles.infoText
                }
              >
                {
                  selectedEvent.event_time
                }
              </Text>
            </View>

            <View
              style={
                styles.infoItem
              }
            >
              <Ionicons
                name="location-outline"
                size={22}
                color="#555"
              />

              <Text
                style={
                  styles.infoText
                }
              >
                {
                  selectedEvent.venue
                }
              </Text>
            </View>
          </View>

          {/* COVER IMAGE */}

          <Image
            source={{
              uri:
                API +
                selectedEvent.cover_photo,
            }}
            style={
              styles.coverImage
            }
          />
  
  {selectedEvent.status === "Upcoming" && (
  <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Event Countdown
          </Text>

          <View style={styles.countdownRow}>
            <View
              style={styles.countBox}
            >
             <Text style={styles.countNumber}>
  {countdown.days}
</Text>
              <Text
                style={styles.countLabel}
              >
                Days
              </Text>
            </View>

            <View
              style={styles.countBox}
            >
              <Text style={styles.countNumber}>
  {countdown.hours}
</Text>

              <Text
                style={styles.countLabel}
              >
                Hours
              </Text>
            </View>

            <View
              style={styles.countBox}
            >
              <Text style={styles.countNumber}>
  {countdown.minutes}
</Text>

              <Text
                style={styles.countLabel}
              >
                Minutes
              </Text>
            </View>

            <View
              style={styles.countBox}
            >
             <Text style={styles.countNumber}>
  {countdown.seconds}
</Text>

              <Text
                style={styles.countLabel}
              >
                Seconds
              </Text>
            </View>
          </View>
        </View>


)}
          {/* DETAILS */}

          <View
            style={styles.card}
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Event Details
            </Text>

            <DetailRow
              icon="document-text-outline"
              label="Description"
              value={
                selectedEvent.description
              }
            />

            <DetailRow
              icon="location-outline"
              label="Venue"
              value={
                selectedEvent.venue
              }
            />

            <DetailRow
              icon="people-outline"
              label="Capacity"
              value={`${selectedEvent.capacity} People`}
            />

<DetailRow
  icon="calendar-outline"
  label="Date"
  value={
    new Date(
      selectedEvent.event_date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    )
  }
/>

            <DetailRow
              icon="time-outline"
              label="Time"
              value={
                selectedEvent.event_time
              }
            />
          </View>

          {/* GALLERY */}
          <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            RSVP Overview
          </Text>

          <View style={styles.rsvpBox}>
            <View
              style={styles.rsvpTop}
            >
              <View
                style={[
                  styles.rsvpStatus,
                  {
                    backgroundColor:
                      "#DCFCE7",
                  },
                ]}
              >
                <Text style={styles.rsvpNumber}>
  {rsvp.going}
</Text>
                <Text
                  style={
                    styles.rsvpLabel
                  }
                >
                  Going
                </Text>
              </View>

              <View
                style={[
                  styles.rsvpStatus,
                  {
                    backgroundColor:
                      "#FEF3C7",
                  },
                ]}
              >
                <Text style={styles.rsvpNumber}>
  {rsvp.maybe}
</Text>

                <Text
                  style={
                    styles.rsvpLabel
                  }
                >
                  Maybe
                </Text>
              </View>

              <View
                style={[
                  styles.rsvpStatus,
                  {
                    backgroundColor:
                      "#FEE2E2",
                  },
                ]}
              >
                <Text style={styles.rsvpNumber}>
  {rsvp.notGoing}
</Text>

                <Text
                  style={
                    styles.rsvpLabel
                  }
                >
                  Not Going
                </Text>
              </View>
            </View>

            <View
              style={styles.progressBar}
            >
              <View
                style={
                  styles.progressFill
                }
              />
            </View>

            <Text style={styles.progressText}>
  Total Responses : {rsvp.total} / {selectedEvent.capacity}
</Text>
          </View>
        </View>

          {selectedEvent.status ===
            "Completed" && (
            <>
              <View
                style={styles.card}
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Upload Event
                  Photos
                </Text>

                <TouchableOpacity
                  style={
                    styles.uploadBox
                  }
                  onPress={
                    pickGalleryImages
                  }
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={40}
                    color={PRIMARY}
                  />

                  <Text
                    style={
                      styles.uploadTitle
                    }
                  >
                    Upload Photos
                  </Text>

                  <Text
                    style={
                      styles.uploadSub
                    }
                  >
                    Upload photos
                    from event
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={styles.card}
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Event Gallery
                </Text>

                <FlatList
                  horizontal
                  data={gallery}
                  keyExtractor={(
                    item
                  ) =>
                    item.gallery_id.toString()
                  }
                  renderItem={({
                    item,
                  }) => (
                    <Image
                      source={{
                        uri:
                          API +
                          item.photo_url,
                      }}
                      style={
                        styles.galleryImage
                      }
                    />
                  )}
                  showsHorizontalScrollIndicator={
                    false
                  }
                />
              </View>
            </>
          )}

          <View
            style={{
              height: 40,
            }}
          />
        </>
      )}
       <View
          style={[
            styles.card,
            {
              marginBottom: 40,
            },
          ]}
        >
          <Text style={styles.sectionTitle}>
            Event Timeline
          </Text>

          <View
            style={
              styles.timelineContainer
            }
          >
            <View
              style={styles.timelineItem}
            >
              <View
                style={
                  styles.timelineCircle
                }
              >
                <MaterialIcons
                  name="check"
                  size={16}
                  color="#fff"
                />
              </View>

              <Text
                style={
                  styles.timelineText
                }
              >
                Created
              </Text>
            </View>

            <View
              style={
                styles.timelineLine
              }
            />

            <View
              style={styles.timelineItem}
            >
              <View
                style={
                  styles.timelineCircle
                }
              >
                <MaterialIcons
                  name="check"
                  size={16}
                  color="#fff"
                />
              </View>

              <Text
                style={
                  styles.timelineText
                }
              >
                Published
              </Text>
            </View>

            <View
              style={
                styles.timelineLine
              }
            />

            <View
              style={styles.timelineItem}
            >
              <View
                style={
                  styles.timelineCircle
                }
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "700",
                  }}
                >
                  3
                </Text>
              </View>

              <Text
                style={
                  styles.timelineText
                }
              >
                Event Day
              </Text>
            </View>
          </View>
        </View>
    </ScrollView>
  </SafeAreaView>
</Modal>
      </SafeAreaView>
    );
        }
  const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor:
          "#F5F6FA",
      },
  
      topBar: {
        height: 65,
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent:
          "space-between",
        paddingHorizontal: 18,
        elevation: 3,
      },
      coverImage: {
        width: "98%",   // ✅ ADD THIS
        height: 240,
        borderRadius: 0,
        alignSelf: "center",
        marginTop: 20,
      },
      topTitle: {
        fontSize: 18,
        fontWeight: "700",
      },
  
      headerRow: {
        flexDirection: "row",
        justifyContent:
          "space-between",
        alignItems: "center",
        marginBottom: 25,
      },
  
      pageTitle: {
        fontSize: 34,
        fontWeight: "700",
      },
  
      breadcrumb: {
        marginTop: 5,
        color: "#666",
      },
      editBtn: {
        backgroundColor: "#3B82F6",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
      },
      addBtn: {
        backgroundColor:
          PRIMARY,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 14,
      },
  
      addBtnText: {
        color: "#fff",
        fontWeight: "700",
      },
  
      statsRow: {
        flexDirection: "row",
        marginBottom: 20,
      },
  
      statCard: {
        flex: 1,
        backgroundColor: "#fff",
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderRadius: 22,
        marginRight: 15,
        marginBottom: 15,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 130,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
      },
      statNumber: {
        fontSize: 30,
        fontWeight: "700",
        color: PRIMARY,
        textAlign:"center",
      },
  
      statLabel: {
        marginTop: 8,
        color: "#666",
        textAlign:"center",
      },
  
      mobileCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 15,
        marginBottom: 18,
      },
  
      mobileImage: {
        width: "100%",
        height: 200,
        borderRadius: 16,
      },
  
      mobileTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginTop: 15,
      },
  
      mobileDesc: {
        color: "#666",
        marginTop: 8,
        lineHeight: 22,
      },
  
      mobileText: {
        marginTop: 10,
        color: "#444",
      },
      countdownRow: {
        flexDirection: "row",
        justifyContent:"space-between",
      },
    
      countBox: {
        width: 70,
        height: 80,
        backgroundColor: "#F5F6FA",
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
      },
    
      countNumber: {
        fontSize: 28,
        fontWeight: "800",
      },
    
      countLabel: {
        marginTop: 5,
        color: "#666",
      },
    
      mobileBottom: {
        marginTop: 18,
        flexDirection: "row",
        justifyContent:
          "space-between",
        alignItems: "center",
      },
  
      tableContainer: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        width:'100%',
      },
  
      tableHead: {
        flexDirection: "row",
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor:
          "#eee",
          width:'100%',
      },
  
      headText: {
        fontWeight: "700",
        color: "#666",
        fontSize: 14,
      },
      detailsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingTop: 15,
      },
      
      backBtn: {
        flexDirection: "row",
        alignItems: "center",
      },
      
      backText: {
        fontSize: 15,
        fontWeight: "600",
        marginLeft: 5,
      },
      
      actionRow: {
        flexDirection: "row",
      },
      
      detailsEditBtn: {
        borderWidth: 1,
        borderColor: PRIMARY,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        marginRight: 10,
      },
      
      detailsDeleteBtn: {
        borderWidth: 1,
        borderColor: "#EF4444",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
      },
      
      titleRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        marginTop: 20,
      },
      
      title: {
        fontSize: 30,
        fontWeight: "800",
        flex: 1,
      },
      
      infoContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 18,
        marginTop: 18,
      },
      
      infoItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 18,
        marginBottom: 10,
      },
      
      infoText: {
        marginLeft: 6,
        color: "#444",
        fontWeight: "500",
      },
      

      
      card: {
        backgroundColor: "#fff",
        marginHorizontal: 18,
        marginTop: 20,
        borderRadius: 24,
        padding: 20,
      },
      
      sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 18,
      },
      
      uploadBox: {
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#D6D6FF",
        borderRadius: 20,
        paddingVertical: 35,
        alignItems: "center",
      },
      
      uploadTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginTop: 10,
        color: PRIMARY,
      },
      
      uploadSub: {
        color: "#666",
        marginTop: 8,
        textAlign: "center",
        paddingHorizontal: 20,
      },
      
      galleryImage: {
        width: 160,
        height: 140,
        borderRadius: 18,
        marginRight: 14,
      },
      tableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor:
          "#f2f2f2",
      },
      detailText: {
        fontSize: 16,
        marginBottom: 12,
        color: "#333",
        fontWeight: "500",
      },
      tableImage: {
        width: 90,
        height: 70,
        borderRadius: 14,
        marginRight: 15,
      },
  
      rowText: {
        color: "#333",
        fontSize: 14,
      },
  
      statusBadge: {
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: "flex-start",
      
      },
  
      upcoming: {
        backgroundColor:
          "#DCFCE7",
      },
  
      completed: {
        backgroundColor:
          "#E5E7EB",
      },
  
      statusText: {
        fontWeight: "700",
        fontSize: 12,
      },
  
      deleteBtn: {
        backgroundColor:
          "#EF4444",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
      
      },
  
      modal: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
      },
  
      modalTitle: {
        fontSize: 28,
        fontWeight: "700",
        marginTop: 20,
        marginBottom: 20,
      },
  
      input: {
        height: 58,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 16,
        paddingHorizontal: 15,
        justifyContent: "center",
        marginBottom: 18,
        backgroundColor:
          "#F8F9FF",
      },
  
      selectBtn: {
        height: 58,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor:
          "#F8F9FF",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
      },
  
      selectText: {
        marginLeft: 10,
        color: PRIMARY,
        fontWeight: "700",
      },
  
      preview: {
        width: "100%",
        height: 220,
        borderRadius: 18,
        marginTop: 18,
      },
  
      createBtn: {
        backgroundColor:
          PRIMARY,
        paddingVertical: 18,
        borderRadius: 18,
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
        marginBottom: 50,
      },
  
      cancelText: {
        color: "red",
        fontWeight: "700",
      },
      rsvpBox: {
    marginTop: 10,
  },

  rsvpTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
  },

  rsvpStatus: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },

  rsvpNumber: {
    fontSize: 24,
    fontWeight: "800",
  },

  rsvpLabel: {
    marginTop: 6,
    fontWeight: "600",
  },

  progressBar: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 20,
  },

  progressFill: {
    width: "24%",
    height: "100%",
    backgroundColor: PRIMARY,
  },

  progressText: {
    marginTop: 10,
    color: "#666",
    fontWeight: "600",
  },
  timelineContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  timelineItem: {
    alignItems: "center",
  },

  timelineCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },

  timelineText: {
    marginTop: 8,
    fontWeight: "600",
    fontSize: 12,
  },

  timelineLine: {
    flex: 1,
    height: 3,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 10,
  },

});