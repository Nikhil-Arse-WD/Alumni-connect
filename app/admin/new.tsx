// app/event-details.tsx

import React from "react";

import {
    Feather,
    Ionicons,
    MaterialIcons,
} from "@expo/vector-icons";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const PRIMARY = "#5B5FEF";

export default function EventDetailsScreen() {
  const galleryImages = [
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
  ];

  const attendees = [
    {
      name: "John Doe",
      email: "john@example.com",
      status: "Going",
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      status: "Maybe",
    },
    {
      name: "Michael Brown",
      email: "michael@example.com",
      status: "Going",
    },
    {
      name: "Emily Davis",
      email: "emily@example.com",
      status: "Not Going",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#000"
            />

            <Text style={styles.backText}>
              Back to Events
            </Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
            >
              <Feather
                name="edit"
                size={18}
                color={PRIMARY}
              />

              <Text
                style={styles.editText}
              >
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
            >
              <Feather
                name="trash-2"
                size={18}
                color="#EF4444"
              />

              <Text
                style={styles.deleteText}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TITLE */}

        <View style={styles.titleRow}>
          <Text style={styles.title}>
            Summer Music Festival
          </Text>

          <View style={styles.statusBadge}>
            <Text
              style={styles.statusText}
            >
              Upcoming
            </Text>
          </View>
        </View>

        {/* INFO */}

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons
              name="calendar-outline"
              size={22}
              color="#555"
            />

            <Text style={styles.infoText}>
              25 May 2025
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="time-outline"
              size={22}
              color="#555"
            />

            <Text style={styles.infoText}>
              06:00 PM
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="location-outline"
              size={22}
              color="#555"
            />

            <Text style={styles.infoText}>
              City Park
            </Text>
          </View>
        </View>

        {/* COVER IMAGE */}

        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
          }}
          style={styles.coverImage}
        />

        {/* COUNTDOWN */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Event Countdown
          </Text>

          <View style={styles.countdownRow}>
            <View
              style={styles.countBox}
            >
              <Text
                style={styles.countNumber}
              >
                02
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
              <Text
                style={styles.countNumber}
              >
                14
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
              <Text
                style={styles.countNumber}
              >
                35
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
              <Text
                style={styles.countNumber}
              >
                46
              </Text>

              <Text
                style={styles.countLabel}
              >
                Seconds
              </Text>
            </View>
          </View>
        </View>

        {/* DETAILS */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Event Details
          </Text>

          <DetailRow
            icon="document-text-outline"
            label="Description"
            value="A musical evening with top artists. Join us for a night full of music and fun."
          />

          <DetailRow
            icon="location-outline"
            label="Venue"
            value="City Park, New York"
          />

          <DetailRow
            icon="people-outline"
            label="Capacity"
            value="500 People"
          />

          <DetailRow
            icon="ticket-outline"
            label="Bookings"
            value="120 People"
          />

          <DetailRow
            icon="calendar-outline"
            label="Date"
            value="25 May 2025"
          />

          <DetailRow
            icon="time-outline"
            label="Time"
            value="06:00 PM - 10:00 PM"
          />
        </View>

        {/* RSVP */}

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
                <Text
                  style={
                    styles.rsvpNumber
                  }
                >
                  80
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
                <Text
                  style={
                    styles.rsvpNumber
                  }
                >
                  25
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
                <Text
                  style={
                    styles.rsvpNumber
                  }
                >
                  15
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

            <Text
              style={styles.progressText}
            >
              Total Responses : 120 /
              500
            </Text>
          </View>
        </View>

        {/* UPLOAD */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Upload Event Photos
          </Text>

          <TouchableOpacity
            style={styles.uploadBox}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={40}
              color={PRIMARY}
            />

            <Text
              style={styles.uploadTitle}
            >
              Upload Photos
            </Text>

            <Text
              style={styles.uploadSub}
            >
              Upload photos from the
              event gallery
            </Text>
          </TouchableOpacity>
        </View>

        {/* GALLERY */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Event Gallery
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
          >
            {galleryImages.map(
              (item, index) => (
                <Image
                  key={index}
                  source={{
                    uri: item,
                  }}
                  style={
                    styles.galleryImage
                  }
                />
              )
            )}
          </ScrollView>
        </View>

        {/* ATTENDEES */}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Top Attendees
          </Text>

          {attendees.map(
            (item, index) => (
              <View
                key={index}
                style={
                  styles.attendeeRow
                }
              >
                <View
                  style={
                    styles.attendeeLeft
                  }
                >
                  <View
                    style={
                      styles.avatar
                    }
                  >
                    <Text
                      style={
                        styles.avatarText
                      }
                    >
                      {item.name.charAt(
                        0
                      )}
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.attendeeName
                      }
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={
                        styles.attendeeEmail
                      }
                    >
                      {item.email}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.attendeeBadge,
                    item.status ===
                    "Going"
                      ? {
                          backgroundColor:
                            "#DCFCE7",
                        }
                      : item.status ===
                        "Maybe"
                      ? {
                          backgroundColor:
                            "#FEF3C7",
                        }
                      : {
                          backgroundColor:
                            "#FEE2E2",
                        },
                  ]}
                >
                  <Text>
                    {item.status}
                  </Text>
                </View>
              </View>
            )
          )}
        </View>

        {/* TIMELINE */}

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

      {/* BOTTOM NAV */}
    </SafeAreaView>
  );
}

const DetailRow = ({
  icon,
  label,
  value,
}: any) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Ionicons
        name={icon}
        size={20}
        color={PRIMARY}
      />

      <Text style={styles.detailLabel}>
        {label}
      </Text>
    </View>

    <Text style={styles.detailValue}>
      {value}
    </Text>
  </View>
);

const NavItem = ({
  icon,
  label,
  active,
}: any) => (
  <TouchableOpacity
    style={styles.navItem}
  >
    <Ionicons
      name={icon}
      size={24}
      color={active ? PRIMARY : "#666"}
    />

    <Text
      style={[
        styles.navLabel,
        active && {
          color: PRIMARY,
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
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

  editBtn: {
    borderWidth: 1,
    borderColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
  },

  editText: {
    color: PRIMARY,
    marginLeft: 5,
    fontWeight: "700",
  },

  deleteBtn: {
    borderWidth: 1,
    borderColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },

  deleteText: {
    color: "#EF4444",
    marginLeft: 5,
    fontWeight: "700",
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

  statusBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#166534",
    fontWeight: "700",
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

  coverImage: {
    width: width - 36,
    height: 240,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 20,
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

  countdownRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
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

  detailRow: {
    marginBottom: 18,
  },

  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  detailLabel: {
    marginLeft: 8,
    fontWeight: "700",
    color: "#333",
  },

  detailValue: {
    color: "#555",
    lineHeight: 24,
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

  attendeeRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  attendeeLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

  attendeeName: {
    fontWeight: "700",
    fontSize: 15,
  },

  attendeeEmail: {
    color: "#666",
    marginTop: 4,
  },

  attendeeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
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

  bottomNav: {
    height: 80,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent:
      "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  navItem: {
    alignItems: "center",
  },

  navLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
  },
});