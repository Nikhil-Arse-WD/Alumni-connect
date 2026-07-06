// app/events.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";



const { width } =
  Dimensions.get("window");

const isWeb =
  Platform.OS === "web";

const isTablet =
  width >= 768;

const isDesktop =
  width >= 1100;

const API =
  "http://10.232.80.175:2000";

export default function App() {
    const [currentTime, setCurrentTime] =
  useState(new Date());
  const [user, setUser] =
    useState<any>(null);

  const [allRSVPs, setAllRSVPs] =
    useState<any[]>([]);

  const [activeTab, setActiveTab] =
    useState("Upcoming");

  const [selectedEvent, setSelectedEvent] =
    useState<any>(null);

  const [selectedPastEvent, setSelectedPastEvent] =
    useState<any>(null);

  const [rsvpEvents, setRsvpEvents] =
    useState<any[]>([]);

  const [events, setEvents] =
    useState<any[]>([]);

  const [pastEvents, setPastEvents] =
    useState<any[]>([]);

  const [pastEventGallery, setPastEventGallery] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");
    const [searchFocused, setSearchFocused] = useState(false);
   
  ////////////////////////////////////////////////////////
  // LOAD
  ////////////////////////////////////////////////////////

  useEffect(() => {
    fetchEvents();

    fetchRSVPs();

    loadUser();
  }, []);

  ////////////////////////////////////////////////////////
  // USER
  ////////////////////////////////////////////////////////

  const loadUser = async () => {
    try {
      const data =
        await AsyncStorage.getItem(
          "user"
        );

      if (data) {
        const parsed =
          JSON.parse(data);

        setUser(parsed);
      }
    } catch (err) {
      console.log(err);
    }
  };

  ////////////////////////////////////////////////////////
  // FETCH EVENTS
  ////////////////////////////////////////////////////////
  const formatDate = (date: any) => {
    const d = new Date(date);
  
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const res =
        await axios.get(
          `${API}/events`
        );

      const allEvents =
        res.data.events || [];

      const upcoming =
        allEvents.filter(
          (item: any) =>
            item.status ===
            "Upcoming"
        );

      const completed =
        allEvents.filter(
          (item: any) =>
            item.status ===
            "Completed"
        );

      setEvents(upcoming);

      setPastEvents(completed);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  ////////////////////////////////////////////////////////
  // RSVP SAVE
  ////////////////////////////////////////////////////////

  const handleRSVP = async (
    event: any,
    response: string
  ) => {
    try {
      const payload = {
        event_id: event.event_id,
        alumni_id: user?.id,
        response,
      };

      await axios.post(
        `${API}/rsvp`,
        payload
      );

      await fetchRSVPs();

      setSelectedEvent(null);

      if (Platform.OS === "web") {
        window.alert(
          `Your RSVP "${response}" has been saved successfully`
        );
      } else {
        Alert.alert(
          "Success ✅",
          `Your response "${response}" has been saved.`
        );
      }
    } catch (error: any) {
      console.log(
        error.response?.data
      );

      if (Platform.OS === "web") {
        window.alert(
          "Failed to save RSVP"
        );
      } else {
        Alert.alert(
          "Error ❌",
          "Failed to save RSVP"
        );
      }
    }
  };

  ////////////////////////////////////////////////////////
  // FETCH RSVP
  ////////////////////////////////////////////////////////

  const fetchRSVPs = async () => {
    try {
      const data =
        await AsyncStorage.getItem(
          "user"
        );

      if (!data) return;

      const user =
        JSON.parse(data);

      const res =
        await axios.get(
          `${API}/rsvp/${user.id}`
        );

      setAllRSVPs(
        res.data.rsvps || []
      );

      setRsvpEvents(
        res.data.rsvps || []
      );
    } catch (err) {
      console.log(err);
    }
  };

  ////////////////////////////////////////////////////////
  // SEARCH
  ////////////////////////////////////////////////////////

  const filteredEvents =
    events.filter((item) =>
      item.title
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  const filteredPastEvents =
    pastEvents.filter((item) =>
      item.title
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );
    const allFilteredEvents = search.trim().length > 0
    ? [
        ...events.filter(e => e.title?.toLowerCase().includes(search.toLowerCase())),
        ...pastEvents.filter(e => e.title?.toLowerCase().includes(search.toLowerCase())),
      ]
    : [];
////////////////////////////////////////////////////////
// LIVE CLOCK + AUTO REFRESH
////////////////////////////////////////////////////////

useEffect(() => {

  const timer = setInterval(() => {

    setCurrentTime(new Date());

  }, 1000);

  return () => clearInterval(timer);

}, []);
  ////////////////////////////////////////////////////////
// COUNTDOWN
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
// COUNTDOWN
////////////////////////////////////////////////////////

const [countdown, setCountdown] =
  useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

////////////////////////////////////////////////////////
// LIVE COUNTDOWN
////////////////////////////////////////////////////////

useEffect(() => {

  if (!selectedEvent) return;

  const timer = setInterval(
    async () => {
  
      try {
  
        const d = new Date(selectedEvent.event_date);
  
        const cleanDate =
          `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")}`;
  
        const eventDateTime =
          `${cleanDate}T${selectedEvent.event_time}`;
  
        const eventDate =
          new Date(eventDateTime).getTime();
  
        const now =
          new Date().getTime();
  
        const distance =
          eventDate - now;
  
        ////////////////////////////////////////////////////
        // EVENT COMPLETED
        ////////////////////////////////////////////////////
  
        if (distance <= 0) {

          setCountdown({
            days: "00",
            hours: "00",
            minutes: "00",
            seconds: "00",
          });
        
          try {
        
            // UPDATE DATABASE
            await axios.put(
              `${API}/events/${selectedEvent.event_id}`,
              {
                status: "Completed",
              }
            );
        
            // CLOSE MODAL
            setSelectedEvent(null);
        
            // REFRESH EVENTS
            await fetchEvents();
        
          } catch (err) {
        
            console.log(
              "Status Update Error",
              err
            );
        
          }
        
          clearInterval(timer);
        
          return;
        }
        ////////////////////////////////////////////////////
        // CALCULATIONS
        ////////////////////////////////////////////////////

        const days =
          Math.floor(
            distance /
              (1000 *
                60 *
                60 *
                24)
          );

        const hours =
          Math.floor(
            (distance %
              (1000 *
                60 *
                60 *
                24)) /
              (1000 *
                60 *
                60)
          );

        const minutes =
          Math.floor(
            (distance %
              (1000 *
                60 *
                60)) /
              (1000 * 60)
          );

        const seconds =
          Math.floor(
            (distance %
              (1000 * 60)) /
              1000
          );

        ////////////////////////////////////////////////////
        // SET STATE
        ////////////////////////////////////////////////////

        setCountdown({
          days: String(days).padStart(
            2,
            "0"
          ),

          hours: String(
            hours
          ).padStart(2, "0"),

          minutes: String(
            minutes
          ).padStart(2, "0"),

          seconds: String(
            seconds
          ).padStart(2, "0"),
        });

      } catch (err) {

        console.log(
          "Countdown Error",
          err
        );

      }

    },

    1000
  );

  return () =>
    clearInterval(timer);

}, [selectedEvent]);

  ////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////

  return (
    <SafeAreaView
      style={styles.container}
    >
    

      <StatusBar
        backgroundColor="#0F172A"
        barStyle="light-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HERO */}
        <LinearGradient
    colors={["#312EBA", "#5B21B6", "#EC1D8F"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0}}
  style={styles.topSection}
>
  <Text style={styles.heading}>Alumni Events</Text>
  <Text style={styles.subHeading}>Reconnect • Network • Celebrate</Text>

  {/* SEARCH BOX */}
  <View style={[styles.searchBox, searchFocused && { borderWidth: 2, borderColor: "#818CF8" }]}>
    <Ionicons name="search" size={20} color="#64748b" />
    <TextInput
      placeholder="Search all events..."
      placeholderTextColor="#94a3b8"
      style={styles.searchInput}
      value={search}
      onChangeText={setSearch}
      onFocus={() => setSearchFocused(true)}
      onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
    />
    {search.trim().length > 0 && (
      <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
        <Ionicons name="close" size={16} color="#64748B" />
      </TouchableOpacity>
    )}
  </View>

  {/* DROPDOWN — position absolute nahi, normal flow mein */}
  {search.trim().length > 0 && (
    <View style={styles.searchDropdown}>

      <View style={styles.dropdownHeader}>
        <Text style={styles.dropdownHeaderLeft}>RESULTS</Text>
        <Text style={styles.dropdownHeaderRight}>{allFilteredEvents.length} found</Text>
      </View>

      {allFilteredEvents.length === 0 ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <Ionicons name="search-outline" size={32} color="#CBD5E1" />
          <Text style={styles.noResultText}>No events found</Text>
        </View>
      ) : (
        allFilteredEvents.slice(0, 6).map((item) => (
          <TouchableOpacity
            key={item.event_id}
            style={styles.dropdownItem}
            onPress={() => {
              setSearch("");
              setSearchFocused(false);
              if (item.status === "Upcoming") {
                setSelectedEvent(item);
              } else {
                setSelectedPastEvent(item);
                axios.get(`${API}/event-gallery/${item.event_id}`)
                  .then(res => setPastEventGallery(res.data.gallery || []))
                  .catch(err => console.log(err));
              }
            }}
          >
            <Image
              source={{ uri: API + item.cover_photo }}
              style={styles.dropdownThumb}
            />
            <View style={styles.dropdownInfo}>
              <Text style={styles.dropdownTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.dropdownMeta}>📅 {formatDate(item.event_date)} · 📍 {item.venue}</Text>
            </View>
            <View style={[
              styles.dropdownBadge,
              item.status === "Upcoming" ? styles.dropdownUpcoming : styles.dropdownCompleted
            ]}>
              <Text style={[
                styles.dropdownBadgeText,
                { color: item.status === "Upcoming" ? "#4F46E5" : "#64748B" }
              ]}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

    </View>
  )}

</LinearGradient>
        {/* TABS */}

        <View style={styles.tabsRow}>
          {[
            "Upcoming",
            "My RSVPs",
            "Past Events",
          ].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,

                activeTab ===
                  tab &&
                  styles.activeTabBtn,
              ]}
              onPress={() =>
                setActiveTab(tab)
              }
            >
              <Text
                style={[
                  styles.tabText,

                  activeTab ===
                    tab &&
                    styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* UPCOMING */}

   

        {activeTab === "Upcoming" && (
  <View>
    {filteredEvents.map((item) => (

      <View
        key={item.event_id}
        style={styles.heroSection}
      >

        {/* BACKGROUND IMAGE */}
        <Image
          source={{
            uri: API + item.cover_photo,
          }}
          style={styles.heroBg}
        />

        {/* DARK OVERLAY */}
        <View style={styles.overlay} />

        {/* CONTENT */}
        <View style={styles.heroContent}>

          {/* TAG */}
          <View style={styles.liveBadge}>
            <Ionicons
              name="videocam"
              size={14}
              color="#fff"
            />

            <Text style={styles.liveText}>
              UPCOMING EVENT
            </Text>
          </View>

          {/* TITLE */}
          <Text style={styles.heroMainTitle}>
            {item.title}
          </Text>

          {/* ORGANIZER */}
          <Text style={styles.organizer}>
            Organized by Alumni Association
          </Text>

          {/* INFO */}
          <View style={styles.heroInfoRow}>

            <View style={styles.infoItem}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#fff"
              />

              <Text style={styles.infoText}>
                {formatDate(item.event_date)}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#fff"
              />

              <Text style={styles.infoText}>
                {item.event_time}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons
                name="location-outline"
                size={20}
                color="#fff"
              />

              <Text style={styles.infoText}>
                {item.venue}
              </Text>
            </View>

          </View>

          {/* DESCRIPTION */}
          <Text
            numberOfLines={2}
            style={styles.heroDescription}
          >
            {item.description}
          </Text>

          {/* BUTTONS */}
          <View style={styles.heroBtnRow}>

            <TouchableOpacity
              style={styles.heroBtn}
              onPress={() =>
                setSelectedEvent(item)
              }
            >
              <Text style={styles.heroBtnText}>
                View Details
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#fff"
              />
            </TouchableOpacity>

           

          </View>
        </View>
      </View>
    ))}
  </View>
)}
        {/* MY RSVP */}

        {activeTab === "My RSVPs" && (
  <>
    {rsvpEvents.length === 0 ? (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={90} color="#4F46E5" />
        <Text style={styles.emptyTitle}>No RSVP Events</Text>
      </View>
    ) : (
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        {rsvpEvents.map((event: any) => (
         
         <View key={event.event_id} style={styles.rsvpCardModern}>

  {/* IMAGE */}
  <Image
    source={{
      uri: event.cover_photo?.startsWith("http")
        ? event.cover_photo
        : `${API}${event.cover_photo}`,
    }}
    style={styles.rsvpImageModern}
  />

  {/* CONTENT */}
  <View style={styles.rsvpBodyModern}>

    {/* TOP ROW */}
    <View style={styles.rsvpTopRowModern}>
      
      {/* STATUS BADGE */}
      <View
        style={[
          styles.statusBadge,
          event.response === "GOING"
            ? styles.goingBadge
            : event.response === "MAYBE"
            ? styles.maybeBadge
            : styles.notGoingBadge,
        ]}
      >
        <Ionicons
          name={
            event.response === "GOING"
              ? "checkmark-circle"
              : event.response === "MAYBE"
              ? "help-circle"
              : "close-circle"
          }
          size={16}
          color="#fff"
        />

        <Text style={styles.statusText}>
          {event.response === "NOT_GOING"
            ? "NOT GOING"
            : event.response}
        </Text>
      </View>

      {/* DATE */}
      <View style={styles.datePill}>
        <Ionicons name="calendar-outline" size={14} color="#64748B" />
        <Text style={styles.dateText}>{formatDate(event.event_date)}</Text>
      </View>
    </View>

    {/* TITLE */}
    <Text style={styles.rsvpTitleModern} numberOfLines={1}>
      {event.title}
    </Text>

    {/* DESC */}
    <Text style={styles.rsvpDescModern} numberOfLines={2}>
      {event.description}
    </Text>

    {/* META */}
    <View style={styles.metaRowModern}>
      <View style={styles.metaItem}>
        <Ionicons name="time-outline" size={14} color="#64748B" />
        <Text style={styles.metaText}>{event.event_time}</Text>
      </View>

      <View style={styles.metaItem}>
        <Ionicons name="location-outline" size={14} color="#64748B" />
        <Text style={styles.metaText}>{event.venue}</Text>
      </View>
    </View>

    {/* ACTION */}
    <TouchableOpacity
      style={styles.changeBtnModern}
      onPress={() => setSelectedEvent(event)}
    >
      <Text style={styles.changeBtnText}>Change Response</Text>
      <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
    </TouchableOpacity>

  </View>
</View>
        ))}
      </View>
    )}
  </>
)}
        {/* PAST EVENTS */}

        {activeTab === "Past Events" && (
  <View style={styles.heroGrid}>
    {filteredPastEvents.map((item) => (
      <TouchableOpacity
        key={item.event_id}
        style={styles.heroCard}
        activeOpacity={0.9}
        onPress={async () => {
          try {
            setSelectedPastEvent(item);

            const res = await axios.get(
              `${API}/event-gallery/${item.event_id}`
            );

            setPastEventGallery(
              res.data.gallery || []
            );
          } catch (err) {
            console.log(err);
          }
        }}
      >
        <Image
          source={{
            uri: API + item.cover_photo,
          }}
          style={styles.heroCardBg}
        />

        <View style={styles.heroOverlay} />

        <View style={styles.heroCardContent}>
          <View style={styles.completedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color="#fff"
            />

            <Text style={styles.completedText}>
              COMPLETED
            </Text>
          </View>

          <Text
            numberOfLines={2}
            style={styles.heroCardTitle}
          >
            {item.title}
          </Text>

          <Text
            numberOfLines={3}
            style={styles.heroCardDesc}
          >
            {item.description}
          </Text>

          <View style={styles.heroBottomRow}>
            <View style={styles.heroMiniInfo}>
              <Ionicons
                name="calendar-outline"
                size={15}
                color="#fff"
              />

              <Text style={styles.heroMiniText}>
                {formatDate(item.event_date)}
              </Text>
            </View>

            <View style={styles.heroMiniInfo}>
              <Ionicons
                name="location-outline"
                size={15}
                color="#fff"
              />

              <Text style={styles.heroMiniText}>
                {item.venue}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ))}
  </View>
)}
      </ScrollView>

      {/* UPCOMING MODAL */}

      <Modal
        visible={
          selectedEvent !==
          null
        }
        animationType="slide"
      >
        {selectedEvent && (
          <ScrollView
            style={
              styles.modalContainer
            }
          >
            <Image
              source={{
                uri:
                  API +
                  selectedEvent.cover_photo,
              }}
              style={
                styles.modalImage
              }
            />

            <View
              style={
                styles.modalContent
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                {
                  selectedEvent.title
                }
              </Text>

              <Text
                style={
                  styles.modalInfo
                }
              >
                📅{" "}
                {
                  formatDate(selectedEvent.event_date)
                }
              </Text>

              <Text
                style={
                  styles.modalInfo
                }
              >
                ⏰{" "}
                {
                  selectedEvent.event_time
                }
              </Text>

              <Text
                style={
                  styles.modalInfo
                }
              >
                📍{" "}
                {
                  selectedEvent.venue
                }
              </Text>

              <Text
                style={
                  styles.modalDescription
                }
              >
                {
                  selectedEvent.description
                }
              </Text>
              <View style={styles.countdownBox}>
  <Ionicons
    name="time-outline"
    size={16}
    color="#fff"
  />

  <Text style={styles.countdownText}>
  {countdown.days}d :
    {countdown.hours}h :
    {countdown.minutes}m :
    {countdown.seconds}s
  </Text>
</View>
              <Text
                style={
                  styles.responseTitle
                }
              >
                Your Response
              </Text>

              <View
                style={
                  styles.responseRow
                }
              >
                <TouchableOpacity
                  style={
                    styles.goingBtn
                  }
                  onPress={() =>
                    handleRSVP(
                      selectedEvent,
                      "GOING"
                    )
                  }
                >
                  <Text
                    style={
                      styles.goingText
                    }
                  >
                    GOING
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.maybeBtn
                  }
                  onPress={() =>
                    handleRSVP(
                      selectedEvent,
                      "MAYBE"
                    )
                  }
                >
                  <Text
                    style={
                      styles.maybeText
                    }
                  >
                    MAYBE
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.notGoingBtn
                  }
                  onPress={() =>
                    handleRSVP(
                      selectedEvent,
                      "NOT_GOING"
                    )
                  }
                >
                  <Text
                    style={
                      styles.notGoingText
                    }
                  >
                    NOT GOING
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={
                  styles.closeBtn
                }
                onPress={() =>
                  setSelectedEvent(
                    null
                  )
                }
              >
                <Text
                  style={
                    styles.closeText
                  }
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Modal>

      {/* PAST EVENT MODAL */}

      <Modal
        visible={
          selectedPastEvent !==
          null
        }
        animationType="slide"
      >
        {selectedPastEvent && (
          <ScrollView
            style={
              styles.modalContainer
            }
          >
            <Image
              source={{
                uri:
                  API +
                  selectedPastEvent.cover_photo,
              }}
              style={
                styles.modalImage
              }
            />

            <View
              style={
                styles.modalContent
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                {
                  selectedPastEvent.title
                }
              </Text>

              <Text
                style={
                  styles.modalInfo
                }
              >
                📅{" "}
                {
                  formatDate(selectedPastEvent.event_date)
                }
              </Text>

              <Text
                style={
                  styles.modalInfo
                }
              >
                📍{" "}
                {
                  selectedPastEvent.venue
                }
              </Text>

              <Text
                style={
                  styles.modalDescription
                }
              >
                {
                  selectedPastEvent.description
                }
              </Text>
              
              <Text
                style={
                  styles.responseTitle
                }
              >
                Event Gallery
              </Text>

              <View
                style={
                  styles.galleryGrid
                }
              >
                {pastEventGallery.map(
                  (
                    img,
                    index
                  ) => (
                    <Image
                      key={index}
                      source={{
                        uri:
                          img.photo_url?.startsWith(
                            "http"
                          )
                            ? img.photo_url
                            : `${API}${img.photo_url}`,
                      }}
                      style={
                        styles.galleryImage
                      }
                    />
                  )
                )}
              </View>

              <TouchableOpacity
                style={
                  styles.closeBtn
                }
                onPress={() => {
                  setSelectedPastEvent(
                    null
                  );

                  setPastEventGallery(
                    []
                  );
                }}
              >
                <Text
                  style={
                    styles.closeText
                  }
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////

const styles =
  StyleSheet.create({
    clearBtn: {
        width: 28, height: 28,
        backgroundColor: "#F1F5F9",
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
      },
      searchDropdown: {
        marginTop: 10,
        backgroundColor: "#fff",
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E2E8F0",

      },
      dropdownHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
      },
      dropdownHeaderLeft: { fontSize: 11, fontWeight: "700", color: "#94A3B8" },
      dropdownHeaderRight: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
      dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F8FAFC",
        width:"100%"
      },
      dropdownInfo: { flex: 1 },
      dropdownTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
      dropdownMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
      dropdownBadge: {
        backgroundColor: "#EDE9FE",
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 20,
      },
      dropdownBadgeText: { fontSize: 10, fontWeight: "700", color: "#6D28D9" },
      noResultText: {
        color: "#94A3B8",
        fontSize: 14,
        marginTop: 8,
        fontWeight: "600",
      },
    
     
     
      dropdownThumb: {
        width: 46, height: 40,
        borderRadius: 10,
      },
     
     
      dropdownUpcoming: { backgroundColor: "#EEF2FF" },
      dropdownCompleted: { backgroundColor: "#F1F5F9" },
      
    rsvpCardModern: {
        backgroundColor: "#fff",
        borderRadius: 22,
        marginBottom: 18,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        width: isDesktop
        ? "95%"
        : "100%",
        marginLeft: isDesktop
        ? 30
        : 0,
      },
      
      rsvpImageModern: {
        width: "100%",
        height: 170,
      },
      
      rsvpBodyModern: {
        padding: 16,
      },
      
      rsvpTopRowModern: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      },
    
      searchItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E2E8F0",
      },
      
      searchItemText: {
        fontSize: 14,
        color: "#0F172A",
        fontWeight: "600",
        flex: 1,
      },
      
     
      statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 50,
        gap: 6,
      },
      
      goingBadge: {
        backgroundColor: "#16A34A",
      },
      
      maybeBadge: {
        backgroundColor: "#F59E0B",
      },
      
      notGoingBadge: {
        backgroundColor: "#EF4444",
      },
      
      statusText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 15,
      },
      
      datePill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 4,
      },
      
      dateText: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "600",
      },
      
      rsvpTitleModern: {
        fontSize: 25,
        fontWeight: "900",
        color: "#0F172A",
      },
      
      rsvpDescModern: {
        fontSize: 15,
        color: "#64748B",
        marginTop: 6,
        lineHeight: 20,
      },
      
      metaRowModern: {
        flexDirection: "row",
        gap: 14,
        marginTop: 10,
        flexWrap: "wrap",
      },
      
      metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      },
      
      metaText: {
        fontSize: 15,
        color: "#64748B",
      },
      
      changeBtnModern: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
      },
      
      changeBtnText: {
        color: "#4F46E5",
        fontWeight: "800",
        fontSize: 15,
      },
    container: {
      flex: 1,
      backgroundColor:
        "#F1F5F9",
    },
    topSection: {
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 28,
        elevation: 10,
      
        alignItems: Platform.OS === "web" ?"center":"flex-start",
      },
      
      heading: {
        fontSize: Platform.OS === "web" ?42:30,
        fontWeight: "800",
        color: "#fff",
        textAlign:Platform.OS === "web" ?"center":"left"
      },
      
      subHeading: {
        fontSize: 15,
        color: "#cbd5e1",
        marginTop: 5,
        marginBottom: 20,
        textAlign:Platform.OS === "web" ?"center":"left"
      },
      
      searchBox: {
        width: Platform.OS === "web" ? "78%" : "100%",
    height: 58,
  
    backgroundColor: "#fff",
    borderRadius: 18,
  
    flexDirection: "row",
    alignItems: "center",
  
    paddingHorizontal: 14,
  
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
  
    shadowOpacity: 0.12,
    shadowRadius: 12,
  
    elevation: 5,
      },
      
      searchInput: {
        flex: 1,
        paddingHorizontal: 10,
        fontSize: 15,
        color: "#111",
        outlineStyle: "none" 
      }as any,
    hero: {
      width: isDesktop
        ? "85%"
        : "100%",
      alignSelf:  Platform.OS === "web" ?"center":"flex-start",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },

    heroTitle: {
      fontSize: isDesktop
        ? 52
        : isTablet
        ? 42
        : 32,
      fontWeight: "900",
      color: "#0F172A",
    },

    heroSubtitle: {
      fontSize: 16,
      color: "#64748B",
      marginTop: 6,
    },

    searchWrapper: {
      flexDirection: "row",
      alignItems: "center",
  
        width: Platform.OS === "web" ? "100%" : "100%",
      alignSelf: "center",
      paddingHorizontal: 20,
      marginTop: 18,
    },
    countdownBox: {
        marginTop: 14,
        backgroundColor: "#4F46E5",
        alignSelf: "flex-start",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
      },
      
      countdownText: {
        color: "#fff",
        fontWeight: "700",
        marginLeft: 6,
        fontSize: 13,
      },
      rsvpCard: {
        backgroundColor: "#fff",
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 0.9,
        borderColor: "#E2E8F0",
      },
      rsvpCardImage: {
        width: "100%",
        height: 150,
      },
      rsvpCardBody: {
        padding: 14,
      },
      rsvpTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      },
      rsvpBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 40,
      },
      badgeGoing: { backgroundColor: "#EAF3DE" },
      badgeMaybe: { backgroundColor: "#FAEEDA" },
      badgeNotGoing: { backgroundColor: "#FCEBEB" },
      rsvpBadgeText: {
        fontSize: 16,
        fontWeight: "700",
        marginLeft: 4,
      },
      dateChip: {
        backgroundColor: "#F1F5F9",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
      },
      dateChipText: {
        fontSize: 15,
        color: "#64748B",
      },
      rsvpEventTitle: {
        fontSize: 30,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 6,
      },
      rsvpEventDesc: {
        fontSize: 16,
        color: "#64748B",
        lineHeight: 20,
        marginBottom: 12,
      },
      rsvpMetaRow: {
        flexDirection: "row",
        gap: 14,
        flexWrap: "wrap",
      },
      rsvpMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      },
      rsvpMetaText: {
        fontSize: 15,
        color: "#64748B",
      },
      rsvpDivider: {
        height: 0.5,
        backgroundColor: "#E2E8F0",
        marginVertical: 12,
      },
      changeText: {
        fontSize: 16,
        color: "#4F46E5",
        fontWeight: "600",
        textAlign: "right",
      },

    filterBtn: {
      width: 58,
      height: 58,
      backgroundColor:
        "#fff",
      borderRadius: 18,
      marginLeft: 12,
      justifyContent:
        "center",
      alignItems: "center",
      elevation: 3,
    },

    tabsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        width: isDesktop ? "100%" : "100%",
        alignSelf: "center",
        paddingHorizontal: 20,
        marginTop: 28,
        marginBottom: 8,
      
        justifyContent: "flex-start",
      },
    tabBtn: {
      backgroundColor:
        "#E2E8F0",
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 14,
    },

    activeTabBtn: {
      backgroundColor:
        "#4F46E5",
    },

    tabText: {
      color: "#334155",
      fontWeight: "700",
      fontSize: 14,
    },

    activeTabText: {
      color: "#fff",
    },

    grid: {
      width: isDesktop
        ? "85%"
        : "100%",
      alignSelf: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
      paddingHorizontal: isWeb
        ? 0
        : 18,
      marginTop: 24,
    },

    card: {
      width: isDesktop
        ? "48%"
        : "100%",

      backgroundColor:
        "#fff",

      borderRadius: 24,

      overflow: "hidden",

      marginBottom: 24,

      elevation: 4,

      shadowColor: "#000",

      shadowOpacity: 0.08,

      shadowRadius: 10,

      shadowOffset: {
        width: 0,
        height: 5,
      },
    },

    bannerImage: {
      width: "100%",
      height: isDesktop
        ? 300
        : 220,
    },

    cardContent: {
      flexDirection: "row",
      padding: 18,
    },

    dateBadge: {
      width: 75,
      height: 90,
      backgroundColor:
        "#EEF2FF",
      borderRadius: 18,
      justifyContent:
        "center",
      alignItems: "center",
    },

    month: {
      fontSize: 14,
      color: "#4F46E5",
      fontWeight: "700",
    },

    day: {
      fontSize: 28,
      fontWeight: "900",
      color: "#111",
    },

    infoSection: {
      flex: 1,
      marginLeft: 16,
    },

    eventName: {
      fontSize: 22,
      fontWeight: "800",
      color: "#111827",
    },

    description: {
      marginTop: 8,
      color: "#64748B",
      lineHeight: 22,
      fontSize: 15,
    },

    rsvpContent: {
      padding: 18,
    },

   
    emptyContainer: {
      justifyContent:
        "center",
      alignItems: "center",
      paddingVertical: 100,
    },

    emptyTitle: {
      fontSize: 28,
      fontWeight: "800",
      marginTop: 20,
      color: "#0F172A",
    },

    modalContainer: {
      flex: 1,
      backgroundColor:
        "#fff",
    },

    modalImage: {
      width: "100%",
      height: isDesktop
        ? 500
        : 280,
    },

    modalContent: {
      padding: 22,
    },

    modalTitle: {
      fontSize: 40,
      fontWeight: "900",
      color: "#111827",
      marginBottom: 16,
    },

    modalInfo: {
      fontSize: 16,
      color: "#475569",
      marginBottom: 10,
    },

    modalDescription: {
      marginTop: 20,
      color: "#64748B",
      lineHeight: 26,
      fontSize: 16,
    },

    responseTitle: {
      fontSize: 24,
      fontWeight: "800",
      marginTop: 30,
      marginBottom: 18,
    },

    responseRow: {
      flexDirection: isTablet
        ? "row"
        : "column",
      gap: 14,
    },

    goingBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderColor:
        "#22C55E",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },

    maybeBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderColor:
        "#F59E0B",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },

    notGoingBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderColor:
        "#EF4444",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
    },

    goingText: {
      color: "#16A34A",
      fontWeight: "800",
    },

    maybeText: {
      color: "#D97706",
      fontWeight: "800",
    },

    notGoingText: {
      color: "#DC2626",
      fontWeight: "800",
    },

    closeBtn: {
      backgroundColor:
        "#4F46E5",
      marginTop: 30,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
    },

    closeText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 16,
    },

    galleryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
      marginTop: 20,
    },

    galleryImage: {
      width: isDesktop
        ? "32%"
        : "48%",
      height: 170,
      borderRadius: 16,
      marginBottom: 12,
    },
    ////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////

heroSection: {
    width: isDesktop ? "95%" : "94%",
  
    minHeight: isDesktop
      ? 420
      : isTablet
      ? 340
      : 330,
  
    alignSelf: "center",
  
    position: "relative",
  
    overflow: "hidden",
  
    marginTop: 22,
  
    borderRadius: 28,
  
    backgroundColor: "#0f172a",
  
    justifyContent: "flex-end",
  
  
  },
  
  heroBg: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(2,6,23,0.72)",
  },
  
  heroContent: {
    width: "100%",
  
    paddingHorizontal: isDesktop ? 50 : 20,
  
    paddingBottom: isDesktop ? 45 : 22,
  
    paddingTop: isDesktop ? 50 : 22,
  
    justifyContent: "flex-end",
  },
  
  liveBadge: {
    backgroundColor: "#4F46E5",
  
    alignSelf: "flex-start",
  
    flexDirection: "row",
  
    alignItems: "center",
  
    paddingHorizontal: 14,
  
    paddingVertical: 8,
  
    borderRadius: 50,
  
    marginBottom: 14,
  },
  
  liveText: {
    color: "#fff",
  
    marginLeft: 6,
  
    fontWeight: "700",
  
    fontSize: 12,
  },
  
  heroMainTitle: {
    fontSize: isDesktop
      ? 42
      : isTablet
      ? 42
      : 28,
  
    fontWeight: "900",
  
    color: "#fff",
  
    lineHeight: isDesktop
      ? 68
      : isTablet
      ? 50
      : 36,
  
    maxWidth: 900,
  },
  
  organizer: {
    color: "#C7D2FE",
  
    fontSize: isDesktop ? 18 : 14,
  
    marginTop: 10,
  
    fontWeight: "600",
  },
  
  heroInfoRow: {
    flexDirection: "row",
  
    flexWrap: "wrap",
  
    marginTop: 18,
  
    gap: 14,
  },
  
  infoItem: {
    flexDirection: "row",
  
    alignItems: "center",
  
    marginRight: 10,
  
    marginBottom: 6,
  },
  
  infoText: {
    color: "#fff",
  
    marginLeft: 6,
  
    fontSize: isDesktop ? 15 : 13,
  
    fontWeight: "600",
  },
  
  heroDescription: {
    color: "#E2E8F0",
  
    fontSize: isDesktop ? 17 : 14,
  
    lineHeight: 22,
  
    marginTop: 18,
  
    maxWidth: 760,
  },
  
  heroBtnRow: {
    flexDirection: "row",
  
    alignItems: "center",
  
    marginTop: 24,
  },
  
  heroBtn: {
    backgroundColor: "#4F46E5",
  
    height: isDesktop ? 58 : 50,
  
    paddingHorizontal: isDesktop ? 32 : 22,
  
    borderRadius: 16,
  
    flexDirection: "row",
  
    alignItems: "center",
  
    justifyContent: "center",
  },
  
  heroBtnText: {
    color: "#fff",
  
    fontWeight: "800",
  
    fontSize: isDesktop ? 16 : 14,
  
    marginRight: 8,
  },
  
  shareBtn: {
    width: isDesktop ? 58 : 50,
  
    height: isDesktop ? 58 : 50,
  
    borderWidth: 1,
  
    borderColor: "rgba(255,255,255,0.25)",
  
    marginLeft: 14,
  
    borderRadius: 16,
  
    justifyContent: "center",
  
    alignItems: "center",
  
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroGrid: {
    width: isDesktop ? "95%" : "94%",
    alignSelf: "center",
  
    flexDirection: "row",
    flexWrap: "wrap",
  
    justifyContent: "space-between",
  
    marginTop: 20,
  },
  
  heroCard: {
    width: isDesktop
    ? "99%"
    : "100%",

  minHeight: isDesktop
    ? 360
    : 320,

  borderRadius: 26,

  overflow: "hidden",

  marginBottom: 18,

  backgroundColor: "#111827",

  position: "relative",

  justifyContent: "flex-end",
  },
  
  heroCardBg: {
    width: "100%",
    height: "100%",
  
    position: "absolute",
  
    resizeMode: "cover",
  },
  
  heroOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  
  heroCardContent: {
    flex: 1,
    justifyContent: "flex-end",
  
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 20,
  },
  
  heroCardTitle: {
    color: "#fff",
  
    fontSize: isDesktop
      ? 30
      : 22,
  
    fontWeight: "900",
  
    lineHeight: isDesktop
      ? 36
      : 28,
  
    marginTop: 12,
  },
  
  heroCardDesc: {
    color: "#E2E8F0",
  
    marginTop: 10,
  
    fontSize: 14,
  
    lineHeight: 21,
  },
  
  heroBottomRow: {
    flexDirection: "row",
  
    flexWrap: "wrap",
  
    marginTop: 16,
  
    gap: 14,
  },
  
  heroMiniInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  heroMiniText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "600",
  },
  
  rsvpTopBadge: {
    alignSelf: "flex-start",
  
    paddingHorizontal: 14,
    paddingVertical: 7,
  
    borderRadius: 40,
  },
  
  rsvpTopText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  
  completedBadge: {
    backgroundColor: "#2563EB",
  
    alignSelf: "flex-start",
  
    flexDirection: "row",
  
    alignItems: "center",
  
    paddingHorizontal: 14,
    paddingVertical: 8,
  
    borderRadius: 40,
  },
  
  completedText: {
    color: "#fff",
  
    fontWeight: "800",
  
    marginLeft: 6,
  
    fontSize: 12,
  },
  });