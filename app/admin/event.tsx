
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, Animated, FlatList, Image, Modal,
  Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SidebarWeb from "./components/SidebarWeb";
import Sidebar from "./components/sidebar";

const API     = process.env.EXPO_PUBLIC_API_BASE;
const PRIMARY = "#6366f1";

const C = {
  bg: "#f1f5f9", bgWeb: "#f8fafc", card: "#fff",
  text: "#111827", muted: "#6b7280", faint: "#9ca3af",
  border: "#e5e7eb", borderSoft: "#f3f4f6",
  primary: "#6366f1", primarySoft: "#ede9fe", primaryDeep: "#7c3aed",
  amber: "#f59e0b", amberDeep: "#b45309", amberSoft: "#fef3c7",
  green: "#10b981", greenDeep: "#059669", greenSoft: "#d1fae5",
  greenSoftDeep: "#065f46", red: "#dc2626", redSoft: "#fef2f2",
};

interface EventType {
  event_id: number; title: string; description: string;
  venue: string; event_date: string; event_time: string;
  capacity: number; cover_photo: string; status: string;
}

// ── Detail Row ────────────────────────────────────────────────
function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={18} color={PRIMARY} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

// ── KPI Row ───────────────────────────────────────────────────
function KPIs({ total, upcoming, completed }: { total: number; upcoming: number; completed: number }) {
  const kpis = [
    { icon: "calendar",     iconC: C.primaryDeep, iconBg: C.primarySoft, value: total,     label: "Total Events", trend: "+50%" },
    { icon: "clock",        iconC: C.greenDeep,   iconBg: C.greenSoft,   value: upcoming,  label: "Upcoming",     trend: "LIVE" },
    { icon: "check-circle", iconC: C.muted,       iconBg: C.borderSoft,  value: completed, label: "Completed",    trend: "DONE" },
  ];
  return (
    <View style={styles.kpiRow}>
      {kpis.map((k, i) => (
        <View key={i} style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <View style={[styles.kpiIcon, { backgroundColor: k.iconBg }]}>
              <Feather name={k.icon as any} size={18} color={k.iconC} />
            </View>
            <View style={[styles.kpiTrend, { backgroundColor: C.greenSoft }]}>
              <Text style={[styles.kpiTrendText, { color: C.greenSoftDeep }]}>{k.trend}</Text>
            </View>
          </View>
          <Text style={styles.kpiValue}>{k.value}</Text>
          <Text style={styles.kpiLabel}>{k.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Event Card ────────────────────────────────────────────────
function EventCard({ item, onPress, onEdit, onDelete }: {
  item: EventType; onPress: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const upcoming = item.status === "Upcoming";
  return (
    <Pressable style={styles.mCard} onPress={onPress}>
      <LinearGradient
        colors={upcoming ? ["#6366f1", "#8b5cf6"] : ["#94a3b8", "#475569"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.mCover}
      >
        {item.cover_photo
          ? <Image source={{ uri: API + item.cover_photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          : null}
        <View style={styles.dateBadge}>
          <Text style={[styles.dateMonth, upcoming && { color: C.red }]}>
            {new Date(item.event_date).toLocaleString("en", { month: "short" }).toUpperCase()}
          </Text>
          <Text style={styles.dateDay}>{new Date(item.event_date).getDate()}</Text>
        </View>
        {upcoming
          ? <View style={styles.statusUpcoming}><View style={styles.statusDot} /><Text style={styles.statusTxt}>UPCOMING</Text></View>
          : <View style={styles.statusDone}><Text style={styles.statusTxt}>✓ COMPLETED</Text></View>}
        <View style={styles.coverBottom}>
          <Text style={styles.coverTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.coverSub} numberOfLines={1}>📍 {item.venue}</Text>
        </View>
      </LinearGradient>
      <View style={styles.mCardBody}>
        <View style={styles.metaRow}>
          <View style={styles.meta}><Feather name="users" size={13} color={C.muted} /><Text style={styles.metaText}>{item.capacity} capacity</Text></View>
          <View style={styles.meta}><Feather name="clock" size={13} color={C.muted} /><Text style={styles.metaText}>{item.event_time}</Text></View>
        </View>
        <View style={styles.actionsRow}>
          <Pressable style={[styles.actionBtn, styles.editBtnCard]} onPress={onEdit}>
            <Feather name="edit-2" size={13} color="#fff" /><Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.deleteBtnCard]} onPress={onDelete}>
            <Feather name="trash-2" size={13} color={C.red} /><Text style={styles.deleteBtnText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ── Date Fields ───────────────────────────────────────────────
function DateFields({ form, handleChange, showDate, setShowDate, showTime, setShowTime }: {
  form: any; handleChange: (k: string, v: string) => void;
  showDate: boolean; setShowDate: (v: boolean) => void;
  showTime: boolean; setShowTime: (v: boolean) => void;
}) {
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;

  if (Platform.OS === "web") {
    return (
      <>
        <input type="date" value={form.event_date}
          onChange={e => handleChange("event_date", e.target.value)}
          style={{ height: 54, borderRadius: 14, border: "1px solid #e5e7eb", paddingLeft: 14, marginBottom: 16, fontSize: 14, width: "100%", background: "#f8fafc", boxSizing: "border-box" } as any}
        />
        <input type="time" value={form.event_time}
          onChange={e => handleChange("event_time", `${e.target.value}:00`)}
          style={{ height: 54, borderRadius: 14, border: "1px solid #e5e7eb", paddingLeft: 14, marginBottom: 16, fontSize: 14, width: "100%", background: "#f8fafc", boxSizing: "border-box" } as any}
        />
      </>
    );
  }
  return (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
        <Text style={{ color: form.event_date ? "#111" : "#9ca3af" }}>{form.event_date || "Select Date"}</Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker value={new Date()} mode="date" display="default"
          onChange={(_, d) => { setShowDate(false); if (d) handleChange("event_date", formatDate(d)); }} />
      )}
      <TouchableOpacity style={styles.input} onPress={() => setShowTime(true)}>
        <Text style={{ color: form.event_time ? "#111" : "#9ca3af" }}>{form.event_time || "Select Time"}</Text>
      </TouchableOpacity>
      {showTime && (
        <DateTimePicker value={new Date()} mode="time" is24Hour display="default"
          onChange={(_, d) => { setShowTime(false); if (d) handleChange("event_time", formatTime(d)); }} />
      )}
    </>
  );
}

// ── Form Modal ────────────────────────────────────────────────
function FormModal({ visible, onClose, onSubmit, title, form, handleChange, pickImage, showDate, setShowDate, showTime, setShowTime }: any) {
  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalBackBtn}>
            <Ionicons name="chevron-back" size={22} color="#000" />
            <Text style={styles.modalBackText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
        </View>
        <TextInput placeholder="Title" style={styles.input} value={form.title} onChangeText={t => handleChange("title", t)} />
        <TextInput placeholder="Description" style={[styles.input, { height: 100, textAlignVertical: "top" }]} value={form.description} onChangeText={t => handleChange("description", t)} multiline />
        <TextInput placeholder="Venue" style={styles.input} value={form.venue} onChangeText={t => handleChange("venue", t)} />
        <DateFields form={form} handleChange={handleChange} showDate={showDate} setShowDate={setShowDate} showTime={showTime} setShowTime={setShowTime} />
        <TextInput placeholder="Capacity" keyboardType="numeric" style={styles.input} value={form.capacity} onChangeText={t => handleChange("capacity", t)} />
        <TouchableOpacity style={styles.imagePickBtn} onPress={pickImage}>
          <Ionicons name="image-outline" size={20} color={PRIMARY} />
          <Text style={styles.imagePickText}>Select Cover Photo</Text>
        </TouchableOpacity>
        {form.cover_photo ? <Image source={{ uri: form.cover_photo }} style={styles.preview} /> : null}
        <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
          <Text style={styles.submitBtnText}>{title}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelTextBtn} onPress={onClose}>
          <Text style={styles.cancelTextBtnText}>Cancel</Text>
        </TouchableOpacity>
        <View style={{ height: 60 }} />
      </ScrollView>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AdminEvents() {
  const { width } = useWindowDimensions();
  const isMobile  = width < 768;   // ✅ dynamic — resize pe update
  const isWeb     = !isMobile;
  const router    = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-300)).current;

  const [events,        setEvents]        = useState<EventType[]>([]);
  const [activeTab,     setActiveTab]     = useState("all");
  const [viewMode,      setViewMode]      = useState("grid");
  const [modalVisible,  setModalVisible]  = useState(false);
  const [editModal,     setEditModal]     = useState(false);
  const [detailsModal,  setDetailsModal]  = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [selectedEvent,  setSelectedEvent]  = useState<EventType | null>(null);
  const [gallery,        setGallery]        = useState<any[]>([]);
  const [showDate,       setShowDate]       = useState(false);
  const [showTime,       setShowTime]       = useState(false);
  const [rsvp,           setRsvp]           = useState({ going: 0, maybe: 0, notGoing: 0, total: 0 });
  const [countdown,      setCountdown]      = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [form, setForm] = useState({ title: "", description: "", venue: "", event_date: "", event_time: "", capacity: "", cover_photo: "" });

  const fetchEvents = async () => {
    try { const res = await axios.get(`${API}/events`); setEvents(res.data.events || []); }
    catch (err) { console.log(err); }
  };
  useEffect(() => { fetchEvents(); }, []);
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
  // countdown
  useEffect(() => {
    if (!selectedEvent) return;
    const timer = setInterval(() => {
      const d = new Date(selectedEvent.event_date);
      const clean = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      const dist  = new Date(`${clean}T${selectedEvent.event_time}`).getTime() - Date.now();
      if (dist <= 0) {
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
 clearInterval(timer); return; }
      setCountdown({
        days:    String(Math.floor(dist/(1000*60*60*24))).padStart(2,"0"),
        hours:   String(Math.floor((dist%(1000*60*60*24))/(1000*60*60))).padStart(2,"0"),
        minutes: String(Math.floor((dist%(1000*60*60))/(1000*60))).padStart(2,"0"),
        seconds: String(Math.floor((dist%(1000*60))/1000)).padStart(2,"0"),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedEvent]);

  // rsvp
  useEffect(() => {
    if (!selectedEvent) return;
    fetch(`${API}/rsvp/summary/${selectedEvent.event_id}`)
      .then(r => r.json()).then(json => {
        if (json.success && Array.isArray(json.data)) {
          let going=0, maybe=0, notGoing=0, total=0;
          json.data.forEach((i: any) => {
            if (i.response==="GOING") going=Number(i.count);
            else if (i.response==="MAYBE") maybe=Number(i.count);
            else if (i.response==="NOT_GOING") notGoing=Number(i.count);
            total+=Number(i.count);
          });
          setRsvp({ going, maybe, notGoing, total });
        }
      }).catch(console.log);
  }, [selectedEvent]);

  const handleChange = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));
  const resetForm    = () => { setForm({ title:"", description:"", venue:"", event_date:"", event_time:"", capacity:"", cover_photo:"" }); setEditingEventId(null); };

  const pickImage = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: "image/*", copyToCacheDirectory: true });
      if (!r.canceled) handleChange("cover_photo", r.assets[0].uri);
    } catch {}
  };

  const createEvent = async () => {
    try {
      const data = new FormData();
      data.append("title", form.title); data.append("description", form.description);
      data.append("venue", form.venue); data.append("event_date", form.event_date);
      data.append("event_time", form.event_time); data.append("capacity", form.capacity);
      const eventDateTime = new Date(`${form.event_date}T${form.event_time}`);

const status =
  new Date().getTime() > eventDateTime.getTime()
    ? "Completed"
    : "Upcoming";

data.append("status", status);
     // data.append("status", Date.now() >= new Date(`${form.event_date}T${form.event_time}`).getTime() ? "Completed" : "Upcoming");
     //data.append("status", new Date()>new Date(`${form.event_date}T${form.event_time}`)?"Completed":"Upcoming");
      if (form.cover_photo) {
        if (Platform.OS === "web") { const blob = await fetch(form.cover_photo).then(r => r.blob()); data.append("cover_photo", blob, "event.jpg"); }
        else { const fn = form.cover_photo.split("/").pop()||"photo.jpg"; const m=/\.(\w+)$/.exec(fn); data.append("cover_photo",{uri:form.cover_photo,name:fn,type:m?`image/${m[1]}`:"image"} as any); }
      }
      await axios.post(`${API}/admin/create-event`, data, { headers: { "Content-Type": "multipart/form-data" } });
      Platform.OS==="web"?window.alert("Event Created ✅"):Alert.alert("Success","Event Created");
      setModalVisible(false); resetForm(); fetchEvents();
    } catch (err: any) {
      const msg = err?.response?.data?.message||"Failed to create event";
      Platform.OS==="web"?window.alert(msg):Alert.alert("Error",msg);
    }
  };

  const updateEvent = async () => {
    try {
      const data = new FormData();
      data.append("title",form.title); data.append("description",form.description);
      data.append("venue",form.venue); data.append("event_date",form.event_date);
      data.append("event_time",form.event_time); data.append("capacity",form.capacity);
      data.append("status", new Date()>new Date(`${form.event_date}T${form.event_time}`)?"Completed":"Upcoming");
      if (form.cover_photo && !form.cover_photo.startsWith("http")) {
        if (Platform.OS==="web") { const blob=await fetch(form.cover_photo).then(r=>r.blob()); data.append("cover_photo",blob,"event.jpg"); }
        else { const fn=form.cover_photo.split("/").pop()||"event.jpg"; const m=/\.(\w+)$/.exec(fn); data.append("cover_photo",{uri:form.cover_photo,name:fn,type:m?`image/${m[1]}`:"image"} as any); }
      }
      await axios.put(`${API}/admin/update-event/${editingEventId}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      Platform.OS==="web"?window.alert("Event Updated ✅"):Alert.alert("Success","Event Updated");
      setEditModal(false); fetchEvents();
    } catch { Platform.OS==="web"?window.alert("Update failed"):Alert.alert("Error","Update failed"); }
  };

  const deleteEvent = async (id: number) => {
    const ok = Platform.OS==="web"
      ? window.confirm("Delete this event?")
      : await new Promise<boolean>(res => Alert.alert("Delete","Are you sure?",[{text:"Cancel",onPress:()=>res(false)},{text:"Delete",style:"destructive",onPress:()=>res(true)}]));
    if (!ok) return;
    await axios.delete(`${API}/admin/delete-event/${id}`);
    fetchEvents(); setDetailsModal(false);
  };

  const openEditModal = (item: EventType) => {
    setEditingEventId(item.event_id);
    setForm({ title:item.title, description:item.description, venue:item.venue,
      event_date:item.event_date, event_time:item.event_time,
      capacity:item.capacity.toString(), cover_photo:API+item.cover_photo });
    setEditModal(true);
  };

  const openDetails = async (item: EventType) => {
    setSelectedEvent(item); setDetailsModal(true);
    try { const r = await axios.get(`${API}/event-gallery/${item.event_id}`); setGallery(r.data.gallery||[]); } catch {}
  };

  const pickGalleryImages = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type:"image/*", multiple:true, copyToCacheDirectory:true });
      if (!r.canceled) uploadGallery(r.assets);
    } catch {}
  };

  const uploadGallery = async (images: any[]) => {
    const data = new FormData();
    for (let i=0;i<images.length;i++) {
      const img=images[i];
      if (Platform.OS==="web") data.append("gallery_images",img.file);
      else data.append("gallery_images",{uri:img.uri,name:img.name||`g_${i}.jpg`,type:img.mimeType||"image/jpeg"} as any);
    }
    await axios.post(`${API}/admin/upload-gallery/${selectedEvent?.event_id}`, data, { headers:{"Content-Type":"multipart/form-data"} });
    Platform.OS==="web"?window.alert("Uploaded ✅"):Alert.alert("Success","Gallery Uploaded");
    if (selectedEvent) openDetails(selectedEvent);
  };

  const openDrawer  = () => { setDrawerOpen(true); Animated.timing(translateX,{toValue:0,duration:250,useNativeDriver:true}).start(); };
  const closeDrawer = () => { Animated.timing(translateX,{toValue:-300,duration:200,useNativeDriver:true}).start(()=>setDrawerOpen(false)); };
  const handleMenu  = (route: string) => {
    closeDrawer();
    if (route==="logout") {
      if (Platform.OS==="web") { if(window.confirm("Logout?")) router.replace("/loginscreen"); }
      else Alert.alert("Logout","Are you sure?",[{text:"Cancel",style:"cancel"},{text:"Logout",onPress:()=>router.replace("/loginscreen")}]);
      return;
    }
    router.push(`/admin/${route}` as any);
  };

  const TABS = [
    { id:"all",       label:"All",       count:events.length },
    { id:"upcoming",  label:"Upcoming",  count:events.filter(e=>e.status==="Upcoming").length },
    { id:"completed", label:"Completed", count:events.filter(e=>e.status==="Completed").length },
  ];
  const filtered = events.filter(e =>
    activeTab==="all" ? true : activeTab==="upcoming" ? e.status==="Upcoming" : e.status==="Completed"
  );

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── MOBILE TOP BAR ── */}
      {isMobile && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={openDrawer}>
            <Feather name="menu" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Alumni Admin</Text>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </View>
      )}

      <View style={{ flex: 1, flexDirection: "row" }}>

        {/* ── WEB: static sidebar ── */}
        {isWeb && <SidebarWeb handleMenu={handleMenu} />}

        {/* ── MAIN CONTENT ── */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: isMobile ? 14 : 24, paddingBottom: 100 }}
        >
          {/* PAGE HEADER */}
          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.breadcrumb}>Dashboard › Events</Text>
              <Text style={styles.pageTitle}>Events</Text>
            </View>
            <View style={styles.pageHeaderRight}>
              {isWeb && (
                <View style={styles.viewSwitcher}>
                  {["grid","list"].map(v => (
                    <Pressable key={v} style={[styles.viewBtn, viewMode===v&&styles.viewBtnActive]} onPress={()=>setViewMode(v)}>
                      <Feather name={v==="grid"?"list":"grid"} size={14} color={viewMode===v?"#fff":C.muted} />
                    </Pressable>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.addBtn} onPress={()=>{ resetForm(); setModalVisible(true); }}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          </View>

          <KPIs
            total={events.length}
            upcoming={events.filter(e=>e.status==="Upcoming").length}
            completed={events.filter(e=>e.status==="Completed").length}
          />

          {/* TAB BAR */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            <View style={styles.tabsRow}>
              {TABS.map(t => (
                <Pressable key={t.id} style={[styles.tabChip, activeTab===t.id&&styles.tabChipActive]} onPress={()=>setActiveTab(t.id)}>
                  <Text style={[styles.tabChipText, activeTab===t.id&&styles.tabChipTextActive]}>{t.label} · {t.count}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* EVENTS */}
          {filtered.length===0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={52} color="#CBD5E1" />
              <Text style={styles.emptyText}>No events found</Text>
            </View>
          ) : isWeb && viewMode==="grid" ? (
            <View style={styles.tableContainer}>
              <View style={styles.tableHead}>
  <Text style={[styles.headText, { width: 180 }]}>Image</Text>
  <Text style={[styles.headText, { flex: 2.6 }]}>Title</Text>
  <Text style={[styles.headText, { flex: 1}]}>Date</Text>
  <Text style={[styles.headText, { flex: 1.2 }]}>Venue</Text>
  <Text style={[styles.headText, { width: 130 }]}>Capacity</Text>
  <Text style={[styles.headText, { width: 120 }]}>Status</Text>
  <Text style={[styles.headText, { width: 120 }]}>Actions</Text>
</View>
              {filtered.map(item => (
                <TouchableOpacity
                key={item.event_id}
                style={styles.tableRow}
                onPress={() => openDetails(item)}
              >
                {item.cover_photo ? (
                  <Image
                    source={{ uri: API + item.cover_photo }}
                    style={styles.tableImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.tableImage,
                      {
                        backgroundColor: "#EEF2FF",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={28}
                      color={PRIMARY}
                    />
                  </View>
                )}
              
              <View
  style={{
    flex: 2.5,
    paddingRight: 20,
    justifyContent: "center",
  }}
>
  <Text style={styles.rowText} numberOfLines={1}>
    {item.title}
  </Text>
</View>
              
                <Text style={[styles.rowText, { flex: 1 }]}>
                  {new Date(item.event_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              
                <Text style={[styles.rowText, { flex: 1.2 }]} numberOfLines={1}>
                  {item.venue}
                </Text>
              
                <Text style={[styles.rowText, { width: 130 }]}>
                  {item.capacity}
                </Text>
              
                <View style={{ width: 120 }}>
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
                    width: 150,
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    style={styles.editBtnCard}
                    onPress={() => openEditModal(item)}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
              
                  <TouchableOpacity
                    style={styles.deleteBtnCard}
                    onPress={() => deleteEvent(item.event_id)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.cardsGrid, isWeb && styles.cardsGridDesktop]}>
              {filtered.map(item => (
                <EventCard key={item.event_id} item={item}
                  onPress={()=>openDetails(item)}
                  onEdit={()=>openEditModal(item)}
                  onDelete={()=>deleteEvent(item.event_id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* ── MOBILE: drawer sidebar ── */}
      {isMobile && (
        <Sidebar drawerOpen={drawerOpen} translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu} />
      )}

      {/* ── MOBILE: FAB ── */}
      {isMobile && (
        <Pressable style={styles.fab} onPress={()=>{ resetForm(); setModalVisible(true); }}>
          <LinearGradient colors={[PRIMARY,"#8b5cf6"]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.fabInner}>
            <Feather name="plus" size={26} color="#fff" />
          </LinearGradient>
        </Pressable>
      )}

      <FormModal visible={modalVisible} onClose={()=>setModalVisible(false)} onSubmit={createEvent} title="Create Event"
        form={form} handleChange={handleChange} pickImage={pickImage}
        showDate={showDate} setShowDate={setShowDate} showTime={showTime} setShowTime={setShowTime}
      />
      <FormModal visible={editModal} onClose={()=>setEditModal(false)} onSubmit={updateEvent} title="Update Event"
        form={form} handleChange={handleChange} pickImage={pickImage}
        showDate={showDate} setShowDate={setShowDate} showTime={showTime} setShowTime={setShowTime}
      />

      {/* DETAILS MODAL */}
      <Modal visible={detailsModal} animationType="slide">
        <SafeAreaView style={{flex:1,backgroundColor:"#F5F6FA"}}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedEvent && (
              <>
                <View style={styles.detailsHeaderRow}>
                  <TouchableOpacity style={styles.backBtn} onPress={()=>setDetailsModal(false)}>
                    <Ionicons name="chevron-back" size={22} color="#000"/><Text style={styles.backText}>Back</Text>
                  </TouchableOpacity>
                  <View style={{flexDirection:"row",gap:10}}>
                    <TouchableOpacity style={styles.detailsEditBtn} onPress={()=>{setDetailsModal(false);openEditModal(selectedEvent);}}>
                      <Feather name="edit" size={16} color={PRIMARY}/><Text style={{color:PRIMARY,fontWeight:"700",marginLeft:4}}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.detailsDeleteBtn} onPress={()=>deleteEvent(selectedEvent.event_id)}>
                      <Feather name="trash-2" size={16} color="#EF4444"/><Text style={{color:"#EF4444",fontWeight:"700",marginLeft:4}}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.titleStatusRow}>
                  <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
                  <View style={[styles.statusBadge,selectedEvent.status==="Upcoming"?styles.upcoming:styles.completed]}>
                    <Text style={styles.statusText}>{selectedEvent.status}</Text>
                  </View>
                </View>

                <View style={styles.quickInfoRow}>
                  {[
                    {icon:"calendar-outline",text:new Date(selectedEvent.event_date).toLocaleDateString()},
                    {icon:"time-outline",text:selectedEvent.event_time},
                    {icon:"location-outline",text:selectedEvent.venue},
                  ].map((q,i)=>(
                    <View key={i} style={styles.quickInfoItem}>
                      <Ionicons name={q.icon as any} size={18} color="#555"/>
                      <Text style={styles.quickInfoText}>{q.text}</Text>
                    </View>
                  ))}
                </View>

                {selectedEvent.cover_photo ? <Image source={{uri:API+selectedEvent.cover_photo}} style={styles.detailCover}/> : null}

                {selectedEvent.status==="Upcoming" && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionCardTitle}>Event Countdown</Text>
                    <View style={styles.countdownRow}>
                      {[{v:countdown.days,l:"Days"},{v:countdown.hours,l:"Hours"},{v:countdown.minutes,l:"Min"},{v:countdown.seconds,l:"Sec"}].map((c,i)=>(
                        <View key={i} style={styles.countBox}><Text style={styles.countNum}>{c.v}</Text><Text style={styles.countLbl}>{c.l}</Text></View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>Event Details</Text>
                  <DetailRow icon="document-text-outline" label="Description" value={selectedEvent.description}/>
                  <DetailRow icon="location-outline"      label="Venue"       value={selectedEvent.venue}/>
                  <DetailRow icon="people-outline"        label="Capacity"    value={`${selectedEvent.capacity} People`}/>
                  <DetailRow icon="calendar-outline"      label="Date"        value={new Date(selectedEvent.event_date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}/>
                  <DetailRow icon="time-outline"          label="Time"        value={selectedEvent.event_time}/>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionCardTitle}>RSVP Overview</Text>
                  <View style={styles.rsvpRow}>
                    {[{label:"Going",v:rsvp.going,bg:"#DCFCE7"},{label:"Maybe",v:rsvp.maybe,bg:"#FEF3C7"},{label:"Not Going",v:rsvp.notGoing,bg:"#FEE2E2"}].map((r,i)=>(
                      <View key={i} style={[styles.rsvpBox,{backgroundColor:r.bg}]}>
                        <Text style={styles.rsvpNum}>{r.v}</Text><Text style={styles.rsvpLbl}>{r.label}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.rsvpTotal}>Total responses: {rsvp.total} / {selectedEvent.capacity}</Text>
                </View>

                {selectedEvent.status==="Completed" && (
                  <>
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionCardTitle}>Upload Event Photos</Text>
                      <TouchableOpacity style={styles.uploadBox} onPress={pickGalleryImages}>
                        <Ionicons name="cloud-upload-outline" size={36} color={PRIMARY}/>
                        <Text style={styles.uploadTitle}>Upload Photos</Text>
                        <Text style={styles.uploadSub}>Tap to select images</Text>
                      </TouchableOpacity>
                    </View>
                    {gallery.length>0 && (
                      <View style={styles.sectionCard}>
                        <Text style={styles.sectionCardTitle}>Event Gallery</Text>
                        <FlatList horizontal data={gallery} keyExtractor={i=>i.gallery_id.toString()}
                          renderItem={({item})=><Image source={{uri:API+item.photo_url}} style={styles.galleryImage}/>}
                          showsHorizontalScrollIndicator={false}
                        />
                      </View>
                    )}
                  </>
                )}

                <View style={[styles.sectionCard,{marginBottom:40}]}>
                  <Text style={styles.sectionCardTitle}>Event Timeline</Text>
                  <View style={styles.timelineRow}>
                    {["Created","Published","Event Day"].map((step,i)=>(
                      <React.Fragment key={i}>
                        <View style={styles.timelineItem}>
                          <View style={styles.timelineCircle}>
                            {i<2?<MaterialIcons name="check" size={14} color="#fff"/>:<Text style={{color:"#fff",fontWeight:"700"}}>{i+1}</Text>}
                          </View>
                          <Text style={styles.timelineText}>{step}</Text>
                        </View>
                        {i<2&&<View style={styles.timelineLine}/>}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: "#f8fafc" },
  topBar: { height: 62, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", elevation: 3 },
  topTitle: { fontSize: 17, fontWeight: "700" },

  pageHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  breadcrumb:      { fontSize: 11, color: "#9ca3af" },
  pageTitle:       { fontSize: 26, fontWeight: "800", color: "#111", letterSpacing: -0.5, marginTop: 3 },
  pageHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  viewSwitcher:    { flexDirection: "row", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 3 },
  viewBtn:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  viewBtnActive:   { backgroundColor: PRIMARY },
  addBtn:          { backgroundColor: PRIMARY, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText:      { color: "#fff", fontWeight: "700", fontSize: 13 },

  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  kpiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  kpiTrend: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  kpiTrendText: { fontSize: 9, fontWeight: "700" },
  kpiValue: { fontSize: 26, fontWeight: "800", color: "#111", letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: "600" },

  tabsScroll: { marginBottom: 16 },
  tabsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 2 },
  tabChip: { backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  tabChipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  tabChipText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  tabChipTextActive: { color: "#fff" },

  cardsGrid:        { gap: 14 },
  cardsGridDesktop: { flexDirection: "row", flexWrap: "wrap" },
  mCard:     { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  mCover:    { height: 150, position: "relative" },
  dateBadge: { position: "absolute", top: 12, left: 12, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, alignItems: "center", minWidth: 44 },
  dateMonth: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, color: "#6b7280" },
  dateDay:   { fontSize: 20, fontWeight: "800", color: "#111" },
  statusUpcoming: { position: "absolute", top: 12, right: 12, backgroundColor: "#10b981", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 4 },
  statusDone:     { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot:  { width: 6, height: 6, backgroundColor: "#fff", borderRadius: 3 },
  statusTxt:  { fontSize: 9, color: "#fff", fontWeight: "700" },
  coverBottom: { position: "absolute", bottom: 10, left: 12, right: 12 },
  coverTitle:  { fontSize: 16, fontWeight: "800", color: "#fff" },
  coverSub:    { fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 2 },
  mCardBody:   { padding: 12 },
  metaRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  meta:        { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText:    { fontSize: 11, color: "#6b7280" },
  actionsRow:  { flexDirection: "row", gap: 8 },
  actionBtn:   { flex: 1, paddingVertical: 9, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  editBtnCard:   { backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 4 },
  editBtnText:   { color: "#fff", fontWeight: "700", fontSize: 12 },
  deleteBtnCard: { backgroundColor: "#fef2f2", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 4 },
  deleteBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 12 },

  tableContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 16, overflow: "hidden" },
  tableHead:      { flexDirection: "row", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", alignItems: "center" },
  tableImage: {
    width: 90,
    height: 58,
    borderRadius: 10,
    marginRight: 20,
    flexShrink: 0,
  },
  
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  
  headText: {
    fontWeight: "700",
    color: "#9ca3af",
    fontSize: 12,
  },
  
  rowText: {
    fontSize: 13,
    color: "#374151",
  },

  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, alignSelf: "flex-start" },
  upcoming:    { backgroundColor: "#DCFCE7" },
  completed:   { backgroundColor: "#E5E7EB" },
  statusText:  { fontWeight: "700", fontSize: 11 },

  modalScroll:       { flex: 1, backgroundColor: "#fff", padding: 20 },
  modalHeader:       { flexDirection: "row", alignItems: "center", marginBottom: 24, marginTop: 10 },
  modalBackBtn:      { flexDirection: "row", alignItems: "center", marginRight: 16 },
  modalBackText:     { fontSize: 15, fontWeight: "600", marginLeft: 4 },
  modalTitle:        { fontSize: 22, fontWeight: "800" },
  input:             { height: 54, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingHorizontal: 14, justifyContent: "center", marginBottom: 14, backgroundColor: "#f8fafc", fontSize: 14 },
  imagePickBtn:      { height: 54, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, backgroundColor: "#f8fafc" },
  imagePickText:     { color: PRIMARY, fontWeight: "700" },
  preview:           { width: "100%", height: 200, borderRadius: 14, marginBottom: 16 },
  submitBtn:         { backgroundColor: PRIMARY, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  submitBtnText:     { color: "#fff", fontWeight: "800", fontSize: 16 },
  cancelTextBtn:     { alignItems: "center", marginTop: 16 },
  cancelTextBtnText: { color: "#dc2626", fontWeight: "700" },

  detailsHeaderRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 18 },
  backBtn:           { flexDirection: "row", alignItems: "center" },
  backText:          { fontSize: 15, fontWeight: "600", marginLeft: 4 },
  detailsEditBtn:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: PRIMARY },
  detailsDeleteBtn:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: "#EF4444" },
  titleStatusRow:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, marginTop: 6 },
  detailTitle:       { fontSize: 26, fontWeight: "800", flex: 1, color: "#111" },
  quickInfoRow:      { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 18, marginTop: 14, gap: 14 },
  quickInfoItem:     { flexDirection: "row", alignItems: "center", gap: 6 },
  quickInfoText:     { fontSize: 13, color: "#444", fontWeight: "500" },
  detailCover:       { width: "96%", height: 220, borderRadius: 16, alignSelf: "center", marginTop: 16, marginBottom: 4 },
  sectionCard:       { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 18 },
  sectionCardTitle:  { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  detailRow:         { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6" },
  detailLabel:       { fontSize: 12, color: "#9ca3af", fontWeight: "600" },
  detailValue:       { fontSize: 14, color: "#374151", marginTop: 2 },

  countdownRow: { flexDirection: "row", justifyContent: "space-between" },
  countBox:     { flex: 1, backgroundColor: "#f8fafc", borderRadius: 14, padding: 12, alignItems: "center", marginHorizontal: 4 },
  countNum:     { fontSize: 26, fontWeight: "800", color: "#111" },
  countLbl:     { fontSize: 11, color: "#9ca3af", marginTop: 4 },

  rsvpRow:   { flexDirection: "row", gap: 8, marginBottom: 12 },
  rsvpBox:   { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  rsvpNum:   { fontSize: 22, fontWeight: "800" },
  rsvpLbl:   { fontSize: 11, fontWeight: "600", marginTop: 4 },
  rsvpTotal: { fontSize: 13, color: "#6b7280", fontWeight: "600" },

  uploadBox:    { borderWidth: 2, borderStyle: "dashed", borderColor: "#c7d2fe", borderRadius: 16, paddingVertical: 30, alignItems: "center" },
  uploadTitle:  { fontSize: 16, fontWeight: "700", marginTop: 8, color: PRIMARY },
  uploadSub:    { color: "#9ca3af", marginTop: 4 },
  galleryImage: { width: 150, height: 120, borderRadius: 14, marginRight: 12 },

  timelineRow:    { flexDirection: "row", alignItems: "center" },
  timelineItem:   { alignItems: "center" },
  timelineCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
  timelineText:   { marginTop: 6, fontWeight: "600", fontSize: 11 },
  timelineLine:   { flex: 1, height: 3, backgroundColor: "#D1D5DB", marginHorizontal: 8 },

  fab:      { position: "absolute", bottom: 28, right: 22 },
  fabInner: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  emptyBox:  { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 15, color: "#9ca3af", fontWeight: "600", marginTop: 12 },
});
